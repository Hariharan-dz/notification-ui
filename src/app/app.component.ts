/* eslint-disable @angular-eslint/no-empty-lifecycle-method */
import { Component, OnInit, HostListener, Optional } from '@angular/core';
import { Router } from '@angular/router';
import { NotificationUiService } from './services/notification-ui.service';
import { PushNotificationService } from './services/push-notification.service';
import { App } from '@capacitor/app';
import { Location } from '@angular/common';
import { AlertController, IonRouterOutlet, NavController, Platform } from '@ionic/angular';
import { AuthGuard } from './services/auth.guard';

@Component({
  selector: 'app-root',
  templateUrl: 'app.component.html',
  styleUrls: ['app.component.scss'],
})
export class AppComponent implements OnInit {
  urlList: any = ['/login', '/signup', '/authorize', '/logout', '/reset-password'];
  isMenuCollapse = true;
  menuList = [
    {
      title: 'Dashboard',
      image: 'logo-apple-ar',
      link: 'dashboard',
    },
    {
      title: 'Configuration',
      image: 'options-outline',
      link: 'configuration',
    },
    {
      title: 'Notification',
      image: 'notifications-outline',
      link: 'notification',
    },
    {
      title: 'A/B testing',
      image: 'flask-outline',
      link: 'ab-testing',
    },
    {
      title: 'User Profile',
      image: 'person-outline',
      link: 'user-profile',
    },
  ];

  customPopoverOptions: any = {
    cssClass: 'popover-wide',
  };
  logInPageURL = '/login';
  @Optional() private routerOutlet!: IonRouterOutlet
  private readonly canGoBack: any;
  constructor(public route: Router,
    public notifiService: NotificationUiService,
    private pushNotificationService: PushNotificationService,
    private _location: Location,
    private alertController: AlertController,
    private platform: Platform,
    public navCtrl: NavController,
    private router: Router,
  ) {
    // let canGoBack = this.routerOutlet.canGoBack();
    const url = this.route.url;
    console.log(url)
    this.canGoBack = !!(this.router.getCurrentNavigation()?.previousNavigation);

    App.addListener('backButton', (event) => {
      this._location.back();

      //   alert(this.canGoBack)
      //   if (this._location.isCurrentPathEqualTo('/configuration/category')) {
      //     // his._location.back();
      //     if (this.canGoBack) {
      //       alert('sdsd')
      //     }
      //     console.log(event)

      //     //     // navigator['app'].exitApp();
      //     //     // this.route.navigate['app'].exitApp();
      //     //     // alert('1st alert')
      //     //     // this.exitConformation();
      //     //     // console.log('vdfvd')
      //     //     this._location.back();
      //     //     // if (this.routerOutlet.canGoBack() == false) {
      //     //     //   // this.exitConformation();
      //     //     //   alert('dsa')
      //     //     // }
      //     // // alert(window.onpopstate)
      //     // window.onpopstate = function (event) {
      //     //   console.log('Back/forward button clicked');
      //     //   console.log(event.state, 'sdsad');

      //     // };
      //   }
      //   // else {
      //   //   this._location.back();
      //   //     this.platform.backButton.subscribeWithPriority(-1, () => {
      //   //       console.log("-1 colum");
      //   //       //   // if (!this.routerOutlet.canGoBack()) {
      //   //       //   //   this.exitConformation();
      //   //       //   // }
      //   //     });
      // }
    });



    // check.then(res => console.log('res', res)).catch(err => console.log('Err', err));
    // console.log('CHCK', check);
    // App.addListener('backButton', () => {
    //   this.platform.backButton.subscribeWithPriority(-1, () => {
    //     if (!this.routerOutlet.canGoBack()) {
    //       // Show confirmation popup
    //       this.exitConformation();
    //     } else {
    //       // Go back to the previous page
    //       this._location.back();
    //     }
    //   });
    // })
  }

  ngOnInit() {
    // this.platform.backButton.subscribeWithPriority(0, () => {
    //   this.exitConformation();
    // });
  }


  async exitConformation() {
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: 'Want to exit',
      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel btn-secondary',
        },
        {
          text: 'Leave',
          cssClass: 'alert-button-confirm btn-primary',
          handler: () => { navigator['app'].exitApp() }
        },
      ],
    });
    await alert.present();
  }

  async logOutConformation() {
    const alert = await this.alertController.create({
      header: 'Are you sure?',
      subHeader: 'Want to logout',
      cssClass: 'custom-alert-style',
      buttons: [
        {
          text: 'Cancel',
          cssClass: 'alert-button-cancel btn-secondary',
        },
        {
          text: 'Leave',
          cssClass: 'alert-button-confirm btn-primary',
          handler: () => {
            this.notifiService.deleteLoginDetails();
            this.router.navigate(['/logout']);
          }
        },
      ],
    });
    await alert.present();
  }

}
