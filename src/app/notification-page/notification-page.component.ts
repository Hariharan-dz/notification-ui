import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { AlertController, LoadingController, ModalController } from '@ionic/angular';
import { NotificationUiService } from '../services/notification-ui.service';
import { DataTableComponent } from '../data-table/data-table.component';

@Component({
  selector: 'app-notification-page',
  templateUrl: './notification-page.component.html',
  styleUrls: ['./notification-page.component.scss'],
})
export class NotificationPageComponent implements OnInit {
  category_search = "";
  isAbTesting: boolean = false;
  notificationTableDetails: any = {
    name: "notification",
    pk: "id",
    search: "",
    filterCriteria: { is_ab_testing: false },
    needServerSidePagination: true,
    fields: [
      { name: "ID", attr: "id", width: "75", type: "LINK", },
      { name: "Single/Multi ", attr: "user_type", width: "100", type: "IMAGE" },
      { name: "Category ", attr: "category_name", width: "175" },
      { name: "Channel", attr: "channels", width: "135", type: "IMAGE_LIST" },
      { name: "Scheduled? ", attr: "is_scheduled", width: "115", className: "textCapitalize" },
      { name: "Created Time", attr: "createdAt", width: "175" },
      { name: "Sent/Scheduled", attr: "sendOrScheduled", width: "175" },
      { name: "Status", attr: "status", width: "120" },
    ],
    actions: [
      { name: "View", attr: 'view', isValid: (el: any) => el.is_processed },
      { name: "Edit", attr: 'edit', isValid: (el: any) => !el.is_processed },
      { name: "Clone", attr: 'clone' },
      { name: "Delete", clickFunction: (el: any) => this.confirmDelete(el.id) }
    ],
    getRecord: (params: any) => this.notifiService.getAllNotification(params, this.isAbTesting),
    buildData: (notification: any) => {
      return notification.map((notification: any) => {
        var channels: any = [];
        if (notification.channels.indexOf('EMAIL') !== -1) channels.push({ title: "Email", name: 'mail-outline' });
        if (notification.channels.indexOf('WEB_PUSH') !== -1) channels.push({ title: "Web Push", name: 'desktop-outline' });
        if (notification.channels.indexOf('MOBILE_PUSH') !== -1) channels.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
        if (notification.channels.indexOf('SMS') !== -1) channels.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (notification.channels.indexOf('IN_APP_MESSAGE') !== -1) channels.push({ title: "In App", name: 'apps-outline' });

        return {
          id: notification.id,
          user_type: notification.is_bulk_notification ? { src: "../../../assets/icons/" + this.notifiService.themeName + "/multiuser.png", title: 'Multiple Users' } : { src: "../../../assets/icons/" + this.notifiService.themeName + "/singleuser.png", title: 'Single User' },
          UserType: notification.is_bulk_notification ? 'Multiple Users' : 'Single User',
          category_name: notification.category.name,
          channels: channels,
          is_scheduled: notification.is_scheduled ? 'yes' : 'no',
          createdAt: this.datePipe.transform(notification.createdAt, this.notifiService.date_time_format),
          updatedAt: this.datePipe.transform(notification.updatedAt, this.notifiService.date_time_format),
          sendOrScheduled: this.datePipe.transform(notification.status === 'TRIGGERED' ? notification.processed_at : (notification.is_scheduled ? notification.scheduled_at : null), this.notifiService.date_time_format),
          status: notification.status,
          is_processed: notification.is_processed,
          link: {
            id: notification.is_processed ? '/notification/' + notification.id + '/history' : '/notification/' + notification.id
          },
          action: {
            view: '/notification/' + notification.id + '/history',
            edit: '/notification/' + notification.id,
            clone: '/notification/clone/' + notification.id,
          }
        };
      });
    }
  };

  notificationList: any = [];
  categoryList: any = [];

  date = 12 / 2 / 2021;

  @ViewChild('notification_grid') notification_grid: DataTableComponent | undefined;

  defaultFilterCriteria: any = {
    user_type: [],
    status: [],
    category_id: []
  };
  filterCriteria: any = {};

  constructor(private datePipe: DatePipe, public notifiService: NotificationUiService,
    private alertController: AlertController, public loadingCtrl: LoadingController, public modalctrl: ModalController) {
    this.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
    this.notificationTableDetails.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
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

  deleteNotification(id: any) {
    this.notifiService.showLoader();
    this.notifiService.deleteNotificationById(id, false).subscribe({
      next: (data: any) => {
        this.notifiService.toster.success('Notification Deleted successfully!');
        this.notification_grid?.init();
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error || err;
        this.notifiService.toster.error(err.message || 'Notification Delete Failed');
      }
    });
  }

  async confirmDelete(id: any) {
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: 'Changes you made will be deleted.',
      message: "<div class='warning-wraper ion-margin'>" +
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

  isFilterCriteriaChanged() {
    var source = this.notificationTableDetails.filterCriteria;
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
      this.notificationTableDetails.filterCriteria = JSON.parse(JSON.stringify(this.filterCriteria));
      if (this.notificationTableDetails.filterCriteria.user_type.length == 1) {
        this.notificationTableDetails.filterCriteria.is_bulk_notification = this.notificationTableDetails.filterCriteria.user_type[0] == 'MULTIPLE' ? 'true' : 'false';
      }
      this.notification_grid?.applyFilterCriteria();
    }
    this.modalctrl.dismiss();
  }

  onReset() {
    this.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
    if (this.isFilterCriteriaChanged()) {
      this.notificationTableDetails.filterCriteria = JSON.parse(JSON.stringify(this.filterCriteria));
      this.notification_grid?.applyFilterCriteria();
    }
  }
  onClose() {
    this.modalctrl.dismiss();
  }
}
