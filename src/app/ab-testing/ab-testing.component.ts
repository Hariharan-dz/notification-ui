import { DatePipe } from '@angular/common';
import { Component, OnInit, ViewChild } from '@angular/core';
import { AlertController, ModalController } from '@ionic/angular';
import { DataTableComponent } from '../data-table/data-table.component';
import { NotificationUiService } from '../services/notification-ui.service';

@Component({
  selector: 'app-ab-testing',
  templateUrl: './ab-testing.component.html',
  styleUrls: ['./ab-testing.component.scss'],
})
export class AbTestingComponent implements OnInit {
  isAbTesting: boolean = true;
  abTestingTableDetails: any = {
    name: "notification",
    pk: "id",
    search: "",
    filterCriteria: { is_ab_testing: true },
    needServerSidePagination: true,
    fields: [
      { name: "ID", attr: "id", width: "75", type: "LINK", },
      { name: "Category ", attr: "category_name", width: "135" },
      { name: "Channel", attr: "channels", width: "100", type: "IMAGE_LIST" },
      { name: "Audience % ", attr: "audience_percentage", width: "135" },
      { name: "Scheduled? ", attr: "is_scheduled", width: "100", className: "textCapitalize" },
      { name: "Status", attr: "status", width: "135" },
      { name: "Created Time", attr: "createdAt", width: "175" },
      { name: "Sent/Scheduled", attr: "sendOrScheduled", width: "175" },
    ],
    actions: [
      { name: "View Result", attr: 'view', isValid: (el: any) => el.is_processed },
      { name: "Edit", attr: 'edit', isValid: (el: any) => !el.is_processed },
      { name: "Clone", attr: 'clone' },
      { name: "Delete", clickFunction: (el: any) => this.confirmDelete(el.id) }
    ],
    getRecord: (params: any) => this.notifiService.getAllNotification(params, this.isAbTesting),
    buildData: (abTesing: any) => {
      return abTesing.map((abTesing: any) => {
        var channels: any = [];
        if (abTesing.channels.indexOf('EMAIL') !== -1) channels.push({ title: "Email", name: 'mail-outline' });
        if (abTesing.channels.indexOf('WEB_PUSH') !== -1) channels.push({ title: "Web Push", name: 'desktop-outline' });
        if (abTesing.channels.indexOf('MOBILE_PUSH') !== -1) channels.push({ title: "Mobile Push", name: 'phone-portrait-outline' });;
        if (abTesing.channels.indexOf('SMS') !== -1) channels.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (abTesing.channels.indexOf('IN_APP_MESSAGE') !== -1) channels.push({ title: "In App", name: 'apps-outline' });
        return {
          id: abTesing.id,
          user_type: abTesing.is_bulk_notification ? { src: "../../../assets/icon/multiUser.png", title: 'Multiple Users' } : { src: "../../../assets/icon/singleUser.png", title: 'Single User' },
          category_name: abTesing.category.name,
          channels: channels,
          audience_percentage: abTesing.variant_settings.audience_percentage + "%",
          is_scheduled: abTesing.is_scheduled ? 'yes' : 'no',
          createdAt: this.datePipe.transform(abTesing.createdAt, this.notifiService.date_time_format),
          updatedAt: this.datePipe.transform(abTesing.updatedAt, this.notifiService.date_time_format),
          sendOrScheduled: this.datePipe.transform(abTesing.status === 'TRIGGERED' ? abTesing.processed_at : (abTesing.is_scheduled ? abTesing.scheduled_at : null), this.notifiService.date_time_format),
          status: abTesing.status,
          is_processed: abTesing.is_processed,
          link: {
            id: abTesing.is_processed ? '/ab-testing/result/' + abTesing.id : '/ab-testing/' + abTesing.id
          },
          action: {
            view: '/ab-testing/result/' + abTesing.id,
            edit: '/ab-testing/' + abTesing.id,
            clone: '/ab-testing/clone/' + abTesing.id,
          }
        };
      });
    }
  };
  category_search = '';
  isInitTriggered: boolean = false;
  filterCriteria: any = {};

  categoryList: any = [];

  defaultFilterCriteria: any = {
    user_type: ["SINGLE", "MULTIPLE"],
    status: [],
    category_id: []
  };

  @ViewChild('abTesting_grid') abTesting_grid: DataTableComponent | undefined;

  constructor(public notifiService: NotificationUiService, private datePipe: DatePipe, private alertController: AlertController, private modalctrl: ModalController) {
    this.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
    this.abTestingTableDetails.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
  }

  ngOnInit() {
    this.init();
  }

  ionViewWillEnter() {
    this.init();
  }

  ionViewWillLeave() {
    this.isInitTriggered = false;
    this.notifiService.closeAllAlertCtrl();
  }

  init() {
    if (this.isInitTriggered) return;
    this.isInitTriggered = true;
    this.getAllCategory();
  }

  getAllCategory() {
    this.notifiService.getAllCategory().subscribe({
      next: (categoryList: any) => {
        this.categoryList = categoryList;
      },
      error: (err: any) => {
        err = err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }


  isFilterCriteriaChanged() {
    var source = this.abTestingTableDetails.filterCriteria;
    var dest = this.filterCriteria;
    const fieldList = ["user_type", "status", "category_id"];
    return fieldList.find((key: string) => {
      var sourceVal = source[key] || "";
      var destVal = dest[key] || "";
      sourceVal = sourceVal instanceof Array ? sourceVal.join(",") : sourceVal;
      destVal = destVal instanceof Array ? destVal.join(",") : destVal;
      return sourceVal != destVal;
    }) != null;
  }

  onSearch() {
    if (this.isFilterCriteriaChanged()) {
      this.abTestingTableDetails.filterCriteria = JSON.parse(JSON.stringify(this.filterCriteria));
      if (this.abTestingTableDetails.filterCriteria.user_type.length == 1) {
        this.abTestingTableDetails.filterCriteria.is_bulk_notification = this.abTestingTableDetails.filterCriteria.user_type[0] == 'MULTIPLE' ? 'true' : 'false';
      }
      this.abTesting_grid?.applyFilterCriteria();
    }
    this.modalctrl.dismiss()
  }

  onReset() {
    this.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
    if (this.isFilterCriteriaChanged()) {
      this.abTestingTableDetails.filterCriteria = JSON.parse(JSON.stringify(this.filterCriteria));
      this.abTesting_grid?.applyFilterCriteria();
    }
  }

  async confirmDelete(id: any) {
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: 'Changes you made will be deleted.',
      message: "<div class='warning-wraper'>" +
        "<div class='warning-title-wrapper'>" +
        "<ion-icon name='warning' class='icon-color'></ion-icon>" +
        "<ion-label class='warning-title'>Warning</ion-label>" +
        "</div>" +
        "<p class='warning-content'>By deleting the notification associated <span class='bold-text'>History</span> details will also removed. </p>" +
        "</div>",

      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Delete',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.deleteNotification(id);
          }
        },
      ],
    });
    alert.setAttribute('style', '--min-width:30vw;');
    await alert.present();
  }

  deleteNotification(id: any) {
    this.notifiService.showLoader();
    this.notifiService.deleteNotificationById(id, this.isAbTesting).subscribe({
      next: (data: any) => {
        this.notifiService.toster.success('A/B Testing Deleted successfully!');
        this.abTesting_grid?.init();
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error || err;
        this.notifiService.toster.error(err.message || 'A/B Testing Delete Failed');
      }
    });
  }
  onClose() {
    this.modalctrl.dismiss();
  }
}
