import { DatePipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { MatPaginator } from '@angular/material/paginator';
import { MatSort } from '@angular/material/sort';
import { MatTableDataSource } from '@angular/material/table';
import { AlertController, ModalController } from '@ionic/angular';
import { DataTableComponent } from 'src/app/data-table/data-table.component';
import { SegmentViewPopupComponent } from 'src/app/segment-view-popup/segment-view-popup.component';
import { NotificationUiService } from 'src/app/services/notification-ui.service';

@Component({
  selector: 'app-user-segment',
  templateUrl: './user-segment.component.html',
  styleUrls: ['./user-segment.component.scss'],
})
export class UserSegmentComponent implements OnInit {
  userTableDetails: any = {
    name: "user segment",
    pk: "id",
    search: "",
    needServerSidePagination: true,
    fields: [
      { name: "ID", attr: "id", width: "75", type: "LINK" },
      { name: "Name", attr: "name", width: "175", className: "textCapitalize" },
      { name: "Description", attr: "description", width: "150", },
      { name: "Created Time", attr: "createdAt", width: "175" },
      { name: "Updated Time ", attr: "updatedAt", width: "175" },
    ],
    actions: [
      { name: "Edit", attr: 'edit', getLink: (el: any) => '/configuration/user-segment/' + el.id },
      { name: "Clone", attr: 'clone', getLink: (el: any) => '/configuration/user-segment/clone/' + el.id },
      { name: "Disable", clickFunction: (el: any) => this.confirmDelete(el, 'disable') },
      { name: "View User", clickFunction: (el: any) => this.getUserSegmentById(el.id, el.name) }
    ],
    getRecord: (params: any) => this.notifiService.getAllUserSegment(params),
    buildData: (userList: any) => {
      return userList.map((user: any) => {
        return {
          id: user.id,
          name: user.name,
          description: user.description,
          createdAt: this.datePipe.transform(user.createdAt, this.notifiService.date_time_format),
          updatedAt: this.datePipe.transform(user.updatedAt, this.notifiService.date_time_format),
          link: {
            id: '/configuration/user-segment/' + user.id
          },
          action: {
            edit: '/configuration/user-segment/' + user.id,
            clone: '/configuration/user-segment/clone/' + user.id,
          }
        };
      });
    }
  };

  @ViewChild('userSegment_grid') userSegmentGrid: DataTableComponent | undefined;

  constructor(public notifiService: NotificationUiService, private alertController: AlertController, private datePipe: DatePipe, private modalController: ModalController) { }

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

  async confirmDelete(userSegement: any, status?: any) {
    // this.selectedCategory = userSegement;
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
            this.deleteUserSegment(userSegement.id);
          }
        },
      ],
    });
    await alert.present();
  }

  deleteUserSegment(id: any) {
    this.notifiService.deleteUserSegmentById(id).subscribe(
      {
        next: (data: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success('Usersegment disable successfully!');
          this.userSegmentGrid?.init();
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error || err;
          this.notifiService.toster.error(err.message || 'Usersegment disable Failed');
        }
      }
    )
  }

  getUserSegmentById(userSegmentId: any, userName: any) {
    this.notifiService.showLoader();
    this.notifiService.getUserSegmentById(userSegmentId).subscribe({
      next: (userSegment: any) => {
        this.notifiService.hideLoader();
        this.openSegmentViewPopup(userSegment.rules, userName)
      },
      error: (err: any) => {
        this.notifiService.hideLoader();
        err = err.error || err;
        this.notifiService.toster.error(err.message || 'Failed');
      }
    });
  }

  async openSegmentViewPopup(rules: any, userName: any) {
    const modal = await this.modalController.create({
      component: SegmentViewPopupComponent,
      cssClass: 'view-user',
      componentProps: {
        usersegementRules: rules,
        userName: userName
      },
      backdropDismiss: false,
    });
    await modal.present();
  }

}
