import { Component, OnInit, ViewChild } from '@angular/core';
import { NotificationUiService } from '../services/notification-ui.service';
import { AlertController, ModalController } from '@ionic/angular';
import { DataTableComponent } from '../data-table/data-table.component';
import { DatePipe } from '@angular/common';

@Component({
  selector: 'app-user-profile',
  templateUrl: './user-profile.component.html',
  styleUrls: ['./user-profile.component.scss'],
})
export class UserProfileComponent implements OnInit {
  userProfileTableDetails: any = {
    name: "userprofile",
    pk: 'id',
    search: "",
    filterCriteria: {},
    needServerSidePagination: true,
    fields: [
      { name: "ID", attr: "id", width: "75", type: "LINK" },
      { name: "Name", attr: "name", width: "175" },
      { name: "Gender", attr: "gender", width: "75", className: "textCapitalize" },
      { name: "Language", attr: "language", width: "100", className: "textCapitalize" },
      { name: "Role", attr: "role", width: "100", className: "textCapitalize" },
      { name: "Data Source", attr: "data_source", width: "150" },
      { name: "External Source Id", attr: "external_source_id", width: "200" }
    ],
    actions: [
      { name: 'View / Edit', attr: "edit" },
      { name: 'View Notification', attr: "view_notification" },
      { name: 'Delete', clickFunction: (el: any) => this.confirmDelete(el, 'deleted') }
    ],
    getRecord: (params: any) => this.notifiService.getAllUserProfile(params),
    buildData: (userProfileList: any) => {
      return userProfileList.map((userprofile: any) => {
        return {
          id: userprofile.id,
          name: userprofile.name,
          gender: userprofile.gender,
          date_of_birth: this.datePipe.transform(userprofile.date_of_birth, this.notifiService.date_format),
          language: userprofile.language,
          role: userprofile.role,
          data_source: userprofile.data_source,
          external_source_id: userprofile.external_source_id,
          link: {
            id: '/user-profile/' + userprofile.id
          },
          action: {
            edit: '/user-profile/' + userprofile.id,
            view_notification: '/user-profile/' + userprofile.id + '/history',
          }
        };
      });
    }
  };

  @ViewChild('user_profile_grid') userProfileGrid: DataTableComponent | undefined;

  defaultFilterCriteria: any = { role: "ADMIN" };
  filterCriteria: any = {};
  listOfTags: any;

  constructor(public notifiService: NotificationUiService, private alertController: AlertController,
    private datePipe: DatePipe, public modalctrl: ModalController) {
    this.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
    this.userProfileTableDetails.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
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
    this.getAllAttribute();
  }

  // delete
  deleteUserProfileById(id: any) {
    this.notifiService.showLoader();
    if (this.filterCriteria.role == 'ADMIN') {
      this.notifiService.deleteAdminById(id).subscribe({
        next: async (data: any) => {
          this.notifiService.toster.success('Admin Profile Deleted successfully!');
          await this.userProfileGrid?.init();
          this.notifiService.hideLoader();
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error || err;
          this.notifiService.toster.error(err.message || 'Admin Profile Deleted Failed');
        }
      });
    } else {
      this.notifiService.deleteUserProfileById(id).subscribe({
        next: async (data: any) => {
          this.notifiService.toster.success('User Profile Deleted successfully!');
          await this.userProfileGrid?.init();
          this.notifiService.hideLoader();
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error || err;
          this.notifiService.toster.error(err.message || 'User Profile Deleted Failed');
        }
      });
    }
  }

  getAllAttribute() {
    this.notifiService.getAllAttribute().subscribe({
      next: (data: any) => {
        this.listOfTags = data;
      },
      error: (err: any) => {
        err = err.error || err;
      }
    });
  }

  async confirmDelete(user: any, status?: any) {
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
          text: 'Delete',
          cssClass: 'alert-button-confirm',
          handler: () => {
            this.deleteUserProfileById(user.id);
          }
        },
      ],
    });
    await alert.present();
  }

  isFilterCriteriaChanged() {
    var source = this.userProfileTableDetails.filterCriteria;
    var dest = this.filterCriteria;
    const fieldList = ["role", "email", "telephone_number", "identifier", "data_source", "external_source_id", "tag_field", "tag_value"];
    return fieldList.find((key: string) => (source[key] || "") != (dest[key] || "")) != null;
  }

  onSearch() {
    if (this.isFilterCriteriaChanged()) {
      this.userProfileTableDetails.filterCriteria = JSON.parse(JSON.stringify(this.filterCriteria));
      this.userProfileGrid?.applyFilterCriteria();
    }
    this.modalctrl.dismiss()
  }

  onReset() {
    this.filterCriteria = JSON.parse(JSON.stringify(this.defaultFilterCriteria));
    if (this.isFilterCriteriaChanged()) {
      this.userProfileTableDetails.filterCriteria = JSON.parse(JSON.stringify(this.filterCriteria));
      this.userProfileGrid?.applyFilterCriteria();
    }
  }
  numericOnly(event: any): boolean {
    let pattern = /^([0-9])$/;
    let result = pattern.test(event.key);
    return result;
  }
  onClose() {
    this.modalctrl.dismiss();
  }
}

