import { Component, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { NotificationUiService } from '../services/notification-ui.service';
import { AESEncryptDecryptServiceService } from '../services/aes-encrypt-decrypt-service.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.scss'],
})

export class LoginComponent implements OnInit {
  state: string = '';
  user: any = {};

  @ViewChild('showpassword') passwordInput!: any;

  constructor(public router: Router, private actRouter: ActivatedRoute,
    public notifiService: NotificationUiService,
    private AESEncryptDecryptService: AESEncryptDecryptServiceService) {
    if (this.notifiService.hasToken()) {
      this.router.navigateByUrl('/home');
    }
    this.actRouter.queryParams.subscribe((param: Params) => {
      this.state = param['state'];
    });
  }

  ngOnInit() { }

  login() {
    try {
      if (!this.user.username) throw { message: "Please enter email address" };
      if (!this.user.password) throw { message: "Please enter password" };
      this.notifiService.showLoader();
      var loginRequestPayload: any = {
        username: this.user.username,
        password: this.AESEncryptDecryptService.encrypt(this.user.password)
      };
      this.notifiService.login(loginRequestPayload).subscribe({
        next: async (details: any) => {
          this.notifiService.hideLoader();
          this.notifiService.setTokenToCookie(details);
          var userDetails:any = await this.notifiService.getUserByDataSource('COGNITO', details.user_id, {"response_type" : "USER_ROOT_DETAILS"}).toPromise();
          await this.notifiService.storage.set('login-user-Details', JSON.stringify(userDetails));
          this.notifiService.userDetails = userDetails;
          // this.router.navigateByUrl(this.state || '/home');
          location.href = this.state || '/home';
        },
        error: async (err: any) => {
          this.notifiService.hideLoader();
          await this.notifiService.deleteLoginDetails();
          err = err.error || err;
          this.notifiService.toster.error(err.message || 'Failed');
        }
      });
    } catch (err: any) {
      this.notifiService.toster.error(err.message || err);
    }
  }

  showPasswordtoggle(status: any) {
    if (status == 'keyUp')
      this.passwordInput.type = 'password';
    this.passwordInput.type = status == 'leave' ? 'text' : 'password';
  }
}
