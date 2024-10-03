import { Component, OnInit, Optional, ViewChild } from '@angular/core';
import { IonRouterOutlet, ModalController, Platform } from '@ionic/angular';

import { AlertController } from '@ionic/angular';

import { NotificationUiService } from '../../services/notification-ui.service';
import { ConfigCategoryDeleteModalComponent } from './config-category-delete-modal/config-category-delete-modal.component';
import { DataTableComponent } from 'src/app/data-table/data-table.component';
import { DatePipe } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-config-category',
  templateUrl: './config-category.html',
  styleUrls: ['./config-category.scss']
})
export class ConfigCategory implements OnInit {

  categoryTableDetails: any = {
    name: "category",
    pk: "id",
    search: "",
    needServerSidePagination: false,
    fields: [
      { name: "ID", attr: "id", width: "75", type: "LINK" },
      { name: "Name", attr: "name", width: "175" },
      { name: "Priority", attr: "priority", width: "135", className: "textCapitalize" },
      { name: "Time To Live", attr: "ttl", width: "150" },
      { name: "Rate Limit", attr: "rate_limit", width: "135", className: "textCapitalize" },
      { name: "Updated Time", attr: "updatedAt", width: "175" },
    ],
    actions: [
      { name: "Edit", attr: 'edit' },
      { name: "Clone", attr: 'clone' },
      { name: "View Template", attr: 'view_template' },
      { name: "Disable", clickFunction: (el: any) => this.confirmDelete(el, 'disabled') }
    ],
    getRecord: (params: any) => this.notifiService.getAllCategory(params),
    buildData: (categoryList: any) => {
      return categoryList.map((category: any) => {
        return {
          id: category.id,
          name: category.name,
          priority: category.priority,
          ttl: (category.ttl ? (category.ttl == '1' ? category.ttl + ' Day' : category.ttl + ' Days') : '') || '-',
          rate_limit: category.rate_limit || '-',
          updatedAt: this.datePipe.transform(category.updatedAt, this.notifiService.date_time_format),
          link: {
            id: '/configuration/category/' + category.id
          },
          action: {
            edit: '/configuration/category/' + category.id,
            clone: '/configuration/category/clone/' + category.id,
            view_template: '/configuration/template',
            view_template_queryParam: { category_id: category.id },
          }
        };
      });
    }
  };

  @ViewChild('category_grid') categoryGrid: DataTableComponent | undefined;


  selectedCategory: any = null;
  @Optional() private routerOutlet?: IonRouterOutlet;
  constructor(public notifiService: NotificationUiService, private modalController: ModalController, private route: Router,
    private alertController: AlertController, private datePipe: DatePipe,) {
  }

  isInitTriggered: boolean = false;
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
  }

  deleteCategorty(id: any) {
    this.notifiService.showLoader();
    this.notifiService.deleteCategoryById(id).subscribe({
      next: (data: any) => {
        this.notifiService.toster.success('Category Disabled successfully!');
        this.categoryGrid?.init();
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error || err;
        if (err.CUSTOM_ERROR_CODE == 1001) {
          this.openActionDeniedModel();
        } else {
          this.notifiService.toster.error(err.message || 'Category Disable Failed');
        }
      }
    });
  }

  async confirmDelete(category: any, status?: any) {
    this.selectedCategory = category;
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: `Changes you made will be ${status}.`,
      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Disable',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.deleteCategorty(category.id);
          }
        },
      ],
    });
    await alert.present();
  }

  async openActionDeniedModel() {
    let categoryList: any = await this.notifiService.getAllCategory().toPromise();
    const modal = await this.modalController.create({
      component: ConfigCategoryDeleteModalComponent,
      cssClass: 'sizeModal',
      componentProps: {
        category: this.selectedCategory,
        categoryList: categoryList.filter((category: any) => category.id != this.selectedCategory.id),
        deleteEvent: (id: any) => {
          this.deleteCategorty(id);
        }
      },
      backdropDismiss: false
    });
    await modal.present();

  }

}
