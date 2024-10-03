import { AfterViewInit, Component, Input, OnInit, ViewChild } from '@angular/core';
import { ModalController } from '@ionic/angular';
import { ActivatedRoute, Params, Router, NavigationStart } from '@angular/router';
import { AlertController, Platform } from '@ionic/angular';
import { TempCreatePopupModalComponent } from '../temp-create-popup-modal/temp-create-popup-modal.component';
import { NotificationUiService } from 'src/app/services/notification-ui.service';
import { FormControl, FormGroup, Validators } from '@angular/forms';
import { DynamicTagsModelComponent } from '../dynamic-tags-model/dynamic-tags-model.component';
import { animate, state, style, transition, trigger } from '@angular/animations';
import { TemplatePageComponent } from 'src/app/template-page/template-page.component';

@Component({
  selector: 'app-temp-create',
  templateUrl: './temp-create.html',
  styleUrls: ['./temp-create.scss'],
  animations: [
    trigger('myAnimationTrigger', [
      state('void', style({ opacity: 0 })),
      state('*', style({ opacity: 1 })),
      transition('void => *', animate('0.3s ease-in'))
    ])
  ]
})
export class TempCreate implements OnInit {
  enableCheckbox: any = {
    sameImageAsPortrait: false,
    isPrimaryContent: false,
    isSecondaryContent: false,
  }
  addButton: boolean = false;
  channelList = [
    {
      title: 'Email',
      name: 'EMAIL',
      iconName: 'mail-outline',
      image: '../../../../assets/icons/' + this.notifiService.themeName + '/email_template.svg'
    },
    {
      title: 'Web Push',
      name: 'WEB_PUSH',
      iconName: 'desktop-outline',
      image: '../../../../assets/icons/' + this.notifiService.themeName + '/web_push_template.svg'
    },
    {
      title: 'Mobile Push',
      name: 'MOBILE_PUSH',
      iconName: 'phone-portrait-outline',
      image: '../../../../assets/icons/' + this.notifiService.themeName + '/mobile_push_template.svg'
    },
    {
      title: 'SMS',
      name: 'SMS',
      iconName: 'chatbox-ellipses-outline',
      image: '../../../../assets/icons/' + this.notifiService.themeName + '/sms_push_template.svg'
    },
    {
      title: 'In-App',
      name: 'IN_APP_MESSAGE',
      iconName: 'apps-outline',
      image: '../../../../assets/icons/' + this.notifiService.themeName + '/web_push_template.svg'
    }
  ];

  isModelOpen: boolean = false;
  modal: any = null;

  isEditView: boolean = false;
  isCloneView: boolean = false;
  isCategoryLoaded: boolean = false;
  isTempalteLoaded: boolean = false;
  template_id: string = '';
  template: any = {};
  categoryList: any = [];
  form!: FormGroup;

  selectedChannel: string = "NEW";

  dynamicTag: any = { type: "", cursor: {} };
  systemTagList = ["first_name", "last_name", "name", "email", "phone_number", "gender", "date_of_birth", "language"];

  quillData = {
    'emoji-toolbar': true,
    'emoji-textarea': true,
    'emoji-shortname': true,
    'syntax': true,
    toolbar: {
      container: [
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
        ['link', 'image'/*, 'video'*/],                        // link and image, video
        ['emoji'],
      ],
    }
  };

  constructor(private modalController: ModalController, public notifiService: NotificationUiService,
    private router: Router, private actRouter: ActivatedRoute,
    private alertController: AlertController, public platform: Platform) {
    router.events.subscribe((event: any) => {
      if (event instanceof NavigationStart) {
        if (this.isModelOpen) this.modal.dismiss();
      }
    });
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
    this.notifiService.isTempPopup = false;
  }


  resetAll() {
    this.isEditView = false;
    this.isCategoryLoaded = false;
    this.isTempalteLoaded = false;
    this.template_id = '';
    this.template = {};
    this.categoryList = [];
  }

  init() {
    if (this.isInitTriggered) return;
    this.isInitTriggered = true;
    this.resetAll();
    this.notifiService.showLoader();
    this.validateAndLoadDefaultData();
    this.actRouter.paramMap.subscribe((param: Params) => {
      this.template_id = param['get']('template_id');
      if (!this.template_id) {
        this.template_id = param['get']('clone_template_id');
        if (this.template_id) this.isCloneView = true;
      }
      if (this.template_id) {
        if (!this.isCloneView) this.isEditView = true;
        this.getTemplateById();
      } else this.isTempalteLoaded = true;
    });
    this.getAllCategory();
    this.validateForm();
  }


  validateForm() {
    this.form = new FormGroup({
      subject: new FormControl(this.template.email_content.subject, {
        validators: [Validators.required]
      }),
      message: new FormControl(this.template.email_content.message, {
        validators: [Validators.required]
      }),
      title: new FormControl(this.template.web_push_content.title, {
        validators: [Validators.required]
      }),
      msg: new FormControl(this.template.web_push_content.message, {
        validators: [Validators.required]
      }),
      mobTitle: new FormControl(this.template.push_content.title, {
        validators: [Validators.required, Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/)]
      }),
      mobMsg: new FormControl(this.template.push_content.message, {
        validators: [Validators.required, Validators.pattern(/^(\s+\S+\s*)*(?!\s).*$/)]
      }),
      smsContent: new FormControl(this.template.sms_content.message, {
        validators: [Validators.required]
      }),
      htmlContent: new FormControl(this.template.in_app_content.htmlContent, {
        validators: [Validators.required]
      }),
      cardBackgroundcolor: new FormControl(this.template.in_app_content.card.backgroundColorHex, {
        validators: [Validators.required]
      }),
      cardTitleColor: new FormControl(this.template.in_app_content.card.title.colorHex, {
        validators: [Validators.required]
      }),
      cardTitle: new FormControl(this.template.in_app_content.card.title.text, {
        validators: [Validators.required]
      }),
      cardButtontext: new FormControl(this.template.in_app_content.card.primaryActionButton.text.text, {
        validators: [Validators.required]
      }),
      cardButtonBackgroundColor: new FormControl(this.template.in_app_content.card.primaryActionButton.buttonColorHex, {
        validators: [Validators.required]
      }),
      cardButtontextColor: new FormControl(this.template.in_app_content.card.primaryActionButton.text.colorHex, {
        validators: [Validators.required]
      }),
      modalBackground: new FormControl(this.template.in_app_content.modal.backgroundColorHex, {
        validators: [Validators.required]
      }),
      modalTextcolor: new FormControl(this.template.in_app_content.modal.title.colorHex, {
        validators: [Validators.required]
      }),
      modalTitle: new FormControl(this.template.in_app_content.modal.title.text, {
        validators: [Validators.required]
      }),
      bannerBackground: new FormControl(this.template.in_app_content.banner.backgroundColorHex, {
        validators: [Validators.required]
      }),
      bannerTextcolor: new FormControl(this.template.in_app_content.banner.title.colorHex, {
        validators: [Validators.required]
      }),
      bannerTitle: new FormControl(this.template.in_app_content.banner.title.text, {
        validators: [Validators.required]
      }),
    })
  }

  validateAndLoadDefaultData() {
    this.template.channels = this.template.channels || [];
    this.template.email_content = this.template.email_content || {};
    this.template.sms_content = this.template.sms_content || {};
    this.template.push_content = this.template.push_content || {};
    this.template.web_push_content = this.template.web_push_content || {};
    this.template.in_app_content = this.template.in_app_content || {};
    this.template.dynamic_tags = this.template.dynamic_tags || [];
    this.template.push_content.image = this.template.push_content.image || {};
    this.template.web_push_content.image = this.template.web_push_content.image || {};
    this.template.web_push_content.icon = this.template.web_push_content.icon || {};

    this.template.in_app_content.type = this.template.in_app_content.type || "CARD";
    this.template.in_app_content.card = this.template.in_app_content.card || {};
    this.template.in_app_content.modal = this.template.in_app_content.modal || {};
    this.template.in_app_content.imageOnly = this.template.in_app_content.imageOnly || {};
    this.template.in_app_content.banner = this.template.in_app_content.banner || {};

    this.template.in_app_content.card.title = this.template.in_app_content.card.title || {};
    this.template.in_app_content.card.body = this.template.in_app_content.card.body || {};
    this.template.in_app_content.card.imageFlag = this.template.in_app_content.card.imageFlag || {};
    this.template.in_app_content.card.portraitImageUrl = this.template.in_app_content.card.portraitImageUrl || {};
    this.template.in_app_content.card.landscapeImageUrl = this.template.in_app_content.card.landscapeImageUrl || {};
    this.template.in_app_content.card.primaryActionButton = this.template.in_app_content.card.primaryActionButton || {};
    this.template.in_app_content.card.primaryActionButton.text = this.template.in_app_content.card.primaryActionButton.text || {};
    this.template.in_app_content.card.primaryAction = this.template.in_app_content.card.primaryAction || {};
    this.template.in_app_content.card.SecondaryAction = this.template.in_app_content.card.SecondaryAction || {};
    this.template.in_app_content.card.SecondaryActionButton = this.template.in_app_content.card.SecondaryActionButton || {};
    this.template.in_app_content.card.SecondaryActionButton.text = this.template.in_app_content.card.SecondaryActionButton.text || {};

    this.template.in_app_content.modal.title = this.template.in_app_content.modal.title || {};
    this.template.in_app_content.modal.body = this.template.in_app_content.modal.body || {};
    this.template.in_app_content.modal.imageUrl = this.template.in_app_content.modal.imageUrl || {};
    this.template.in_app_content.modal.actionButton = this.template.in_app_content.modal.actionButton || {};
    this.template.in_app_content.modal.actionButton.text = this.template.in_app_content.modal.actionButton.text || {};
    this.template.in_app_content.modal.action = this.template.in_app_content.modal.action || {};

    this.template.in_app_content.imageOnly.imageUrl = this.template.in_app_content.imageOnly.imageUrl || {};
    this.template.in_app_content.imageOnly.action = this.template.in_app_content.imageOnly.action || {};

    this.template.in_app_content.banner.title = this.template.in_app_content.banner.title || {};
    this.template.in_app_content.banner.body = this.template.in_app_content.banner.body || {};
    this.template.in_app_content.banner.imageUrl = this.template.in_app_content.banner.imageUrl || {};
    this.template.in_app_content.banner.action = this.template.in_app_content.banner.action || {};

  }

  getAllCategory() {
    this.notifiService.getAllCategory().subscribe({
      next: (categoryList: any) => {
        this.isCategoryLoaded = true;
        if (this.isTempalteLoaded) this.notifiService.hideLoader();
        this.categoryList = categoryList;
        if (!this.isEditView && !this.isCloneView) this.opentempalteBaseDetailsModel();
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }

  getTemplateById() {
    this.notifiService.getTemplateById(this.template_id).subscribe({
      next: (template: any) => {
        this.isTempalteLoaded = true;
        if (this.isCategoryLoaded) this.notifiService.hideLoader();
        if (this.isCloneView) this.notifiService.cleanClonedObject(template, 'template');
        this.template = template;
        this.validateAndLoadDefaultData();
        this.reArrangeChannel();
        this.selectedChannel = this.template.channels[0] || 'NEW';
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }

  async opentempalteBaseDetailsModel() {
    // var modal = await this.modalController.create({
    //   component: TempCreatePopupModalComponent,
    //   cssClass: 'modalSize',
    //   componentProps: {
    //     template: this.template,
    //     categoryList: this.categoryList
    //   },
    //   backdropDismiss: false
    // });
    // modal.onDidDismiss().then((modelData) => {

    // });
    // await modal.present();
    setTimeout(() => {
      this.notifiService.isTempPopup = true;
    }, 500);

  }

  async dynamicTagModel() {
    var modal = await this.modalController.create({
      component: DynamicTagsModelComponent,
      cssClass: 'dynamic-tag-model',
      componentProps: {
        template: this.template,
        isTemplateScreen: true
      },
    });
    modal.onDidDismiss().then((modelData) => {
    });
    await modal.present();
  }

  reArrangeChannel() {
    const channelOrder = this.channelList.map((channel: any) => channel.name);
    this.template.channels = this.template.channels.sort((a: any, b: any) => {
      if (channelOrder.indexOf(a) < channelOrder.indexOf(b)) return -1;
      else return 1;
    });
  }

  getSelectedChannelList() {
    return this.channelList.filter(channel => this.template.channels.indexOf(channel.name) != -1);
  }

  addChannel(channelName: any) {
    var selectedInded = this.template.channels.indexOf(channelName);
    if (selectedInded == -1) {
      this.template.channels.push(channelName);
      this.reArrangeChannel();
      this.selectedChannel = channelName;
      // this.selectedChannel = this.template.channels[0] || 'NEW';
    } else {
      this.selectedChannel = channelName;
    }
  }

  removeChannel(channelName: any) {
    this.showCancelConfirmation(channelName);
  }

  showAddChannelView() {
    this.selectedChannel = "NEW";
  }

  switchChannel(channel: string) {
    this.selectedChannel = channel;
  }

  save() {
    if (!this.validateTemplate(this.template)) return;
    this.notifiService.showLoader();
    if (this.isEditView) {
      this.notifiService.updateTemplateById(this.template_id, this.template).subscribe({
        next: (e: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success("Template Updated Successfully!");
          this.router.navigate(['/configuration/template']);
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error || err;
          this.notifiService.toster.error(err.message || "Template Update Failed");
        }
      });
    } else {
      this.notifiService.createTemplate(this.template).subscribe({
        next: (e: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success('Template Created Successfully!');
          this.router.navigate(['/configuration/template']);
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error || err;
          this.notifiService.toster.error(err.message || 'Template Create Failed');
        }
      });
    }
  }

  validateTemplate(template: any) {
    try {
      if (!template.name) {
        this.opentempalteBaseDetailsModel();
        throw "Please Enter Name";
      } else if (!template.category_id) {
        this.opentempalteBaseDetailsModel();
        throw "Please Select Category";
      }
      if (template.channels.length == 0) {
        this.selectedChannel = "NEW";
        throw "Please Select Channel";
      }
      template.channels.forEach((channel: string) => {
        switch (channel) {
          case 'MOBILE_PUSH':
            if (!template.push_content.title) {
              this.selectedChannel = channel;
              throw "Please Enter Title";
            } else if (!template.push_content.message) {
              this.selectedChannel = channel;
              throw "Please Enter Message";
            }
            break;
          case 'WEB_PUSH':
            if (!template.web_push_content.title) {
              this.selectedChannel = channel;
              throw "Please Enter Title";
            } else if (!template.web_push_content.message) {
              this.selectedChannel = channel;
              throw "Please Enter Message";
            }
            break;
          case 'EMAIL':
            if (!template.email_content.subject) {
              this.selectedChannel = channel;
              throw "Please Enter Subject";
            } else if (!template.email_content.message) {
              this.selectedChannel = channel;
              throw "Please Enter Message";
            }
            break;
          case 'SMS':
            if (!template.sms_content.message) {
              this.selectedChannel = channel;
              throw "Please Enter Message";
            }
            break;
          case 'IN_APP_MESSAGE':
            if (template.in_app_content.type === 'CARD') {
              if (!template.in_app_content.card.backgroundColorHex) throw "Please Enter Background color";
              if (!template.in_app_content.card.title.colorHex) throw "Please Enter Text color";
              if (!template.in_app_content.card.title.text) throw "Please Enter Title";
              if (!template.in_app_content.card.primaryActionButton.text.text) throw "Please Enter Button Title";
              if (!template.in_app_content.card.primaryActionButton.buttonColorHex) throw "Please Enter Button Text Color";
              if (!template.in_app_content.card.primaryActionButton.text.colorHex) throw "Please Enter Button Background Color";
              if (!template.in_app_content.card.portraitImageUrl.base64Content) throw "Please Upload Image";
            } else if (template.in_app_content.type === 'MODAL') {
              if (!template.in_app_content.modal.backgroundColorHex) throw "Please Enter Background color";
              if (!template.in_app_content.modal.title.colorHex) throw "Please Enter Text color";
              if (!template.in_app_content.modal.title.text) throw "Please Enter Title";
            } else if (template.in_app_content.type === 'IMAGE_ONLY') {
              if (!template.in_app_content.imageOnly.imageUrl.base64Content) throw "Please Upload Image";
            } else if (template.in_app_content.type === 'TOP_BANNER') {
              if (!template.in_app_content.banner.backgroundColorHex) throw "Please Enter Background color";
              if (!template.in_app_content.banner.title.colorHex) throw "Please Enter Text color";
              if (!template.in_app_content.banner.title.text) throw "Please Enter Title";
            }
            break;
          default: throw "Invalid channel";
        }
      });
      return true;
    } catch (err) {
      this.notifiService.toster.error(err);
      return false;
    }
  }

  async confirmCancel() {
    this.isModelOpen = true;
    this.modal = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: 'Changes you made may not be saved.',
      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel'
        },
        {
          text: 'Leave',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.modalController.dismiss();
            this.router.navigate(['/configuration/template']);
          }
        },
      ],
    });
    this.modal.onDidDismiss().then(() => {
      this.isModelOpen = false;
    });
    await this.modal.present();
  }

  // mobile view right content
  isModalOpen = false;

  setOpen(isOpen: boolean) {
    this.isModalOpen = isOpen;
  }

  _addSelectedTag(obj: any, key: string, value: string) {
    var data = obj[key] || "";
    if (this.dynamicTag.cursor.hasOwnProperty("start")) {
      obj[key] = data.slice(0, this.dynamicTag.cursor.start) + "{{ " + value + " }}" + data.slice(this.dynamicTag.cursor.end);
    } else {
      obj[key] = data + "{{ " + value + " }}";
    }
    this.dynamicTag.cursor = {};
    return true;
  }

  addSelectedTag(tag: string) {
    switch (this.dynamicTag.type) {
      case "EMAIL_SUBJECT": return this._addSelectedTag(this.template.email_content, 'subject', tag);
      case "EMAIL_MESSAGE": return this._addSelectedTag(this.template.email_content, 'message', tag);
      case "WEBPUSH_TITLE": return this._addSelectedTag(this.template.web_push_content, 'title', tag);
      case "WEB_PUSH_MESSAGE": return this._addSelectedTag(this.template.web_push_content, 'message', tag);
      case "MOBILEPUSH_TITLE": return this._addSelectedTag(this.template.push_content, 'title', tag);
      case "MOBILEPUSH_MESSAGE": return this._addSelectedTag(this.template.push_content, 'message', tag);
      case "SMS_CONTENT": return this._addSelectedTag(this.template.sms_content, 'message', tag);
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

  updateColor(event: any) {
    console.log(event); // this is your selected color
  }
  checkboxEnable(checkboxtype: any) {
    this.enableCheckbox[checkboxtype] = !this.enableCheckbox[checkboxtype];
  }
  buttonAdding() {
    this.addButton = true;
  }

  async modalPresent(content: any, channel: any) {
    try {
      this.notifiService.hideLoader();
      var modal = await this.modalController.create({
        component: TemplatePageComponent,
        cssClass: 'viewMessage',
        componentProps: {
          preview_channel: channel,
          content: content,
          isPreviewPopup: true,
          isFullScreenEditor: true
        },
        backdropDismiss: false
      });
      await modal.present();
    } catch (err: any) {
      this.notifiService.toster.error(err.message || err);
    }
  }
  async showCancelConfirmation(channelName: any) {
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: 'You want to Delete this Channel.',
      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'Delete',
          cssClass: 'alert-button-confirm btn-primary',
          handler: () => {
            var selectedInded = this.template.channels.indexOf(channelName);
            if (selectedInded != -1) {
              this.template.channels.splice(selectedInded, 1);
            }
            if (this.selectedChannel == channelName) {
              this.selectedChannel = this.template.channels[0] || 'NEW';
            }
          }
        },
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel btn-secondary',
        },
      ],
    });
    await alert.present();
  }

}

