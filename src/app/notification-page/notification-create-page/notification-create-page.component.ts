import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { AlertController, ModalController } from '@ionic/angular';
import * as handlebars from 'handlebars';
import { NotificationUiService } from 'src/app/services/notification-ui.service';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { parseISO } from 'date-fns';
import { DynamicTagsModelComponent } from 'src/app/configuration/config-template/dynamic-tags-model/dynamic-tags-model.component';
import { SwiperOptions } from 'swiper/types/swiper-options';
import { TemplatePageComponent } from 'src/app/template-page/template-page.component';
import { AnyCnameRecord } from 'dns';
import { NgxMatDatetimePickerModule } from '@angular-material-components/datetime-picker';
import { SegmentViewPopupComponent } from 'src/app/segment-view-popup/segment-view-popup.component';
import { debug } from 'console';

@Component({
  selector: 'app-notification-create-page',
  templateUrl: './notification-create-page.component.html',
  styleUrls: ['./notification-create-page.component.scss'],
  animations: [
    trigger('fadeIn', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void => *', animate('0.3s ease-in'))
    ])
  ]
})
export class NotificationCreatePageComponent implements OnInit {

  landingPageURL: string = '/notification';
  landingPageName: string = 'Notification';
  isDropdownOpen: boolean = false;
  form!: FormGroup;
  isInitTriggered: boolean = false;
  notification_id: string = '';
  notification: any = {};
  isAbTesting: boolean = false;
  isEditView: boolean = false;
  isCloneView: boolean = false;
  isScheduledNotification: boolean = false;
  scheduleTime: any;
  selectedVariantIndex: number = 0;
  userCountByAudiencePercent: number = 0;
  userCountDetails: any = {};

  isModalOpen: boolean = false; //mobile preview
  isTemplateDisabled: boolean = false;

  matSelect = {
    dropdownFilterSearch: '',
    type: ''
  }

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }
  //

  channelList: any = ['EMAIL', 'WEB_PUSH', 'MOBILE_PUSH', 'SMS', 'IN_APP_MESSAGE'];
  directContentChannelList: any = ['EMAIL', 'WEB_PUSH', 'MOBILE_PUSH', 'SMS'];
  channelMap: any = {
    'EMAIL': 'Email',
    'WEB_PUSH': 'Web Push',
    'MOBILE_PUSH': 'Mobile Push',
    'SMS': 'SMS',
    'IN_APP_MESSAGE': 'In-App Message'
  };
  preview_channel_attr_map: any = {
    'EMAIL': 'email_content',
    'WEB_PUSH': 'web_push_content',
    'MOBILE_PUSH': 'push_content',
    'SMS': 'sms_content',
    'IN_APP_MESSAGE': 'in_app_content'
  };
  fieldChannelMap: any = {
    'title': ['EMAIL', 'WEB_PUSH', 'MOBILE_PUSH'],
    'message': ['EMAIL', 'WEB_PUSH', 'MOBILE_PUSH', 'SMS'],
    'image': ['WEB_PUSH', 'MOBILE_PUSH'],
    'icon': ['WEB_PUSH'],
    'click_action': ['WEB_PUSH', 'MOBILE_PUSH']
  }
  preview_channel: string = '';
  preview_type: string = 'TEMPLATE';
  preview_type_list: any = ['TEMPLATE', 'PARSE_TEMPLATE', 'PARSE_USER_TEMPLATE'];
  categoryList: any = [];
  templateList: any = [];
  templateMap: any = {};
  previewTemplateMap: any = {};
  userSegmentList: any = [];
  included_segment_id_list = [];
  excluded_segment_id_list = [];
  isDirectContentMessage: boolean = false;
  isOverrideTagValue: boolean = false;
  dynamic_tags_override: any = [];
  dynamic_tags: any = [];
  dynamicTag: any = { type: '', cursor: {} };
  systemTagList = ['first_name', 'last_name', 'name', 'email', 'phone_number', 'gender', 'date_of_birth', 'language'];
  matchedUserCount: any = {
    includedFilter: null,
    excludedFilter: null
  }

  // userCount variables
  previousData: any = { INCLUDED: [], EXCLUDED: [] };
  totalUserCount: any = null

  // preview dynamic tags variable
  previewUserDetails: any = {};
  preview_user_id: any = '';

  segmentView: any;
  userSegment: any;

  quillData = {
    toolbar: [
      ['bold', 'italic', 'underline', 'strike'],        // toggled buttons
      // ['blockquote', 'code-block'],
      // [{ 'header': 1 }, { 'header': 2 }],               // custom button values
      [{ 'list': 'ordered' }, { 'list': 'bullet' }],
      // [{ 'script': 'sub'}, { 'script': 'super' }],      // superscript/subscript
      [{ 'indent': '-1' }, { 'indent': '+1' }],          // outdent/indent
      // [{ 'direction': 'rtl' }],                         // text direction
      [{ 'size': ['small', false, 'large', 'huge'] }],  // custom dropdown
      // [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
      [{ 'color': [] }, { 'background': [] }],          // dropdown with defaults from theme
      [{ 'font': [] }],
      [{ 'align': [] }],
      ['clean'],                                         // remove formatting button
      ['link', 'image'/*, 'video'*/]                         // link and image, video
    ]
  };

  //swiper code
  @ViewChild('swiper') swiper: any;
  config: SwiperOptions = {
    slidesPerView: 'auto',
    effect: 'fade',
    allowTouchMove: false
  };

  @ViewChild('mobswiper') mobswiper: any;
  mobconfig: SwiperOptions = {
    slidesPerView: 'auto',
    effect: 'fade',
    allowTouchMove: false
  };


  math: any = Math;
  ruleTypeInclude: string = '';
  constructor(private alertController: AlertController, public notifiService: NotificationUiService,
    private router: Router, private actRouter: ActivatedRoute, private modalController: ModalController) {
    this.isAbTesting = this.router.url.startsWith('/ab-testing');
    if (this.isAbTesting) {
      this.landingPageURL = '/ab-testing';
      this.landingPageName = 'A/B Testing';
    }
  }

  ngOnInit() {

    this.init();
    if (this.swiper) {
      this.swiper.updateSwiper({});
    }
    if (this.mobswiper) {
      this.mobswiper.updateSwiper({});
    }
  }

  ionViewWillEnter() {
    this.init();
  }
  ionViewWillLeave() {
    this.isInitTriggered = false;
    this.notifiService.closeAllAlertCtrl();
  }
  resetAll() {
    this.notification_id = '';
    this.scheduleTime = '';
    this.isScheduledNotification = false;
    this.notification = {
      content: { icon: {}, image: {} },
      channels: [],
      included_segment_id_list: [],
      excluded_segment_id_list: [],
      is_bulk_notification: this.isAbTesting ? true : false,
      is_scheduled: false,
    };
    if (this.isAbTesting) {
      this.notification.variantList = [{ name: "Variant A", dynamic_tags_override: [] }, { name: "Variant B", dynamic_tags_override: [] }];
      this.notification.variant_settings = { audience_percentage: 5 };
    }
    this.isDirectContentMessage = false;
    this.isOverrideTagValue = false;
    this.preview_channel = '';
    this.preview_type = 'TEMPLATE';
    this.isTemplateDisabled = false;
  }

  init() {
    if (this.isInitTriggered) return;
    this.isInitTriggered = true;
    this.resetAll();
    this.notifiService.showLoader();

    this.getAllCategory();
    this.getAllUserSegment();


    this.actRouter.paramMap.subscribe((param: Params) => {
      this.notification_id = param['get']('notification_id');
      if (!this.notification_id) {
        this.notification_id = param['get']('clone_notification_id');
        if (this.notification_id) this.isCloneView = true;
      }
      if (this.notification_id) {
        if (!this.isCloneView) this.isEditView = true;
        this.getNotificationById();
      } else {
        this.validateAndLoadDefaultData();
        this.validateAndHideLoader();
      }
    });
    this.validateForm()
  }

  loadingCount: number = 3;
  validateAndHideLoader() {
    if (--this.loadingCount == 0) {
      this.notifiService.hideLoader();
    }
  }
  //
  slidePreview() {
    var preview_type = this.preview_type_list[this.preview_type_list.indexOf(this.preview_type) - 1];
    if (this.swiper) {
      this.swiper.swiperRef.slidePrev(500);
      this.preview_type = preview_type;
    }
    if (this.mobswiper) {
      this.mobswiper.swiperRef.slidePrev(500);
      this.preview_type = preview_type;
    }
  }
  slideNext() {
    var preview_type = this.preview_type_list[this.preview_type_list.indexOf(this.preview_type) + 1];
    if (this.swiper) {
      this.swiper.swiperRef.slideNext(500);
      this.preview_type = preview_type;
    }
    if (this.mobswiper) {
      this.mobswiper.swiperRef.slideNext(500);
      this.preview_type = preview_type;
    }
  }

  validateForm() {
    this.form = new FormGroup({
      Id: new FormControl(this.notification.user_id, {
        validators: [Validators.required]
      }),
      category: new FormControl(this.notification.category_id, {
        validators: [Validators.required]
      }),
      template: new FormControl(this.notification.template_id, {
        validators: [Validators.required]
      }),
      channel: new FormControl(this.notifiService.customPopoverOptions, {
        validators: [Validators.required]
      }),
      title: new FormControl(this.notification.content.title, {
        validators: [Validators.required]
      }),
      body: new FormControl(this.notification.content.message, {
        validators: [Validators.required]
      }),
      scheduledStartDateTime: new FormControl(this.scheduleTime, {
        validators: [Validators.required]
      }),
    });
  }
  renderdata(data: any, key: string) {
    if (data[key]) {
      var value = data[key];
      if (data[key] instanceof Array) {
        if (data[key].length == 0) return;
        data[key] = [];
      } else {
        delete data[key];
      }
      setTimeout(() => data[key] = value, 10);
    }
  }
  getAllCategory() {
    this.notifiService.getAllCategory().subscribe({
      next: (categoryList: any) => {
        this.validateAndHideLoader();
        this.categoryList = categoryList;
        this.renderdata(this.notification, 'category_id');
      },
      error: (err: any) => {
        this.validateAndHideLoader();
        err = err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }
  getAllTemplateByCategoryId(category_id: any) {
    if (category_id) {
      this.notifiService.getAllTemplate({ category_id }).subscribe(
        {
          next: (templateList: any) => {
            this.notifiService.hideLoader();
            if (category_id == this.notification.category_id) {
              this.templateList = templateList;
              this.templateList.forEach((template: any) => {
                return this.templateMap[template.id] = template;
              });
              if (this.isAbTesting) {
                this.notification.variantList.forEach((variant: any) => {
                  this.renderdata(variant, 'template_id');
                });
              } else {
                this.renderdata(this.notification, 'template_id');
                this.renderdata(this.notification, 'channels');
              }
            }
          },
          error: (err: any) => {
            this.notifiService.hideLoader();
            err = err.error || err;
            this.notifiService.toster.error(err.message || 'Failed');
          }
        }
      );
    }
  }

  getAllUserSegment() {
    this.notifiService.getAllUserSegment().subscribe({
      next: (userSegmentList: any) => {
        this.validateAndHideLoader();
        this.userSegmentList = userSegmentList;
        if ((this.isEditView || this.isCloneView) && this.notification.is_bulk_notification) {
          this.renderdata(this, 'includedUserSegmentList');
          this.renderdata(this, 'excluded_segment_id_list');
        }
      },
      error: (err: any) => {
        this.validateAndHideLoader();
        err = err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }
  validateAndLoadDefaultData() {
    this.notification.content = this.notification.content || {};
    this.notification.content.image = this.notification.content.image || {};
    this.notification.content.icon = this.notification.content.icon || {};
    this.included_segment_id_list = (this.notification.includedUserSegmentList || []).map((obj: any) => obj.id);
    this.excluded_segment_id_list = (this.notification.excludedUserSegmentList || []).map((obj: any) => obj.id);
  }
  getNotificationById() {
    this.notifiService.getNotificationById(this.notification_id, this.isAbTesting).subscribe((notification: any) => {
      this.validateAndHideLoader();
      if (this.isCloneView) this.notifiService.cleanClonedObject(notification, 'notification');
      this.notification = notification;
      this.loadTemplatePreviewByTemplateId();
      this.included_segment_id_list = (notification.includedUserSegmentList || []).map((obj: any) => obj.id);
      this.excluded_segment_id_list = (notification.excludedUserSegmentList || []).map((obj: any) => obj.id);
      if (this.notification.is_bulk_notification) {
        if (this.included_segment_id_list.length > 0) this.getNotificationUserCount(this.included_segment_id_list, 'INCLUDED');
        if (this.excluded_segment_id_list.length > 0) this.getNotificationUserCount(this.excluded_segment_id_list, 'EXCLUDED');
      }
      this.validateAndLoadDefaultData();
      if (this.notification.scheduled_at) {
        if (this.notification.status != 'CREATED') this.isScheduledNotification = true;
        this.scheduleTime = new Date(parseISO(this.notification.scheduled_at));
      }
      if (this.isAbTesting) {
        this.isDirectContentMessage = false;
        this.notification.channel = this.notification.channels[0];
        this.notification.variantList.forEach((variant: any) => {
          variant.dynamic_tags_override = Object.keys((variant.data || {})).map((name: string) => {
            return { name, value: variant.data[name] };
          });
          variant.isOverrideTagValue = variant.dynamic_tags_override.length > 0;
        });
        this.loadTemplatePreviewByTemplateId();
      } else {
        if (this.notification.template_id) {
          this.isDirectContentMessage = false;
          this.dynamic_tags_override = Object.keys((this.notification.data || {})).map((name: string) => {
            return { name, value: this.notification.data[name] };
          });
          this.isOverrideTagValue = this.dynamic_tags_override.length > 0;
          this.loadTemplatePreviewByTemplateId();
        } else {
          this.isDirectContentMessage = true;
          this.dynamic_tags = Object.keys((this.notification.data || {})).map((name: string) => {
            return { name, value: this.notification.data[name] };
          });
        }
      }

      if (this.notification.category_id) {
        this.getAllTemplateByCategoryId(this.notification.category_id);
      }
    });
  }
  onMessageTypeChange(isDirectContentMessage: boolean) {
    if (!this.isAbTesting && this.isDirectContentMessage != isDirectContentMessage) {
      this.isDirectContentMessage = isDirectContentMessage;
      this.preview_type = 'TEMPLATE';
      this.notification.channels = [];
      this.preview_channel = '';
    }
  }
  onCategorySelect() {
    if (!this.isDropdownOpen) return;
    if (this.isAbTesting) {
      this.notification.variantList.forEach((variant: any) => variant.template_id = '');
      this.notification.channel = '';
    } else {
      this.notification.template_id = '';
    }
    this.notification.channels = [];
    this.preview_channel = '';
    this.getAllTemplateByCategoryId(this.notification.category_id);
  }
  onVariantSelect(selectedVariantIndex: number) {
    this.selectedVariantIndex = selectedVariantIndex;
  }
  onTemplateSelect() {
    if (!this.isDropdownOpen) return;
    if (!this.isAbTesting) {
      this.notification.channels = [];
      this.preview_channel = '';
    }
    this.loadTemplatePreviewByTemplateId();
  }
  loadTemplatePreviewByTemplateId() {
    var template_id: any = null;
    if (this.isAbTesting) {
      template_id = this.notification.variantList[this.selectedVariantIndex].template_id;
    } else {
      template_id = this.notification.template_id;
    }

    if (template_id && !this.previewTemplateMap[template_id]) {
      this.notifiService.getTemplateById(template_id).subscribe({
        next: (template: any) => {
          this.previewTemplateMap[template_id] = template;
        },
        error: (err: any) => {
          err = err.error || err;
          if (err) {
            this.notification.channels = [];
            this.notification.template_id = 0;
            this.preview_channel = '';
          }
        }
      });
    }
  }
  onChannelSelect() {
    if (this.isAbTesting) {
      if (this.notification.channel) {
        this.notification.channels = [this.notification.channel];
      } else {
        this.notification.channels = [];
      }
      this.notification.variantList.forEach((variant: any) => {
        if (this.templateMap[variant.template_id] && ((this.templateMap[variant.template_id] || {}).channels || []).indexOf(this.notification.channel) == -1) {
          variant.template_id = '';
        }
      });
    }
    var channels = this.notification.channels || [];

    if (channels.indexOf(this.preview_channel) == -1 && this.preview_channel == '') {
      this.preview_channel = channels[0] || '';
    }
  }
  isValidFieldToShow(fieldName: string) {
    const elidgibleChannelList = this.fieldChannelMap[fieldName] || [];
    return elidgibleChannelList.find((channel: any) => (this.notification.channels || []).indexOf(channel) != -1) != null;
  }
  isValidNotification(notification: any) {
    try {
      if (notification.is_bulk_notification == true) {
        if (this.included_segment_id_list.length == 0 && this.excluded_segment_id_list.length == 0) throw 'Please Select Either Included Segments or Excluded Segments';
        if (this.included_segment_id_list.length != 0 && this.excluded_segment_id_list.length != 0) throw 'Please Select Either Included Segments or Excluded Segments';
      } else {
        if (!notification.user_id) throw 'Please enter User Id';
      }
      if (!notification.category_id) throw 'Please Select Category';
      if(!notification.channel && this.isAbTesting) throw 'Please Select Channel';
      if (this.isAbTesting) {
        notification.variantList.forEach((variant: any, index: number) => {
          try {
            if (!variant.name) throw 'Please Enter Variant Name';
            if (!variant.template_id) throw 'Please Select Template';
            if (variant.isOverrideTagValue &&
              ((this.previewTemplateMap[variant.template_id] || {}).dynamic_tags || []).length > 0 &&
              variant.dynamic_tags_override.length > 0) {
              variant.data = {};
              variant.dynamic_tags_override.forEach((tag: any) => {
                if (tag.name) variant.data[tag.name] = tag.value;
              });
            }
            delete variant.isOverrideTagValue;
            delete variant.dynamic_tags_override;
          } catch (e) {
            this.selectedVariantIndex = index;
            throw e;
          }
        });
        var audience_percentage = notification.variant_settings.audience_percentage;
        if (audience_percentage < 1) throw 'Target Audience percentace should be greater than 0';
        if ((((this.userCountDetails[notification.channel] || 0) / 100) * notification.variant_settings.audience_percentage) < notification.variantList.length) {
          throw 'At least 1 recipient per variant is required';
        }
      } else {
        if (this.isDirectContentMessage) {
          notification.template_id = null;
          if (notification.channels.length == 0) throw 'Please Select Channels';
          if (this.isValidFieldToShow('title') && !notification.content.title) throw 'Please Enter Title';
          if (this.isValidFieldToShow('message') && !notification.content.message) throw 'Please Enter Message';
        } else {
          if (!notification.template_id) throw 'Please Select Template';
          if (notification.channels.length == 0) throw 'Please Select Channels';
        }
      }
      if (notification.is_scheduled) {
        if (!this.scheduleTime) throw 'Please Select Scheduled Date';
        if (new Date().getTime() >= this.scheduleTime.getTime()) throw 'Please Select Future Date';
        notification.scheduled_at = this.scheduleTime.getTime();
      }
      //cleanup code
      if (notification.template_id) notification.content = {};
      if (!notification.is_scheduled) notification.scheduled_at = null;
      if (notification.is_bulk_notification == true) {
        if (notification.user_id) notification.user_id = null;
        notification.includedUserSegmentList = this.included_segment_id_list.map(id => { return { id } });
        notification.excludedUserSegmentList = this.excluded_segment_id_list.map(id => { return { id } });
      } else {
        if (notification.included_segments) notification.includedUserSegmentList = [];
        if (notification.excluded_segments) notification.excludedUserSegmentList = [];
      }
      if (!this.isAbTesting) {
        if (this.isDirectContentMessage) {
          notification.data = {};
          this.dynamic_tags.forEach((tag: any) => {
            if (tag.name) notification.data[tag.name] = tag.value;
          });
        } else if (this.isOverrideTagValue &&
          ((this.previewTemplateMap[notification.template_id] || {}).dynamic_tags || []).length > 0 &&
          this.dynamic_tags_override.length > 0) {
          notification.data = {};
          this.dynamic_tags_override.forEach((tag: any) => {
            if (tag.name) notification.data[tag.name] = tag.value;
          });
        }
      }
      return true;
    } catch (err) {
      this.notifiService.toster.error(err);
    }
    return false;
  }
  saveAsDraft() {
    var notification = JSON.parse(JSON.stringify(this.notification));
    if (!this.isValidNotification(notification)) return;
    this.notifiService.showLoader();
    if (this.isEditView) {
      this.notifiService.updateDraftNotification(this.notification_id, notification, this.isAbTesting).subscribe({
        next: (e: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success(this.landingPageName + ' Updated Successfully!');
          this.router.navigate([this.landingPageURL]);
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error || err;
          this.notifiService.toster.error(err.message || (this.landingPageName + ' Update Failed'));
        }
      });
    } else {
      this.notifiService.saveDraftNotification(notification, this.isAbTesting).subscribe({
        next: (e: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success(this.landingPageName + ' Created Successfully!');
          this.router.navigate([this.landingPageURL]);
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error || err;
          this.notifiService.toster.error(err.message || (this.landingPageName + ' Create Failed'));
        }
      });
    }
  }
  sendNotification() {
    try {
      if (this.totalUserCount == 0) {
        throw 'No user found'
      }
      var notification = JSON.parse(JSON.stringify(this.notification));
      if (!this.isValidNotification(notification)) return;
      this.notifiService.showLoader();
      this.notifiService.sendNotification(notification, this.isAbTesting).subscribe({
        next: (e: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success(this.landingPageName + ' Initiated Successfully!');
          this.router.navigate([this.landingPageURL]);
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error || err;
          this.notifiService.toster.error(err.message || (this.landingPageName + ' Failed to Initiate'));
        }
      });
    } catch (err: any) {
      err = err.error || err;
      this.notifiService.toster.error(err);
    }
  }
  scheduleNotification() {
    try {
      if (this.totalUserCount == 0) {
        throw 'No user found'
      }
      var notification = JSON.parse(JSON.stringify(this.notification));
      if (!this.isValidNotification(notification)) return;
      this.notifiService.showLoader();
      this.notifiService.scheduleNotification(notification, this.isAbTesting).subscribe({
        next: (e: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success(this.landingPageName + ' Scheduled Successfully!');
          this.router.navigate([this.landingPageURL]);
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error || err;
          this.notifiService.toster.error(err.message || ('Failed to Schedule ' + this.landingPageName));
        }
      });
    } catch (err: any) {
      err = err.error || err;
      this.notifiService.toster.error(err);
    }
  }
  //onCancel popup
  async onCancel() {
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: 'Changes you made may not be saved.',
      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel',
        },
        {
          text: 'Leave',
          cssClass: 'alert-button-confirm',
          handler: () => { this.router.navigate([this.landingPageURL]) }
        },
      ],
    });
    await alert.present();
  }

  async dynamicTagModel() {
    var modal = await this.modalController.create({
      component: DynamicTagsModelComponent,
      cssClass: 'dynamic-tag-model',
      componentProps: {
        template: { dynamic_tags: this.dynamic_tags },
        isTemplateScreen: false
      },
      backdropDismiss: false
    });
    await modal.present();
  }
  _addSelectedTag(obj: any, key: string, value: string) {
    var data = obj[key] || '';
    if (this.dynamicTag.cursor.hasOwnProperty('start')) {
      obj[key] = data.slice(0, this.dynamicTag.cursor.start) + '{{ ' + value + ' }}' + data.slice(this.dynamicTag.cursor.end);
    } else {
      obj[key] = data + '{{ ' + value + ' }}';
    }
    this.dynamicTag.cursor = {};
    return true;
  }
  addSelectedTag(tag: string) {
    switch (this.dynamicTag.type) {
      case 'TITLE': return this._addSelectedTag(this.notification.content, 'title', tag);
      case 'MESSAGE': return this._addSelectedTag(this.notification.content, 'message', tag);
      default: return false;
    }
  }
  cursorIndexIdentifier(event: any, type: string) {
    this.dynamicTag.cursor = {
      type,
      start: event.target.selectionStart,
      end: event.target.selectionEnd
    };
  }
  showDynamicContentPopup(type: string) {
    if (this.dynamicTag.cursor.type != type) {
      this.dynamicTag.cursor = {};
    }
    this.dynamicTag.type = type;
  }
  addOverrideDynamicTag(dynamic_tags_override: any) {
    dynamic_tags_override.push({ name: '' });
  }
  removeOverrideDynamicTag(dynamic_tags_override: any, index: any) {
    dynamic_tags_override.splice(index, 1);
  }

  getDynamicTagDetails() {
    const data: any = {};
    var template_id = this.notification.template_id;
    var isOverrideTagValue = this.isOverrideTagValue;
    var dynamic_tags_override = this.dynamic_tags_override;
    if (this.isAbTesting) {
      var obj = this.notification.variantList[this.selectedVariantIndex];
      template_id = obj.template_id;
      isOverrideTagValue = obj.isOverrideTagValue;
      dynamic_tags_override = obj.dynamic_tags_override;
    }

    if (this.isDirectContentMessage) {
      this.dynamic_tags.forEach((tag: any) => {
        if (tag.name) data[tag.name] = tag.value;
      });
    } else if (((this.previewTemplateMap[template_id] || {}).dynamic_tags || []).length > 0) {
      this.previewTemplateMap[template_id].dynamic_tags.forEach((tag: any) => {
        if (tag.name) data[tag.name] = tag.value;
      });
      if (isOverrideTagValue && dynamic_tags_override.length > 0) {
        dynamic_tags_override.forEach((tag: any) => {
          if (tag.name) data[tag.name] = tag.value;
        });
      }
    }
    return data;
  }

  updateData(event: any) {
    this.notification.content = event;
  }
  scrollContent(id: string) {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  }

  countApiTriggerCount: number = 0;
  async getNotificationUserCount(segmentIdList: any, rule_type: string) {
    try {
      this.ruleTypeInclude = '';
      var previousRuletype = this.previousData.key;
      var previousSegmentIdList = this.previousData[rule_type].join(',');
      var newSegmentIdList = segmentIdList.join(',');

      if ((previousRuletype != rule_type || previousSegmentIdList != newSegmentIdList) && segmentIdList.length) {
        this.previousData[rule_type] = JSON.parse(JSON.stringify(segmentIdList));
        this.previousData.key = rule_type;
        this.totalUserCount = null;
        if (rule_type == 'INCLUDED') {
          this.notification.includedUserSegmentList = segmentIdList.map((id: any) => {
            return { id };
          });
        } else {
          this.notification.excludedUserSegmentList = segmentIdList.map((id: any) => {
            return { id };
          });
        }

        if (segmentIdList.length > 0) {
          if (rule_type == 'INCLUDED') {
            this.ruleTypeInclude = 'INCLUDED';
            this.excluded_segment_id_list = [];
            this.notification.excludedUserSegmentList = [];
          } else {
            this.included_segment_id_list = [];
            this.notification.includedUserSegmentList = [];
          }
          ++this.countApiTriggerCount;
          this.userSegment = await this.notifiService.getNotificationUserCount(segmentIdList.join(',')).toPromise();
          let getCountSegementUsers;
          getCountSegementUsers = await this.notifiService.getUserSegementUsers({ rule_type, rules: this.userSegment.rules, channels: ['EMAIL', 'WEB_PUSH', 'MOBILE_PUSH', 'SMS', 'IN_APP_MESSAGE'] }).toPromise();
          this.userCountDetails = await this.notifiService.getUserCountByRules({ rule_type, rules: this.userSegment.rules, channels: ['EMAIL', 'WEB_PUSH', 'MOBILE_PUSH', 'SMS', 'IN_APP_MESSAGE'] }).toPromise();

          if (--this.countApiTriggerCount == 0) {
            this.totalUserCount = getCountSegementUsers._metadata.total_count;
          }
        }
      }
    } catch (err: any) {
      --this.countApiTriggerCount;
      err = err.error || err;
      this.notifiService.toster.error(err.message);
    }
  }

  getUserData() {
    this.previewUserDetails = {};
    if (this.preview_user_id) {
      this.notifiService.showLoader();
      this.notifiService.getAllUserProfileByID(this.preview_user_id, { response_type: 'USER_ROOT_DETAILS' }).subscribe({
        next: (previewUserDetails: any) => {
          this.previewUserDetails = previewUserDetails;
          console.log(this.previewUserDetails);
          this.notifiService.hideLoader();
        },
        error: (err: any) => {
          err = err.error || err;
          this.notifiService.toster.error(err.message || 'Failed');
          this.notifiService.hideLoader();
        }
      });
    }
  }

  async modalPresent(content: AnyCnameRecord) {
    try {
      const activeSliderIndex = document.getElementsByClassName("swiper-slide swiper-slide-active")[0].getAttribute("data-swiper-slide-index");
      const isFirstSlide = activeSliderIndex == "0";
      var modal = await this.modalController.create({
        component: TemplatePageComponent,
        cssClass: 'viewMessage',
        componentProps: {
          preview_channel: this.preview_channel,
          content: content,
          isPreviewPopup: true,
          isEmailReadOnly: isFirstSlide ? !this.isDirectContentMessage : true,
          isFullScreenEditor: true,
          needTemplateParser: isFirstSlide ? false : true,
          systemTagDetails: isFirstSlide ? null : this.previewUserDetails,
          dynamicTagDetails: isFirstSlide ? null : this.getDynamicTagDetails()
        },
        backdropDismiss: false
      });
      await modal.present();
    } catch (err: any) {
      this.notifiService.toster.error(err.message || err);
    }
  }
  updateTargetedAudience(event: any) {
    const value = parseInt(event.target.value, 10);
    if (value > 100) {
      event.target.value = '100';
    }
    if (value < 0) {
      event.target.value = '0';
    }
  }
  dateFormat(event: any) {
    const value = event.target.value;

  }

  addEvent(type: string, event: any) {
    event.value.setSeconds(0);
    this.renderdata(this, 'scheduleTime')
  }


  async openSegmentViewPopup() {
    debugger;
    const modal = await this.modalController.create({
      component: SegmentViewPopupComponent,
      cssClass: 'view-user',
      componentProps: {
        type: this.ruleTypeInclude == 'INCLUDED' ? 'INCLUDED' : 'EXCLUDED',
        usersegementRules: this.userSegment.rules,
        userName: null,
      },
      backdropDismiss: false
    });
    await modal.present();
    this.ruleTypeInclude = '';
  }

  filterWithType(type: any) {
    this.matSelect.type = type;
  }

}



