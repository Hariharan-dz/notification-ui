import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import { format, parseISO } from 'date-fns';
import { type } from 'os';
import { NotificationUiService } from 'src/app/services/notification-ui.service';
import { SwiperOptions, Swiper } from 'swiper';
import { SwiperComponent } from 'swiper/angular';



@Component({
  selector: 'app-user-profileview',
  templateUrl: './user-profileview.component.html',
  styleUrls: ['./user-profileview.component.scss'],
})
export class UserProfileviewComponent implements OnInit {

  @ViewChild('swiper') swiper: any;
  config: SwiperOptions = {
    slidesPerView: 'auto',
    effect: 'fade',
    allowTouchMove: false
  };
  date: any;
  isShow = false;
  selectedPreference: string = 'EMAIL';
  user: any = {};
  userProfileId: any;
  isEditView: boolean = false;
  preferenceDetails: any = {
    email: 0,
    phone: 0,
    app: 0,
    address: 0,
  };
  attributes: any;
  attrListDetails: any = {
    EMAIL: "contact_email_list",
    PHONE: "contact_phone_list",
    PUSH: "contact_app_list",
    ADDRESS: "contact_address_list"
  }
  sliderIndex: number = 0;
  profile: any = {};
  fieldDetails: any = {
    EMAIL: [
      { name: "Email", attr: "email", type: "text" },
      { name: "Data Source", attr: "data_source", type: "text", isReadOnly: true },
      { name: "External Source Id", attr: "external_source_id", type: "text", isReadOnly: true },
      { name: "Is Active", attr: "is_active", type: "boolean", isDisable: true },
      { name: "Is Primary Email", attr: "is_primary_email", type: "boolean", isDisable: true },
      { name: "Is User For Shipping", attr: "is_used_for_shipping", type: "boolean" },
      { name: "Is Used For Billing", attr: "is_used_for_billing", type: "boolean" },
      { name: "Is Business Use", attr: "is_business_use", type: "boolean" },
      { name: "Is Personal Use", attr: "is_personal_use", type: "boolean" },
      { name: "Best Time To Contact (Start Time)", attr: "best_time_contact_start_time", type: "time" },
      { name: "Best Time To Contact (End Time)", attr: "best_time_contact_end_time", type: "time" },
      { name: "Best Time To Contact (Timezone)", attr: "best_time_contact_timezone", type: "text" }
    ],
    PHONE: [
      { name: "Ext", attr: "extension_number", type: "text", isExt: true },
      { name: "Phone", attr: "telephone_number", type: "text", isPhone: true },
      { name: "Data Source", attr: "data_source", type: "text", isReadOnly: true },
      { name: "External Source Id", attr: "external_source_id", type: "text", isReadOnly: true },
      { name: "Is Active", attr: "is_active", type: "boolean", isDisable: true },
      { name: "Is Primary Phone Number", attr: "is_primary_phone", type: "boolean", isDisable: true },
      { name: "Is User For Shipping", attr: "is_used_for_shipping", type: "boolean" },
      { name: "Is Used For Billing", attr: "is_used_for_billing", type: "boolean" },
      { name: "Is Business Use", attr: "is_business_use", type: "boolean" },
      { name: "Is Personal Use", attr: "is_personal_use", type: "boolean" },
      { name: "Best Time To Contact (Start Time)", attr: "best_time_contact_start_time", type: "time" },
      { name: "Best Time To Contact (End Time)", attr: "best_time_contact_end_time", type: "time" },
      { name: "Best Time To Contact (Timezone)", attr: "best_time_contact_timezone", type: "text" }
    ],
    PUSH: [
      { name: "Identifier", attr: "identifier", type: "text" },
      { name: "Data Source", attr: "data_source", type: "text", isReadOnly: true },
      { name: "External Source Id", attr: "external_source_id", type: "text", isReadOnly: true },
      { name: "Channel", attr: "channel", type: "enum", options: [{ name: "Mobile", value: "MOBILE" }, { name: "Web", value: "WEB" }], isDisable: true },
      { name: "Platform", attr: "platform", type: "enum", options: [{ name: "Android", value: "ANDROID" }, { name: "IOS", value: "IOS" }], isDisable: true },
      {
        name: "Browser", attr: "browser_type", type: "enum",
        options: [
          { name: "Chrome", value: "CHROME" },
          { name: "Edge", value: "EDGE" },
          { name: "Safari", value: "SAFARI" },
          { name: "Firefox", value: "FIREFOX" },
          { name: "Opera", value: "OPERA" }
        ],
        isDisable: true
      },
      { name: "Is Active", attr: "is_active", type: "boolean", isDisable: true },
      { name: "Device Model", attr: "device_model", type: "text" },
      { name: "Device Make", attr: "device_make", type: "text" },
      { name: "Device OS", attr: "device_os", type: "text" },
      { name: "Geo Latitude", attr: "geo_latitude", type: "text" },
      { name: "Geo Longtitue", attr: "geo_longitude", type: "text" },
      { name: "Best Time To Contact (Start Time)", attr: "best_time_contact_start_time", type: "time" },
      { name: "Best Time To Contact (End Time)", attr: "best_time_contact_end_time", type: "time" },
      { name: "Best Time To Contact (Timezone)", attr: "best_time_contact_timezone", type: "text" },
    ],
    ADDRESS: [
      { name: "Data Source", attr: "data_source", type: "text", isReadOnly: true },
      { name: "External Source Id", attr: "external_source_id", type: "text", isReadOnly: true },
      { name: "Address 1", attr: "address_line_1", type: "text" },
      { name: "Address 2", attr: "address_line_2", type: "text", },
      { name: "Address 3", attr: "address_line_3", type: "text" },
      { name: "City", attr: "city", type: "text" },
      { name: "State", attr: "state_province", type: "text" },
      { name: "Country", attr: "country", type: "text" },
      { name: "Postal Code", attr: "postal_code", type: "text" },
      { name: "Latitude", attr: "geo_latitude", type: "text" },
      { name: "Longitude", attr: "geo_longitude", type: "text" },
      { name: "Is Active", attr: "is_active", type: "boolean", isDisable: true },
      { name: "Is Primary Address", attr: "is_primary_address", type: "boolean", isDisable: true },
      { name: "Is Used For Billing", attr: "is_used_for_billing", type: "boolean" },
      { name: "Is Used For Shipping", attr: "is_used_for_shipping", type: "boolean" },
      { name: "Is Business Use", attr: "is_business_use", type: "boolean" },
      { name: "Is Personal Use", attr: "is_personal_use", type: "boolean" },
      { name: "Best Time To Contact (Start Time)", attr: "best_time_contact_start_time", type: "time" },
      { name: "Best Time To Contact (End Time)", attr: "best_time_contact_end_time", type: "time" },
      { name: "Best Time To Contact (Timezone)", attr: "best_time_contact_timezone", type: "text" },
    ]
  }

  constructor(public notifiService: NotificationUiService, private actRouter: ActivatedRoute, private router: Router, private alertController: AlertController,) { }

  ngOnInit() {
    this.init();
  }
  ionViewWillEnter() {

  }
  init() {
    this.actRouter.paramMap.subscribe((param: Params) => {
      this.userProfileId = JSON.parse(param['get']('user_profile_id'));
      if (this.userProfileId) {
        this.isEditView = true;
        this.getAllUserProfileByID(this.userProfileId);
      }
    });
  }

  ionViewWillLeave() {
    this.notifiService.closeAllAlertCtrl();
  }
  resetAll() {
    this.preferenceDetails.email = 0;
    this.preferenceDetails.phone = 0;
    this.preferenceDetails.app = 0;
    this.preferenceDetails.address = 0;
  }
  numericOnly(event: any): boolean {
    let pattern = /^([0-9])$/;
    let result = pattern.test(event.key);
    return result;
  }
  getAttribute() {
    this.notifiService.showLoader();
    this.notifiService.getAllAttribute().subscribe({
      next: (attribute: any) => {
        this.notifiService.hideLoader();
        this.attributes = attribute;
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    })
  }

  getAllUserProfileByID(profileId: any) {
    this.notifiService.showLoader();
    this.notifiService.getAllUserProfileByID(profileId).subscribe({
      next: async (profile: any) => {
        this.user = profile;
        console.log(this.user)
        this.countValue();
        var tagObj: any = {};
        (this.user.tags || []).forEach((tag: any) => tagObj[tag.field] = tag.value);
        this.attributes = await this.notifiService.getAllAttribute().toPromise();
        this.attributes.forEach((attribute: any) => attribute.value = tagObj[attribute.name]);
        this.notifiService.hideLoader();
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }
  saveTags() {
    var tagList: any = [];
    this.attributes.forEach((attribute: any) => {
      if (attribute.value) {
        tagList.push({ field: attribute.name, value: attribute.value });
      }
    });
    this.notifiService.showLoader();
    this.notifiService.updateTagsById(this.user.id, { tags: tagList }).subscribe({
      next: async (e: any) => {
        this.notifiService.hideLoader();
        this.notifiService.toster.success("Tags Updated Successfully!");
        this.getAllUserProfileByID(this.userProfileId);
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error || err;
        this.notifiService.toster.error(err.message || "Tags Update Failed");
      }
    });
  }
  countValue() {
    this.resetAll();
    (this.user.contact_email_list || []).forEach((obj: any) => {
      if (obj.is_active) this.preferenceDetails.email++;
    });
    (this.user.contact_phone_list || []).forEach((obj: any) => {
      if (obj.is_active) this.preferenceDetails.phone++;
    });
    (this.user.contact_app_list || []).forEach((obj: any) => {
      if (obj.is_active) this.preferenceDetails.app++;
    });
    (this.user.contact_address_list || []).forEach((obj: any) => {
      if (obj.is_active) this.preferenceDetails.address++;
    });
  }
  slidePrevious() {
    this.swiper.swiperRef.slidePrev(500);
    this.sliderIndex--;
  }

  slideNext() {
    this.swiper.swiperRef.slideNext(500);
    this.sliderIndex++;
  }

  scrollContent(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  async selectedPrefer(preference: string) {
    if (this.selectedPreference != preference) {
      await this.notifiService.showLoader();
      this.selectedPreference = preference;
      this.swiper.swiperRef.slideTo(0);
      this.sliderIndex = 0;
      setTimeout(() => { this.notifiService.hideLoader() });
    }
  }


  save() {
    try {
      if (this.user.best_time_contact_start_time) {
        if (!this.user.best_time_contact_end_time) throw "Please enter End Time";
        if (this.user.best_time_contact_timezone == "") throw "Please enter Timezone";
      }
      if (this.user.best_time_contact_end_time) {
        if (!this.user.best_time_contact_start_time) throw "Please enter Start Time";
        if (this.user.best_time_contact_timezone == "") throw "Please enter Timezone";
      }
      if (this.user.best_time_contact_timezone) {
        if (!this.user.best_time_contact_start_time) throw "Please enter Start Time";
        if (!this.user.best_time_contact_end_time) throw "Please enter End Time";
      }
      if (this.isEditView) {
        this.notifiService.showLoader();
        this.profile = JSON.parse(JSON.stringify(this.user));
        delete (this.profile.contact_email_list);
        delete (this.profile.contact_phone_list);
        delete (this.profile.contact_app_list);
        delete (this.profile.contact_address_list);
        this.notifiService.updateUserProfileById(this.userProfileId, this.profile).subscribe({
          next: (e: any) => {
            this.notifiService.hideLoader();
            this.notifiService.toster.success("Profile Updated Successfully!");
          },
          error: (err: any) => {
            this.notifiService.hideLoader();
            err = err.error || err;
            this.notifiService.toster.error(err.message || "UserProfile Update Failed");
          }
        });
      }
    } catch (err: any) {
      this.notifiService.toster.error(err.message || err);
    }
  }
  savePreference(data: any, isNewUser?: any) {
    const emailRegex = new RegExp(/^[-!#$%&'*+\/0-9=?A-Z^_a-z{|}~](\.?[-!#$%&'*+\/0-9=?A-Z^_a-z`{|}~])*@[a-zA-Z0-9](-*\.?[a-zA-Z0-9])*\.[a-zA-Z](-?[a-zA-Z0-9])+$/);
    const phone_number_extenstionRegex = new RegExp(/^[\+]{1}[0-9]{1,9}$/);  //{3}[\s-]
    try {
      if (this.isShow || this.isEditView) {
        this.notifiService.showLoader();
        if (this.selectedPreference == 'EMAIL') {
          if (isNewUser) {
            if (data.email == null) throw { message: 'Please enter email' };
            if (!emailRegex.test(data.email)) throw { message: "Please enter valid email" };
            if (data.data_source == null) throw { message: 'Please enter data source' };
            if (data.external_source_id == null) throw { message: 'Please enter external source id' };
            if (data.best_time_contact_start_time) {
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_end_time) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_timezone) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
            }
            this.notifiService.createUserEmailChennal(this.userProfileId, data).subscribe({
              next: (e: any) => {
                this.notifiService.hideLoader();
                this.notifiService.toster.success("Email Preference Added Successfully!");
                window.location.reload();
              },
              error: (err: any) => {
                this.notifiService.hideLoader();
              }
            });
          }
          else {
            if (data.email == "") throw { message: 'Please enter email' };
            if (!emailRegex.test(data.email)) throw { message: 'Please enter valid email' };
            if (data.data_source == "") throw { message: 'Please enter data source' };
            if (data.external_source_id == "") throw { message: 'Please enter external source id' };
            if (data.best_time_contact_start_time) {
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_end_time) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_timezone) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
            }
            this.notifiService.updateEmailProfileById(this.userProfileId, data.id, data).subscribe({
              next: (e: any) => {
                this.notifiService.hideLoader();
                console.log(data)
                this.notifiService.toster.success("Email Preference Updated Successfully!");
              },
              error: (err: any) => {
                this.notifiService.hideLoader();
              }
            });
          }
        }
        if (this.selectedPreference == 'PHONE') {
          if (isNewUser) {
            if (data.extension_number == null) throw { message: 'Please enter phone number extenstion' };
            if (!phone_number_extenstionRegex.test(data.extension_number)) throw { message: 'Please enter valid phone number extenstion' };
            if (data.telephone_number == null) throw { message: 'Please enter phone number' };
            if (data.data_source == null) throw { message: 'Please enter data source' };
            if (data.external_source_id == null) throw { message: 'Please enter external source id' };
            if (data.best_time_contact_start_time) {
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_end_time) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_timezone) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
            }
            this.notifiService.createUserPhoneChennal(this.userProfileId, data).subscribe({
              next: (e: any) => {
                this.notifiService.hideLoader();
                this.notifiService.toster.success("Phone Preference Added Successfully!");
                window.location.reload();
              },
              error: (err: any) => {
                this.notifiService.hideLoader();
              }
            });
          }
          else {
            if (data.extension_number == "") throw { message: 'Please enter phone number extenstion' };
            if (!phone_number_extenstionRegex.test(data.extension_number)) throw { message: 'Please enter valid phone number extenstion' };
            if (data.telephone_number == "") throw { message: 'Please enter phone number' };
            if (data.data_source == "") throw { message: 'Please enter data source' };
            if (data.external_source_id == "") throw { message: 'Please enter external source id' };
            if (data.best_time_contact_start_time) {
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_end_time) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_timezone) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
            }
            this.notifiService.updatePhoneProfileById(this.userProfileId, data.id, data).subscribe({
              next: (e: any) => {
                this.notifiService.hideLoader();
                this.notifiService.toster.success("Phone Preference Updated Successfully!");
              },
              error: (err: any) => {
                this.notifiService.hideLoader();
              }
            });
          }

        }
        if (this.selectedPreference == 'PUSH') {
          if (isNewUser) {
            if (data.identifier == null) throw { message: 'Please enter identifier' };
            if (data.data_source == null) throw { message: 'Please enter data source' };
            if (data.external_source_id == null) throw { message: 'Please enter external source id' };
            if (data.best_time_contact_start_time) {
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_end_time) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_timezone) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
            }
            this.notifiService.createUserWebChennal(this.userProfileId, data).subscribe({
              next: (e: any) => {
                this.notifiService.hideLoader();
                this.notifiService.toster.success("Phone Preference Added Successfully!");
                window.location.reload();

              },
              error: (err: any) => {
                this.notifiService.hideLoader();
              }
            });
          }
          else {
            if (data.identifier == "") throw { message: 'Please enter identifier' };
            if (data.data_source == "") throw { message: 'Please enter data source' };
            if (data.external_source_id == "") throw { message: 'Please enter external source id' };
            if (data.best_time_contact_start_time) {
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_end_time) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_timezone) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
            }
            this.notifiService.updateWebPushProfileById(this.userProfileId, data.id, data).subscribe({
              next: (e: any) => {
                this.notifiService.hideLoader();
                this.notifiService.toster.success("Push Preference Updated Successfully!");
              },
              error: (err: any) => {
                this.notifiService.hideLoader();
              }
            });
          }
        }
        if (this.selectedPreference == 'ADDRESS') {
          if (isNewUser) {
            if (data.address_line_1 == null) throw { message: 'Please enter address line 1' };
            if (data.data_source == null) throw { message: 'Please enter data source' };
            if (data.external_source_id == null) throw { message: 'Please enter external source id' };
            if (data.best_time_contact_start_time) {
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_end_time) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_timezone) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
            }
            this.notifiService.createUserAddresChennal(this.userProfileId, data).subscribe({
              next: (e: any) => {
                this.notifiService.hideLoader();
                this.notifiService.toster.success("Address Added Successfully!");
                window.location.reload();
              },
              error: (err: any) => {
                this.notifiService.hideLoader();
              }
            });
          }
          else {
            if (data.address_line_1 == "") throw { message: 'Please enter address line 1' };
            if (data.data_source == "") throw { message: 'Please enter data source' };
            if (data.external_source_id == "") throw { message: 'Please enter external source id' };
            if (data.best_time_contact_start_time) {
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_end_time) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (data.best_time_contact_timezone == "") throw "Please enter Timezone";
            }
            if (data.best_time_contact_timezone) {
              if (!data.best_time_contact_start_time) throw "Please enter Start Time";
              if (!data.best_time_contact_end_time) throw "Please enter End Time";
            }
            this.notifiService.updateAddressProfileById(this.userProfileId, data.id, data).subscribe({
              next: (e: any) => {
                this.notifiService.hideLoader();
                this.notifiService.toster.success("Address Updated Successfully!");
              },
              error: (err: any) => {
                this.notifiService.hideLoader();
              }
            });
          }
        }
      }
    }
    catch (err: any) {
      this.notifiService.toster.error(err.message || err);
      this.notifiService.hideLoader();
    }
  }
  async confirmStatus(is_active: boolean, data: any, status?: any) {
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: `Want to be ${status}.`,
      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'No',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Yes',
          cssClass: 'alert-button-confirm',
          handler: () => {
            if (status == 'active') {
              this.activatePreference(is_active, data);
            } else {
              this.deactivatePreference(is_active, data);
            }
          }
        },
      ],
    });
    await alert.present();
  }
  async activatePreference(is_active: boolean, data: any) {
    this.notifiService.showLoader();
    try {
      if (this.selectedPreference == 'EMAIL') {
        this.preferenceDetails.email++;
        await this.notifiService.activateEmailById(this.userProfileId, data.id).toPromise();
        this.notifiService.toster.success("Email Activated Successfully!");
      } else if (this.selectedPreference == 'PHONE') {
        this.preferenceDetails.phone++;
        await this.notifiService.activatePhoneById(this.userProfileId, data.id).toPromise();
        this.notifiService.toster.success("Phone Number Activated Successfully!");
      } else if (this.selectedPreference == 'PUSH') {
        this.preferenceDetails.app++;
        await this.notifiService.activateAppById(this.userProfileId, data.id).toPromise();
        this.notifiService.toster.success("Push Channel Activated Successfully!");
      } else if (this.selectedPreference == 'ADDRESS') {
        this.preferenceDetails.address++;
        await this.notifiService.activateAddressById(this.userProfileId, data.id).toPromise();
        this.notifiService.toster.success("Address Activated Successfully!");
      }
      this.notifiService.hideLoader();
      data.is_active = is_active;
    } catch (err: any) {
      this.notifiService.hideLoader();
      err = err.error || err;
      this.notifiService.toster.error(err.message || "Failed");
    }
  }
  async deactivatePreference(is_active: boolean, data: any) {
    this.notifiService.showLoader();
    try {
      if (this.selectedPreference == 'EMAIL') {
        this.preferenceDetails.email--;
        await this.notifiService.inactivateEmailById(this.userProfileId, data.id).toPromise();
        this.notifiService.toster.success("Email De-Activated Successfully!");
      } else if (this.selectedPreference == 'PHONE') {
        this.preferenceDetails.phone--;
        await this.notifiService.inactivatePhoneById(this.userProfileId, data.id).toPromise();
        this.notifiService.toster.success("Phone Number De-Activated Successfully!");
      } else if (this.selectedPreference == 'PUSH') {
        this.preferenceDetails.app--;
        await this.notifiService.inactivateAppById(this.userProfileId, data.id).toPromise();
        this.notifiService.toster.success("Push Channel De-Activated Successfully!");
      } else if (this.selectedPreference == 'ADDRESS') {
        this.preferenceDetails.address--;
        await this.notifiService.inactivateAddressById(this.userProfileId, data.id).toPromise();
        this.notifiService.toster.success("Address De-Activated Successfully!");
      }
      this.notifiService.hideLoader();
      data.is_active = is_active;
    } catch (err: any) {
      this.notifiService.hideLoader();
      err = err.error || err;
      this.notifiService.toster.error(err.message || "Failed");
    }
  }
  formatDate(date: Date) {
    this.notifiService.dateFormat(date);
  }
  addSlider(data: any, isBoolean: boolean) {

    this.isShow = isBoolean;
    if (this.selectedPreference == 'EMAIL') {
      this.user.contact_email_list.push({});
      this.user.contact_email_list.find((data: any) => {
        if (Object.keys(data).length == 0) {
          data.is_active = true;
          data.is_primary_email = false;
        }
      });
      this.preferenceDetails.email++;
      this.sliderIndex = this.preferenceDetails.email;
      setTimeout(() => {
        this.swiper.swiperRef.slideTo(this.sliderIndex);
      }, 100);
    } else if (this.selectedPreference == 'PHONE') {
      this.user.contact_phone_list.push({})
      this.user.contact_phone_list.find((data: any) => {
        if (Object.keys(data).length == 0) {
          data.is_active = true;
          data.is_primary_phone = false;
        }
      });
      this.preferenceDetails.phone++;
      this.sliderIndex = this.preferenceDetails.phone;
      setTimeout(() => {
        this.swiper.swiperRef.slideTo(this.sliderIndex);
      }, 100);
    } else if (this.selectedPreference == 'PUSH') {
      this.user.contact_app_list.push({})
      this.user.contact_app_list.find((data: any) => {
        if (Object.keys(data).length == 0) {
          data.is_active = true;
          data.is_primary_phone = false;
        }
      });
      this.preferenceDetails.app++;
      this.sliderIndex = this.preferenceDetails.app;
      setTimeout(() => {
        this.swiper.swiperRef.slideTo(this.sliderIndex);
      }, 100);
    }
    else if (this.selectedPreference == 'ADDRESS') {
      this.user.contact_address_list.push({})
      this.user.contact_address_list.find((data: any) => {
        if (Object.keys(data).length == 0) {
          data.is_active = true;
          data.is_primary_address = false;
        }
      });
      this.preferenceDetails.address++;
      this.sliderIndex = this.preferenceDetails.address;
      setTimeout(() => {
        this.swiper.swiperRef.slideTo(this.sliderIndex);
      }, 100);
    }
  }

}
