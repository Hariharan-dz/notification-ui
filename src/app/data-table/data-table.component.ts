import { Component, OnInit, ViewChild, ElementRef, Input, ChangeDetectionStrategy } from '@angular/core';

import { MatTableDataSource } from '@angular/material/table';
import { MatPaginator, PageEvent } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { NotificationUiService } from '../services/notification-ui.service';

@Component({
  selector: 'app-data-table',
  templateUrl: './data-table.component.html',
  styleUrls: ['./data-table.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class DataTableComponent implements OnInit {

  @Input() tableDetails: any;

  displayedColumns: any = [];
  dataSource: any;
  pageSize: number = 10;
  records: any = [];

  totalCount: any;

  @ViewChild(MatPaginator) paginators!: MatPaginator;
  @ViewChild(MatSort) sorts!: MatSort;

  @ViewChild('mytable', { read: ElementRef }) public widgetsContent!: ElementRef<any>;
  isLoading = true;

  constructor(private notifiService: NotificationUiService) { }

  ngOnInit() { }

  ngAfterViewInit() {
    this.init(this.tableDetails.showLoader == false ? false : true);
    if (this.tableDetails.pageSize) this.pageSize = this.tableDetails.pageSize;
  }

  resetAll() {
    this.records = [];
    this.tableDetails.totalCount = this.totalCount = 0;
    if (this.dataSource) this.dataSource.data = [];
  }

  async init(showLoader: boolean = true) {
    try {
      this.isLoading = true;
      if (showLoader) this.notifiService.showLoader();
      this.resetAll();
      this.initDataSource();
      await this.getRecordsAndLoadData({ offset: 0, limit: this.notifiService.default_limit });
    } catch (err: any) {
      err = err.error || err;
      this.notifiService.toster.error(err.message || 'Failed');
    }
    this.isLoading = false;
    if (showLoader) this.notifiService.hideLoader();
  }

  getParams(params: any) {
    if (this.tableDetails.needServerSidePagination) {
      Object.keys(this.tableDetails.filterCriteria || {}).forEach((key: string) => {
        var value = this.tableDetails.filterCriteria[key];
        if (value != null) {
          value = value instanceof Array ? value.join(',') : value;
          if (value != '') params[key] = value;
        }
      });
      return params;
    }
    return null;
  }

  async getRecordsAndLoadData(params: any) {
    const result = await this.tableDetails.getRecord(this.getParams(params)).toPromise();
    var records: any = null;
    var totalCount = null
    if (result instanceof Array) {
      records = result;
      totalCount = records.length;
    } else {
      records = result.records;
      totalCount = result._metadata.total_count;
    }
    this.loadData(records, totalCount);
  }

  initDataSource() {
    if (!this.dataSource) {
      this.displayedColumns = this.tableDetails.fields.map((obj: any) => obj.attr);
      this.displayedColumns.push('final');
      this.dataSource = new MatTableDataSource();
      this.dataSource.sort = this.sorts;
      this.dataSource.paginator = this.paginators;
      this.paginators._intl.itemsPerPageLabel = 'Display';
    }
  }

  loadData(records: any, totalCount: any) {
    this.tableDetails.totalCount = this.totalCount = totalCount;

    this.records = this.records.concat(this.tableDetails.buildData(records));
    this.renderData();
  }

  renderData() {
    this.dataSource.data = this.tableDetails.getFilteredRecords ? this.tableDetails.getFilteredRecords(this.records) : this.records;
    this.search();
    this.tableDetails.isRendered = true;
  }

  search() {
    this.dataSource.filter = this.tableDetails.search.trim().toLowerCase();
    if (!this.dataSource.filter) this.renderPaginationCount();
  }

  async applyFilterCriteria() {
    this.notifiService.showLoader();
    try {
      if (this.tableDetails.needServerSidePagination) {
        this.resetAll();
        await this.getRecordsAndLoadData({ offset: 0, limit: this.notifiService.default_limit });
      } else {
        this.renderData();
      }
    } catch (err: any) {
      err = err.error || err;
      this.notifiService.toster.error(err.message || 'Failed');
    }
    this.notifiService.hideLoader();

  }

  scrollRight() {
    this.widgetsContent.nativeElement.scrollLeft += 340;
  }

  renderPaginationCount() {
    if (this.totalCount != this.records.length) {
      setTimeout(() => this.paginators.length = this.totalCount, 100);
    }
  }

  async pageChanged(event: PageEvent) {
    // alert('d')
    // console.log(event, 'sad')
    if (!this.tableDetails.needServerSidePagination) return;
    var recordCount = this.records.length;
    var currentPageTotalCount = event.pageSize * (event.pageIndex + 1);
    if (this.totalCount != recordCount && currentPageTotalCount > recordCount) {
      this.notifiService.showLoader();
      try {
        await this.getRecordsAndLoadData({ offset: event.pageSize * event.pageIndex, limit: this.notifiService.default_limit });
        setTimeout(() => {
          this.paginators.pageIndex = event.pageIndex;
          this.paginators.length = this.totalCount;
          this.notifiService.hideLoader();

          // this.paginators.pageIndex = 2;

        }, 100);
      } catch (err: any) {
        err = err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    }
  }
}
