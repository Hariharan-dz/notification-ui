import { Component, ElementRef, OnInit, ViewChild, AfterViewInit } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { NotificationUiService } from '../services/notification-ui.service';
import { format, parseISO } from 'date-fns';
import { ModalController } from '@ionic/angular';
import { TemplatePageComponent } from '../template-page/template-page.component';
import { DatePipe } from '@angular/common';
@Component({
  selector: 'app-notification-history',
  templateUrl: './notification-history.component.html',
  styleUrls: ['./notification-history.component.scss'],
})
export class NotificationHistoryComponent implements OnInit {

  isViewReason: boolean = false;

  submittedErrorNotificationList: any = {
    name: "submittedErrorNotificationList",
    pk: "id",
    search: "",
    needServerSidePagination: true,
    showLoader: false,
    pageSize: 5,
    filterCriteria: { status: "ERROR,FAILED,UNKNOWN_IDENTIFIER" },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "User Id", attr: "user_id", width: "115", type: "LINK" },
      { name: "Category", attr: "category_name", width: "160" },
      { name: "Channel", attr: "channel", width: "100", type: "IMAGE_LIST" },
      { name: "Identifier", attr: "identifier", width: "160" },
      { name: "Priority", attr: "priority", width: "135", className: "textCapitalize" },
      { name: "Status", attr: "status", width: "100", },
      { name: "Created Time", attr: "createdAt", width: "175" },
    ],
    actions: [
      { name: "View Message", clickFunction: (el: any) => this.viewMessage(el.id, 'HISTORY') },
      { name: "View Reason", clickFunction: (el: any) => this.viewMessage(el.id, 'HISTORY', true), isValid: (el: any) => el.status != 'CHANNEL_NOT_FOUND' }
    ],
    getRecord: (params: any) => this.isAbTesting ?
      this.notifiService.getNotificationHistoryByNotificationIdAndVariantIdWithStatus(this.notification_id, this.variant_id, params)
      : this.notifiService.getNotificationHistoryByNotificationIdWithStatus(this.notification_id, params),
    buildData: (notificationList: any) => {
      return notificationList.map((notification: any) => {
        var channel: any = [];
        if (notification.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
        if (notification.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
        if (notification.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
        if (notification.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (notification.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        return {
          id: notification.id,
          user_id: notification.user_id,
          category_name: notification.category_name,
          channel: channel,
          identifier: notification.identifier,
          priority: notification.priority,
          status: notification.status == 'UNKNOWN_IDENTIFIER' ? 'ERROR' : notification.status,
          createdAt: this.datePipe.transform(notification.createdAt, this.notifiService.date_time_format),
          link: {
            user_id: '/user-profile/' + notification.user_id + '/history'
          },
          action: {}
        };
      });
    }
  };
  submittedDeferredNotificationList: any = {
    name: "submittedDeferredNotificationList",
    pk: "id",
    search: "",
    needServerSidePagination: true,
    showLoader: false,
    pageSize: 5,
    filterCriteria: { status: "QUEUED,DEFERRED" },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "User Id", attr: "user_id", width: "135", type: "LINK" },
      { name: "Category", attr: "category_name", width: "160" },
      { name: "Channel", attr: "channel", width: "100", type: "IMAGE_LIST" },
      { name: "Identifier", attr: "identifier", width: "160" },
      { name: "Priority", attr: "priority", width: "150", className: "textCapitalize" },
      { name: "Status", attr: "status", width: "135", },
      { name: "Reason", attr: "deferred_reason", width: "120" },
      { name: "Scheduled Time", attr: "scheduled_at", width: "175" },
    ],
    actions: [
      { name: "View Message", clickFunction: (el: any) => this.viewMessage(el.id, 'QUEUED') }
    ],
    getRecord: (params: any) => this.isAbTesting ?
      this.notifiService.getNotificationQueueByNotificationIdAndVariantIdWithStatus(this.notification_id, this.variant_id, params)
      : this.notifiService.getNotificationQueueByNotificationIdWithStatus(this.notification_id, params),
    buildData: (notificationList: any) => {
      return notificationList.map((notification: any) => {
        var channel: any = [];
        if (notification.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
        if (notification.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
        if (notification.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
        if (notification.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (notification.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        return {
          id: notification.id,
          user_id: notification.user_id,
          category_name: notification.category_name,
          channel: channel,
          identifier: notification.identifier,
          priority: notification.priority,
          status: notification.status,
          deferred_reason: notification.deferred_reason,
          scheduled_at: this.datePipe.transform(notification.scheduled_at, this.notifiService.date_time_format),
          link: {
            user_id: '/user-profile/' + notification.user_id + '/history'
          },
          action: {}
        };
      });
    }
  };
  deliveredNotificationList: any = {
    name: "deliveredNotification",
    pk: "id",
    search: "",
    needServerSidePagination: true,
    showLoader: false,
    pageSize: 5,
    filterCriteria: { status: "SENT,DELIVERED,VIEWED" },
    fields: [
      { name: "ID", attr: "id", width: "75" },
      { name: "User Id", attr: "user_id", width: "115", type: "LINK" },
      { name: "Category", attr: "category_name", width: "160" },
      { name: "Channel", attr: "channel", width: "100", type: "IMAGE_LIST" },
      { name: "Identifier", attr: "identifier", width: "160" },
      { name: "Priority", attr: "priority", width: "120", className: "textCapitalize" },
      { name: "Status", attr: "status", width: "120", },
      { name: "Sent Time", attr: "sent_at", width: "175" },
    ],
    actions: [
      { name: "View Message", clickFunction: (el: any) => this.viewMessage(el.id, 'HISTORY') }
    ],
    getRecord: (params: any) => this.isAbTesting ?
      this.notifiService.getNotificationHistoryByNotificationIdAndVariantIdWithStatus(this.notification_id, this.variant_id, params)
      : this.notifiService.getNotificationHistoryByNotificationIdWithStatus(this.notification_id, params),
    buildData: (notificationList: any) => {
      return notificationList.map((notification: any) => {
        var channel: any = [];
        if (notification.channel.indexOf('EMAIL') !== -1) channel.push({ title: "Email", name: 'mail-outline' });
        if (notification.channel.indexOf('WEB_PUSH') !== -1) channel.push({ title: "Web Push", name: 'desktop-outline' });
        if (notification.channel.indexOf('MOBILE_PUSH') !== -1) channel.push({ title: "Mobile Push", name: 'phone-portrait-outline' });
        if (notification.channel.indexOf('SMS') !== -1) channel.push({ title: "SMS", name: 'chatbox-ellipses-outline' });
        if (notification.channel.indexOf('IN_APP_MESSAGE') !== -1) channel.push({ title: "In App", name: 'apps-outline' });
        return {
          id: notification.id,
          user_id: notification.user_id,
          category_name: notification.category_name,
          channel: channel,
          identifier: notification.identifier,
          priority: notification.priority,
          status: notification.status,
          sent_at: this.datePipe.transform(notification.sent_at, this.notifiService.date_time_format),
          link: {
            user_id: '/user-profile/' + notification.user_id + '/history'
          },
          action: {}
        };
      });
    }
  };

  chartList: any = [];
  isAbTesting: boolean = false;
  notification: any = {};
  notification_id: string = '';
  variant_id: string = '';
  isDirectContentMessage: boolean = false;
  summary: any = {};

  preview_channel_attr_map: any = {
    'EMAIL': 'email_content',
    'WEB_PUSH': 'web_push_content',
    'MOBILE_PUSH': 'push_content',
    'SMS': 'sms_content',
    'IN_APP_MESSAGE': 'in_app_content'
  }
  view: string = 'QUEUE';

  errorReason = {
    isModelOpen: false,
    data: ''
  }
  constructor(public notifiService: NotificationUiService, private actRouter: ActivatedRoute,
    private router: Router, private modalController: ModalController, public datePipe: DatePipe) {
    this.isAbTesting = this.router.url.startsWith('/ab-testing');
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
    this.actRouter.paramMap.subscribe(async (param: Params) => {
      this.notification_id = param['get']('notification_id');
      this.variant_id = param['get']('variant_id');
      this.notifiService.showLoader();
      try {
        await Promise.all(['getNotificationById', 'getNotificationSummary'].map(async (functionName: any) => {
          if (functionName == 'getNotificationById') await this.getNotificationById();
          else if (functionName == 'getNotificationSummary') await this.getNotificationSummary();
        }));
      } catch (err: any) {
        this.notifiService.toster.error(err.message || err);
      }
      this.notifiService.hideLoader();
    });
  }
  async getNotificationById() {
    this.notification = await this.notifiService.getNotificationById(this.notification_id, this.isAbTesting).toPromise();
    this.notification.includedUserSegmentList_str = (this.notification.includedUserSegmentList || []).map((el: any) => el.name).join(", ");
    this.notification.excludedUserSegmentList_str = (this.notification.excludedUserSegmentList || []).map((el: any) => el.name).join(", ");
    if (this.notification.template_id) {
      this.isDirectContentMessage = false;
    } else {
      this.isDirectContentMessage = true;
    }
  }
  async getNotificationSummary() {
    if (this.isAbTesting) {
      this.summary = await this.notifiService.getABTestingSummaryByVariant(this.notification_id, this.variant_id).toPromise();
    } else {
      this.summary = await this.notifiService.getNotificationSummary(this.notification_id).toPromise();
    }
    this.chartList = [];
    const { delivered, submitted } = this.summary;
    this.chartList.push(this.getBarChartData('Email', delivered.channels.EMAIL, submitted.channels.EMAIL));
    this.chartList.push(this.getBarChartData('SMS', delivered.channels.SMS, submitted.channels.SMS));
    this.chartList.push(this.getBarChartData('Web Push', delivered.channels.WEB_PUSH, submitted.channels.WEB_PUSH));
    this.chartList.push(this.getBarChartData('Mobile Push', delivered.channels.MOBILE_PUSH, submitted.channels.MOBILE_PUSH));
    this.chartList.push(this.getBarChartData('In App', delivered.channels.IN_APP_MESSAGE, submitted.channels.IN_APP_MESSAGE));
  }

  getBarChartData(title: string, deliveredCount: number, submittedCount: number) {
    return {
      title,
      isNotApplicable: deliveredCount == 0 && submittedCount == 0,
      series: [deliveredCount, submittedCount],
      colors: ['var(--chart-series-1)', 'var(--chart-series-2)'],
      chart: {
        type: "donut",
        height: 200,
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
        },
      },
      labels: ['Delivered', 'Submitted'],
      legend: {
        show: false,
      }
    }
  }

  async viewMessage(id: string, type: string, isErrormessage?: boolean) {
    this.notifiService.showLoader();
    try {
      if (type == "HISTORY") {
        var data: any = await this.notifiService.getNotificationHistoryById(id).toPromise();
        if (isErrormessage) {
          this.errorReason.data = data.error_message;
          this.errorReason.isModelOpen = true;
        } else {
          this.modalPresent(data);
        }
      } else if (type == "QUEUED") {
        var data: any = await this.notifiService.getNotificationQueueById(id).toPromise();
        this.modalPresent(data);
      }
    } catch (err: any) {
      this.notifiService.toster.error(err.message || err);
    }
    this.notifiService.hideLoader();
  }
  async modalPresent(data?: any, ErrorReason?: any) {
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
  async openPreview(channel: string) {
    try {
      this.notifiService.showLoader();
      var content: any = null;
      var template_id = this.notification.template_id;
      if (this.isAbTesting) {
        var template_id = this.notification.variantList.find((obj: any) => obj.id == this.variant_id).template_id;
      }
      if (template_id) {
        const resp: any = (await this.notifiService.getTemplateById(template_id).toPromise());
        content = resp[this.preview_channel_attr_map[channel]];
      } else {
        content = this.notification.content;
      }
      this.notifiService.hideLoader();
      var modal = await this.modalController.create({
        component: TemplatePageComponent,
        cssClass: 'viewMessage',
        componentProps: {
          preview_channel: channel,
          content: content,
          isEmailReadOnly: true,
          isPreviewPopup: true
        },
        backdropDismiss: false
      });
      await modal.present();
    } catch (err: any) {
      this.notifiService.hideLoader();
      this.notifiService.toster.error(err.message || err);
    }
  }
  // segment changes function
  switchView(view: string) {
    this.view = view;
  }

  cancel() {
    this.errorReason.isModelOpen = false;
    this.errorReason.data = '';
  }

}
