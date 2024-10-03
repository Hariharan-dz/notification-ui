import { Component, OnInit, ViewChild } from '@angular/core';
import { Router } from '@angular/router';
import { AESEncryptDecryptServiceService } from '../services/aes-encrypt-decrypt-service.service';
import { NotificationUiService } from '../services/notification-ui.service';

@Component({
  selector: 'app-reset-password',
  templateUrl: './reset-password.component.html',
  styleUrls: ['./reset-password.component.scss'],
})
export class ResetPasswordComponent implements OnInit {

  user: any = {};
  showVerificationCodeView: boolean = false;

  @ViewChild('showpassword') passwordInput!: any;
  constructor(public notifiService: NotificationUiService,
    private AESEncryptDecryptService: AESEncryptDecryptServiceService,
    private router: Router
  ) { }

  ngOnInit() {
  }

  validateEmail(isResendPwdFlow: boolean) {
    try {
      if (!this.user.username) throw "Please enter email address";

      this.notifiService.showLoader();
      this.notifiService.resetPassword({ username: this.user.username }).subscribe({
        next: (data: any) => {
          this.notifiService.hideLoader();
          this.showVerificationCodeView = true
          this.notifiService.toster.success(isResendPwdFlow ? 'Verification code resent successfully' : 'Code sent successfully');
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error || err;
          this.notifiService.toster.error(err.message || 'Failed');
        }
      })
    } catch (err: any) {
      this.notifiService.toster.error(err.message || err);
    }

  }
  resetPassword() {
    try {
      if (!this.user.confirmationCode) throw "Please enter confirmation code";
      if (!this.user.password) throw "Please enter password";
      if (!this.user.confirmPassword) throw "Please enter confirm password";
      if (this.user.password != this.user.confirmPassword) throw "Password not matched";


      var loginRequestPayload: any = {
        confirmationCode: this.user.confirmationCode,
        password: this.AESEncryptDecryptService.encrypt(this.user.password),
        username: this.user.username
      };
      this.notifiService.showLoader();
      this.notifiService.confirmForgotPassword(loginRequestPayload).subscribe({
        next: (data: any) => {
          this.notifiService.hideLoader();
          this.notifiService.toster.success('Password got reset successfully');
          this.router.navigateByUrl('/login');
        },
        error: (err: any) => {
          this.notifiService.hideLoader();
          err = err.error || err;
          this.notifiService.toster.error(err.message || 'Failed');
        }
      })
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
