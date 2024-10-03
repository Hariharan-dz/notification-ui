import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CookieService } from 'ngx-cookie-service';
import { Preferences } from '@capacitor/preferences';
import { AlertController, LoadingController, ModalController, PopoverController, ToastController } from '@ionic/angular';
import jwt_decode from 'jwt-decode';
import { environment } from '../../environments/environment';

import { Router } from '@angular/router';

@Injectable({
  providedIn: 'root'
})

export class NotificationUiService {

  /* Theme change variable */
  themeName: string = 'dot-mobile';

  URL = environment.URL;
  image_prefix_url = environment.image_prefix_url;
  date_format: string = 'dd-MMM yy';
  time_format: string = 'hh:mm a';
  date_time_format: string = 'dd-MMM yy hh:mm a';
  default_limit: number = 100;
  userDetails: any = {};

  tokenBufferTime: number = 1 * 60 * 1000; // 1 Min
  tokenTimer: any = null;

  isTempPopup = false;
  constructor(private http: HttpClient, private toastController: ToastController,
    private alertController: AlertController, private router: Router,
    public loadingCtrl: LoadingController, private modalController: ModalController,
    public popoverController: PopoverController, private cookieService: CookieService) {
    this.validateToken();
    this.init();
  }

  async init() {
    var userData: any = await this.storage.get('login-user-Details');
    if (userData) {
      this.userDetails = JSON.parse(userData);
    }
  }

  storage = {
    get: async (key: string) => {
      return ((await Preferences.get({ key })) || {}).value;
    },
    set: async (key: string, value: string) => {
      return await Preferences.set({ key, value });
    },
    remove: async (key: string) => {
      return await Preferences.remove({ key });
    },
    clear: async () => {
      return await Preferences.clear();
    },
  }

  hasToken() {
    return this.cookieService.get('XSRF-TOKEN') ? true : false;
  }

  hasValidToken(token = this.cookieService.get('XSRF-TOKEN')) {
    if (token) {
      const decode: any = jwt_decode(token);
      return (decode.exp * 1000) > new Date().getTime();
    }
    return false;
  }

  validateToken() {
    if (this.tokenTimer) clearInterval(this.tokenTimer);
    const token = this.cookieService.get('XSRF-TOKEN');
    if (token && this.hasValidToken(token)) {
      const decode: any = jwt_decode(token);
      const expDuration = (decode.exp * 1000) - new Date().getTime();
      if (expDuration > this.tokenBufferTime) {
        this.tokenTimer = setTimeout(this.renewTokenAndUpdateCookie, (expDuration - this.tokenBufferTime));
      } else {
        this.renewTokenAndUpdateCookie();
      }
    }
  }

  async renewTokenAndUpdateCookie() {
    try {
      const details: any = await this.renewToken().toPromise();
      this.setTokenToCookie(details);
      this.validateToken();
      return true;
    } catch (err: any) {
      err = err.error || err;
      this.toster.error(err.message || 'Token Renew Failed');
      await this.deleteLoginDetails();
    }
    return false;
  }

  setTokenToCookie(details: any) {
    const date = new Date(new Date().getTime() + (24 * 60 * 60 * 1000));
    this.cookieService.set('XSRF-TOKEN', details['XSRF-TOKEN'], date, "/");
    this.cookieService.set('X-XSRF-TOKEN', details['X-XSRF-TOKEN'], date, "/");
  }

  async deleteLoginDetails() {
    this.cookieService.delete('XSRF-TOKEN');
    this.cookieService.delete('X-XSRF-TOKEN');
    this.cookieService.deleteAll();
    await this.storage.remove("login-user-Details");
  }

  customPopoverOptions: any = {
    cssClass: 'popover-wide',
  };
  segementioncutsomPopover: any = {
    cssClass: 'checkbox-popover',
  };

  toster = {
    success: (message: string) => {
      this.toster.show('SUCCESS', message);
    },
    error: (message: any) => {
      this.toster.show('ERROR', message);
    },
    show: async (type: string, message: any) => {
      const toast = await this.toastController.create({
        message: message,
        duration: 2000,
        icon: type == 'SUCCESS' ? 'checkmark-outline' : 'close-outline',
        cssClass: type == 'SUCCESS' ? 'toaster-style' : 'cancel-toaster-style',
        position: 'bottom',
      });
      await toast.present();
    }
  }

  async showCancelConfirmation(routerValue: any) {
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: 'Changes you made may not be saved.',
      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel btn-secondary',
        },
        {
          text: 'Leave',
          cssClass: 'alert-button-confirm btn-primary',
          handler: () => { this.router.navigate(routerValue) }
        },
      ],
    });
    await alert.present();
  }

  //alertClose Control
  async closeAllAlertCtrl() {
    var alertCtrl = await this.alertController.getTop();
    if (alertCtrl) await alertCtrl.dismiss();
    var modalCtrl = await this.modalController.getTop();
    if (modalCtrl) await modalCtrl.dismiss();
    var popoverCtrl = await this.popoverController.getTop();
    if (popoverCtrl) await popoverCtrl.dismiss();
    var loaderCtrl = await this.loadingCtrl.getTop();
    if (loaderCtrl) await loaderCtrl.dismiss();
  }

  //spinner controller
  isLoaderDismissed: boolean = false;
  async showLoader() {
    this.isLoaderDismissed = false;
    const loader = await this.loadingCtrl.create({
      message: 'Please wait...',
      spinner: 'lines-sharp',
      cssClass: 'ion-loading-class',
      translucent: true
    });
    if (!this.isLoaderDismissed && !(await this.loadingCtrl.getTop())) {
      await loader.present();
    }
  }

  async hideLoader() {
    try {
      this.isLoaderDismissed = true;
      if (await this.loadingCtrl.getTop()) {
        await this.loadingCtrl.dismiss();
      }
    } catch (e) {
      console.log(e);
    }
  }

  cleanClonedObject(obj: any, key: string) {
    const attrDetails: any = {
      category: ['id', 'status', 'createdAt', 'updatedAt'],
      template: ['id', 'status', 'createdAt', 'updatedAt'],
      userSegment: ['id', 'status', 'createdAt', 'updatedAt'],
      notification: ['id', 'status', 'createdAt', 'updatedAt', 'is_processed', 'processed_at', 'user_count', 'config_data']
    };
    attrDetails[key].forEach((key: any) => delete obj[key]);
    if (key == "notification") {
      (obj.variantList || []).forEach((variant: any) => {
        delete variant.id;
        delete variant.notification_id;
      });
    }
  }

  dateFormat(date) {
    date.setMinutes(date.getMinutes() - date.getTimezoneOffset());
    return date;
  }

  //Auth
  signup(data: any) {
    return this.http.post<any>(`${this.URL}/auth/register`, data);
  }

  login(data: any) {
    return this.http.post<any>(`${this.URL}/auth/login`, data);
  }

  logout() {
    return this.http.post<any>(`${this.URL}/auth/logout`, {});
  }

  resetPassword(data: any) {
    return this.http.post<any>(`${this.URL}/auth/forgot-password`, data);
  }

  confirmForgotPassword(data: any) {
    return this.http.post<any>(`${this.URL}/auth/forgot-password/confirm`, data);
  }

  confirmRegistration(data: any) {
    return this.http.post<any>(`${this.URL}/auth/register/confirm`, data);
  }

  resendConfirmation(data: any) {
    return this.http.post<any>(`${this.URL}/auth/register/resend`, data);
  }

  renewToken() {
    return this.http.post<any>(`${this.URL}/auth/token/renew`, {});
  }

  deleteAdminById(id: any) {
    return this.http.delete(`${this.URL}/auth/delete-admin/${id}`);
  }


  //category
  getAllCategory(params = {}) {
    return this.http.get<any>(`${this.URL}/category`, { params });
  }

  getCategoryById(id: any) {
    return this.http.get(`${this.URL}/category/${id}`)
  }

  createCategoty(data: any) {
    return this.http.post<any>(`${this.URL}/category`, data);
  }

  updateCategoryById(id: any, data: any) {
    return this.http.put(`${this.URL}/category/${id}`, data);
  }

  deleteCategoryById(id: any) {
    return this.http.delete<any>(`${this.URL}/category/${id}`);
  }

  //Template

  getAllTemplate(params = {}) {
    return this.http.get<any>(`${this.URL}/template`, { params });
  }

  getTemplateById(id: any) {
    return this.http.get(`${this.URL}/template/${id}`)
  }

  createTemplate(data: any) {
    return this.http.post<any>(`${this.URL}/template`, data);
  }

  updateTemplateById(id: any, data: any) {
    return this.http.put(`${this.URL}/template/${id}`, data);
  }

  deleteTemplateById(id: any) {
    return this.http.delete<any>(`${this.URL}/template/${id}`);
  }

  deleteTemplateByCategoryId(id: any) {
    return this.http.delete<any>(`${this.URL}/template/category/${id}`);
  }

  remapCategory(data: any) {
    return this.http.put(`${this.URL}/template/remap`, data);
  }

  //user_segement
  getAllUserSegment(params = {}) {
    return this.http.get(`${this.URL}/user-segment-rule`, { params });
  }

  getUserSegmentById(id: any) {
    return this.http.get(`${this.URL}/user-segment-rule/${id}`);
  }

  createUserSegment(data: any) {
    return this.http.post<any>(`${this.URL}/user-segment-rule`, data);
  }

  updateUserSegmentById(id: any, data: any) {
    return this.http.put(`${this.URL}/user-segment-rule/${id}`, data);
  }

  deleteUserSegmentById(id: any) {
    return this.http.delete(`${this.URL}/user-segment-rule/${id}`);
  }

  //
  getUserSegementUsers(data: any) {
    return this.http.post(`${this.URL}/cdp/user/userinfo-by-rule`, data);
  }
  //

  getNotificationUserCount(id: any) {
    return this.http.get(`${this.URL}/user-segment-rule/rule-list/${id}`);
  }

  //Notification
  getAllNotification(params = {}, isAbTesting: boolean) {
    return this.http.get<any>(`${this.URL}/${isAbTesting ? 'ab-testing' : 'notification'}`, { params });
  }

  getNotificationById(id: any, isAbTesting: boolean) {
    return this.http.get(`${this.URL}/${isAbTesting ? 'ab-testing' : 'notification'}/${id}`)
  }

  saveDraftNotification(data: any, isAbTesting: boolean) {
    return this.http.post(`${this.URL}/${isAbTesting ? 'ab-testing' : 'notification'}/save_as_draft`, data);
  }

  updateDraftNotification(id: any, data: any, isAbTesting: boolean) {
    return this.http.put(`${this.URL}/${isAbTesting ? 'ab-testing' : 'notification'}/${id}`, data);
  }

  sendNotification(data: any, isAbTesting: boolean) {
    return this.http.post(`${this.URL}/${isAbTesting ? 'ab-testing' : 'notification'}/send`, data);
  }

  scheduleNotification(data: any, isAbTesting: boolean) {
    return this.http.post(`${this.URL}/${isAbTesting ? 'ab-testing' : 'notification'}/schedule`, data);
  }

  deleteNotificationById(id: any, isAbTesting: boolean) {
    return this.http.delete<any>(`${this.URL}/${isAbTesting ? 'ab-testing' : 'notification'}/${id}`);
  }

  getNotificationSummary(id: any) {
    return this.http.get(`${this.URL}/notification/${id}/summary`);
  }

  getABTestingSummaryByVariant(id: any, variant_id: any) {
    return this.http.get(`${this.URL}/ab-testing/${id}/variant-id/${variant_id}/summary`);
  }

  getABTestingSummary(id: any) {
    return this.http.get(`${this.URL}/ab-testing/${id}/summary`)
  }

  //
  getUserNotificationSummary(id: any) {
    return this.http.get(`${this.URL}/notification/user-id/${id}/summary`);
  }

  //Notification History
  getNotificationHistoryByNotificationIdWithStatus(id: any, params: any) {
    return this.http.get(`${this.URL}/history/notification/${id}`, { params })
  }

  getNotificationHistoryByNotificationIdAndVariantIdWithStatus(id: any, variant_id: any, params: any) {
    return this.http.get(`${this.URL}/history/notification/${id}/variant-id/${variant_id}`, { params })
  }


  getNotificationHistoryByUserIdWithStatus(user_id: any, params: any) {
    return this.http.get(`${this.URL}/history/user-id/${user_id}`, { params });
  }

  getNotificationHistoryById(id: string) {
    return this.http.get(`${this.URL}/history/${id}`);
  }

  updateNotificationHistoryStatus(data: any) {
    return this.http.put(`${this.URL}/history/update-status`, data);
  }

  //Notification Queue
  getNotificationQueueByUserIdWithStatus(user_id: any, params: any) {
    return this.http.get(`${this.URL}/notification/queue/user-id/${user_id}`, { params });
  }

  getNotificationQueueByNotificationIdWithStatus(id: any, params: any) {
    return this.http.get(`${this.URL}/notification/${id}/queue`, { params });
  }

  getNotificationQueueByNotificationIdAndVariantIdWithStatus(id: any, variant_id: any, params: any) {
    return this.http.get(`${this.URL}/ab-testing/${id}/variant-id/${variant_id}/queue`, { params });
  }

  getNotificationQueueById(id: string) {
    return this.http.get(`${this.URL}/notification/queue/${id}`)
  }

  // User Profile
  getAllUserProfile(params = {}) {
    return this.http.get(`${this.URL}/cdp/user`, { params });
  }

  getAllUserProfileByID(id: any, params = {}) {
    return this.http.get(`${this.URL}/cdp/user/${id}`, { params });
  }

  getUserByDataSource(data_source: any, external_source_id: any, params: any) {
    return this.http.get(`${this.URL}/cdp/user/data-source/${data_source}/external-source-id/${external_source_id}`, { params });
  }

  deleteUserProfileById(id: any) {
    return this.http.delete(`${this.URL}/cdp/user/${id}`);
  }

  updateUserProfileById(userId: any, data: any) {
    return this.http.put(`${this.URL}/cdp/user/${userId}`, data);
  }

  updateTagsById(userId: any, data: any) {
    return this.http.put(`${this.URL}/cdp/user/${userId}/override-tags`, data);
  }

  getUserCountByRules(data: any) {
    return this.http.post(`${this.URL}/cdp/user/count-by-rule`, data);
  }

  //User Preference Email
  updateEmailProfileById(userId: any, channel_email_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/user/${userId}/contact-point-email/${channel_email_id}`, data);
  }

  activateEmailById(userId: any, channel_email_id: any) {
    return this.http.post(`${this.URL}/cdp/user/${userId}/contact-point-email/${channel_email_id}/active`, {});
  }

  inactivateEmailById(userId: any, channel_email_id: any) {
    return this.http.post(`${this.URL}/cdp/user/${userId}/contact-point-email/${channel_email_id}/inactive`, {});
  }

  //User Preference Phone
  updatePhoneProfileById(userId: any, channel_Phone_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/user/${userId}/contact-point-phone/${channel_Phone_id}`, data);
  }

  activatePhoneById(userId: any, channel_Phone_id: any) {
    return this.http.post(`${this.URL}/cdp/user/${userId}/contact-point-phone/${channel_Phone_id}/active`, {});
  }

  inactivatePhoneById(userId: any, channel_Phone_id: any) {
    return this.http.post(`${this.URL}/cdp/user/${userId}/contact-point-phone/${channel_Phone_id}/inactive`, {});
  }

  //User Preference App
  updateWebPushProfileById(userId: any, channel_web_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/user/${userId}/contact-point-app/${channel_web_id}`, data);
  }

  activateAppById(userId: any, channel_web_id: any) {
    return this.http.post(`${this.URL}/cdp/user/${userId}/contact-point-app/${channel_web_id}/active`, {});
  }

  inactivateAppById(userId: any, channel_web_id: any) {
    return this.http.post(`${this.URL}/cdp/user/${userId}/contact-point-app/${channel_web_id}/inactive`, {});
  }
  // Address
  updateAddressProfileById(userId: any, channel_web_id: any, data: any) {
    return this.http.put(`${this.URL}/cdp/user/${userId}/contact-point-address/${channel_web_id}`, data);
  }

  activateAddressById(userId: any, channel_web_id: any) {
    return this.http.post(`${this.URL}/cdp/user/${userId}/contact-point-address/${channel_web_id}/active`, {});
  }

  inactivateAddressById(userId: any, channel_web_id: any) {
    return this.http.post(`${this.URL}/cdp/user/${userId}/contact-point-address/${channel_web_id}/inactive`, {});
  }
  deleteDeviceByIdentifier(user_id: any, identifier: any) {
    return this.http.delete<any>(`${this.URL}/cdp/user/${user_id}/contact-point-app/identifier/${encodeURIComponent(identifier)}`);
  }

  registerDevice(user_id: any, data: any) {
    return this.http.post<any>(`${this.URL}/cdp/user/${user_id}/contact-point-app`, data);
  }

  //User Attribute
  getAllAttribute() {
    return this.http.get(`${this.URL}/cdp/user/attribute`);
  }

  createAttribute(data: any) {
    return this.http.post(`${this.URL}/cdp/user/attribute`, data);
  }

  getAttributeById(atributeId: any) {
    return this.http.get(`${this.URL}/cdp/user/attribute/${atributeId}`);
  }

  updateAttributeById(atributeId: any, data: any) {
    return this.http.put(`${this.URL}/cdp/user/attribute/${atributeId}`, data);
  }

  deleteAttributeById(atributeId: any) {
    return this.http.delete(`${this.URL}/cdp/user/attribute/${atributeId}`);
  }

  //HISTORY(user,notification) notificaiton
  //user Summary

  getNotificationHistorySummaryByUserId(id: any) {
    return this.http.get(`${this.URL}/history/user-id/${id}/summary`)
  }

  getNotificationQueueSummaryByUserId(id: any) {
    return this.http.get(`${this.URL}/notification/queue/user-id/${id}/summary`)
  }
  //CREATE USER CHANNEL
  createUserEmailChennal(id: any, data: any) {
    return this.http.post(`${this.URL}/cdp/user/${id}/contact-point-email`, data)
  }
  createUserPhoneChennal(id: any, data: any) {
    return this.http.post(`${this.URL}/cdp/user/${id}/contact-point-phone`, data)
  }
  createUserWebChennal(id: any, data: any) {
    return this.http.post(`${this.URL}/cdp/user/${id}/contact-point-app`, data)
  }
  createUserAddresChennal(id: any, data: any) {
    return this.http.post(`${this.URL}/cdp/user/${id}/contact-point-address`, data)
  }
  //email-file-upload
  getEmailFileUpload(data: any) {
    return this.http.post(`${this.URL}/template/email-file-upload`, data)
  }
}

