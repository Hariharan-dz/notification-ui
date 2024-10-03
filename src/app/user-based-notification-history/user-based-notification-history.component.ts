import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { ActivatedRoute, Params } from '@angular/router';
import { AlertController, LoadingController, ModalController, ToastController } from '@ionic/angular';
import { NotificationUiService } from '../services/notification-ui.service';
import { TemplatePageComponent } from '../template-page/template-page.component';
import { DataTableComponent } from '../data-table/data-table.component';
import { Chart } from 'chart.js';

@Component({
  selector: 'user-based-notification-history',
  templateUrl: './user-based-notification-history.component.html',
  styleUrls: ['./user-based-notification-history.component.scss'],
})
export class UserBasedNotificationHistoryComponent implements OnInit {

  view: string = 'QUEUE';
  chartList: any = [];
  user: any = {};
  isInitTriggered: boolean = false;
  user_id: any;
  summary: any = {};

  // user segment changes (Error and Failed)
  submittedDeferredSegment: boolean = true;
  submittedErrorViewSegment: boolean = false;
  errorReason = {
    isModelOpen: false,
    data: ''
  }

  submittedErrorNotificationList: any = {
    name: "submittedErrorNotificationList",
    pk: 'id',
    search: "",
    needServerSidePagination: true,
    showLoader: false,
    pageSize: 5,
    filterCriteria: { status: "ERROR,FAILED,UNKNOWN_IDENTIFIER" },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "Notification ID", attr: "notification_id", width: "160", type: "LINK" },
      { name: "Category", attr: "category_name", width: "160" },
      { name: "Channel", attr: "channel", width: "100", type: "IMAGE_LIST" },
      { name: "Identifier", attr: "identifier", width: "135" },
      { name: "Priority", attr: "priority", width: "115", className: "textCapitalize" },
      { name: "Status", attr: "status", width: "100" },
      { name: "Created Time", attr: "createdAt", width: "175" },
    ],
    actions: [
      { name: ' View Message', clickFunction: (el: any) => this.viewMessage(el.id, 'HISTORY') },
      { name: "View Reason", clickFunction: (el: any) => this.viewMessage(el.id, 'HISTORY', true), isValid: (el: any) => el.status != 'CHANNEL_NOT_FOUND' }

    ],
    getRecord: (params: any) => this.notifiService.getNotificationHistoryByUserIdWithStatus(this.user_id, params),
    buildData: (sentNotification: any) => {
      return sentNotification.map((sentNotification: any) => {
        var channel: any = [];
        if (sentNotification.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
        if (sentNotification.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
        if (sentNotification.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
        if (sentNotification.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (sentNotification.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        return {
          id: sentNotification.id,
          notification_id: sentNotification.notification_id,
          category_name: sentNotification.category_name,
          channel: channel,
          identifier: sentNotification.identifier,
          priority: sentNotification.priority,
          status: sentNotification.status == 'UNKNOWN_IDENTIFIER' ? 'ERROR' : sentNotification.status,
          createdAt: this.datePipe.transform(sentNotification.createdAt, this.notifiService.date_time_format),
          link: {
            notification_id: '/notification/' + sentNotification.notification_id + '/history'
          },
          action: {}
        };
      });
    }
  };

  submittedDeferredNotificationList: any = {
    name: "submittedDeferredNotificationList",
    pk: 'id',
    search: "",
    needServerSidePagination: true,
    showLoader: false,
    pageSize: 5,
    filterCriteria: { status: "QUEUED,DEFERRED" },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "Notification ID", attr: "notification_id", width: "160", type: "LINK" },
      { name: "Category", attr: "category_name", width: "160" },
      { name: "Channel", attr: "channel", width: "100", type: "IMAGE_LIST" },
      { name: "Identifier", attr: "identifier", width: "160" },
      { name: "Priority", attr: "priority", width: "150", className: "textCapitalize" },
      { name: "Status", attr: "status", width: "135" },
      { name: "Reason", attr: "deferred_reason", width: "120" },
      { name: "Scheduled Time", attr: "scheduled_at", width: "175" },
    ],
    actions: [
      { name: ' View Message', clickFunction: (el: any) => this.viewMessage(el.id, 'QUEUED') },
    ],
    getRecord: (params: any) => this.notifiService.getNotificationQueueByUserIdWithStatus(this.user_id, params),
    buildData: (submitdefer: any) => {
      return submitdefer.map((submitdefer: any) => {
        var channel: any = [];
        if (submitdefer.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
        if (submitdefer.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
        if (submitdefer.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
        if (submitdefer.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (submitdefer.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        return {
          id: submitdefer.id,
          notification_id: submitdefer.notification_id,
          category_name: submitdefer.category_name,
          channel: channel,
          identifier: submitdefer.identifier,
          priority: submitdefer.priority,
          deferred_reason: submitdefer.deferred_reason,
          status: submitdefer.status,
          scheduled_at: this.datePipe.transform(submitdefer.scheduled_at, this.notifiService.date_time_format),
          link: {
            notification_id: submitdefer.is_ab_testing ? '/ab-testing/result/' + submitdefer.notification_id : '/notification/' + submitdefer.notification_id + '/history'
          },
          action: {

          }
        };
      });
    }
  };

  deliveredNotificationList: any = {
    name: "deliveredNotification",
    pk: 'id',
    search: "",
    needServerSidePagination: true,
    showLoader: false,
    pageSize: 5,
    filterCriteria: { status: "SENT,DELIVERED,VIEWED" },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "Notification ID", attr: "notification_id", width: "160", type: "LINK" },
      { name: "Category", attr: "category_name", width: "160" },
      { name: "Channel", attr: "channel", width: "100", type: "IMAGE_LIST" },
      { name: "Identifier", attr: "identifier", width: "135" },
      { name: "Priority", attr: "priority", width: "115", className: "textCapitalize" },
      { name: "Status", attr: "status", width: "115" },
      { name: "Created Time", attr: "createdAt", width: "175" },
    ],
    actions: [
      { name: ' View Message', clickFunction: (el: any) => this.viewMessage(el.id, 'HISTORY') },
    ],
    getRecord: (params: any) => this.notifiService.getNotificationHistoryByUserIdWithStatus(this.user_id, params),
    buildData: (deliveredNotification: any) => {
      return deliveredNotification.map((deliveredNotification: any) => {
        var channel: any = [];
        if (deliveredNotification.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
        if (deliveredNotification.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
        if (deliveredNotification.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
        if (deliveredNotification.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (deliveredNotification.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        return {
          id: deliveredNotification.id,
          notification_id: deliveredNotification.notification_id,
          category_name: deliveredNotification.category_name,
          channel: channel,
          identifier: deliveredNotification.identifier,
          priority: deliveredNotification.priority,
          status: deliveredNotification.status,
          createdAt: this.datePipe.transform(deliveredNotification.createdAt, this.notifiService.date_time_format),
          link: {
            notification_id: deliveredNotification.is_ab_testing ? '/ab-testing/result/' + deliveredNotification.notification_id : '/notification/' + deliveredNotification.notification_id + '/history'
          },
          action: {

          }
        };
      });
    }
  };

  @ViewChild('errorNotification_grid') errorNotificationGrid: DataTableComponent | undefined;
  @ViewChild('queuedNotification_grid') queuedNotificationGrid: DataTableComponent | undefined;
  @ViewChild('sentNotification_grid') sentNotificationGrid: DataTableComponent | undefined;
  @ViewChild('deferredNotification_grid') deferredNotificationGrid: DataTableComponent | undefined;

  constructor(private datePipe: DatePipe, public notifiService: NotificationUiService,
    private modalController: ModalController, private actRouter: ActivatedRoute,
    public loadingCtrl: LoadingController) { }

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
    this.actRouter.paramMap.subscribe((param: Params) => {
      this.user_id = param['get']('user_id');
      this.getAllUserProfileByID(this.user_id);
      this.getUserNotificationSummary();
    });
  }

  // new content
  getUserNotificationSummary() {
    this.notifiService.getUserNotificationSummary(this.user_id).subscribe({
      next: (summary: any) => {
        this.summary = summary;
        this.chartList = [];
        const { delivered, submitted } = this.summary;
        this.chartList.push(this.getBarChartData('Email', delivered.channels.EMAIL, submitted.channels.EMAIL));
        this.chartList.push(this.getBarChartData('SMS', delivered.channels.SMS, submitted.channels.SMS));
        this.chartList.push(this.getBarChartData('Web Push', delivered.channels.WEB_PUSH, submitted.channels.WEB_PUSH));
        this.chartList.push(this.getBarChartData('Mobile Push', delivered.channels.MOBILE_PUSH, submitted.channels.MOBILE_PUSH));
        this.chartList.push(this.getBarChartData('In App', delivered.channels.IN_APP_MESSAGE, submitted.channels.IN_APP_MESSAGE));
      },
      error: (err: any) => {
        this.summary = {};
        err = err.error || { err };
      }
    });
  }

  getBarChartData(title: string, deliveredCount: number, submittedCount: number) {
    return {
      title,
      isNotApplicable: deliveredCount == 0 && submittedCount == 0,
      series: [deliveredCount, submittedCount],
      colors: ['var(--chart-series-1)', 'var(--chart-series-2)'],
      chart: {
        type: "donut",
        height: 200
      },
      dataLabels: {
        enabled: false
      },
      plotOptions: {
        pie: {
          donut: {
            labels: {
              show: true,
              total: {
                show: true,
                label: title,
                color: 'var(--chart-series-2)',
                fontSize: 16,
                fontWeight: 600,
                fontFamily: 'Inter',
                formatter: () => {
                  return deliveredCount + submittedCount;
                }
              }
            }
          }
        },
        radialBar: {
          hollow: {
            size: "50%"
          }
        }
      },
      labels: ['Delivered', 'Submitted'],
      legend: {
        show: false
      }
    }
  }

  viewMessage(id: string, type: string, isErrormessage?: boolean) {
    this.notifiService.showLoader();
    if (type == "HISTORY") {
      this.notifiService.getNotificationHistoryById(id).subscribe((data: any) => {
        if (isErrormessage) {
          this.errorReason.data = data.error_message;
          this.notifiService.hideLoader();
          this.errorReason.isModelOpen = true;
        }
        else {
          this.notifiService.hideLoader();
          this.modalPresent(data);
        }
      });
    } else if (type == "QUEUED") {
      this.notifiService.getNotificationQueueById(id).subscribe((data: any) => {
        this.notifiService.hideLoader();
        this.modalPresent(data);
      });
    }
  }

  async modalPresent(data: any, ErrorReason?: any) {
    try {
      var content = data.content;
      if (data.channel == 'MOBILE_PUSH') {
        if (content.image) content.image = { source_type: 'URL', url: content.image };
      } else if (data.channel == 'WEB_PUSH') {
        if (content.icon) content.icon = { source_type: 'URL', url: content.icon };
        if (content.image) content.image = { source_type: 'URL', url: content.image };
      }
      this.notifiService.hideLoader();
      var modal = await this.modalController.create({
        component: TemplatePageComponent,
        cssClass: ErrorReason ? 'isViewReason' : 'viewMessage',
        componentProps: {
          preview_channel: ErrorReason ? null : data.channel,
          content: content,
          isEmailReadOnly: true,
          isViewReason: ErrorReason,
          isPreviewPopup: true
        },
        backdropDismiss: false
      });

      if (ErrorReason !== undefined && ErrorReason === null) throw { message: "No error message available" }
      await modal.present();

    } catch (err: any) {
      this.notifiService.toster.error(err.message || err);
    }

  }


  scrollContent(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  // user_id

  getAllUserProfileByID(profileId: any) {
    this.notifiService.showLoader();
    this.notifiService.getAllUserProfileByID(profileId).subscribe({
      next: async (profile: any) => {
        this.user = profile;
        // this.countValue();
        // var tagObj: any = {};
        // (this.user.tags || []).forEach((tag: any) => tagObj[tag.field] = tag.value);
        // this.attributes = await this.notifiService.getAllAttribute().toPromise();
        // this.attributes.forEach((attribute: any) => attribute.value = tagObj[attribute.name]);
        this.notifiService.hideLoader();
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }

  switchView(view: string) {
    this.view = view;
  }
  cancel() {
    this.errorReason.isModelOpen = false;
    this.errorReason.data = '';
  }
  onWillDismiss(event: Event) {
    // this.cancel();
  }
}
