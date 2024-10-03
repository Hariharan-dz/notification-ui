import { Component, ContentChild, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute, Params, Router } from '@angular/router';
import { NotificationUiService } from '../services/notification-ui.service';
import { AESEncryptDecryptServiceService } from '../services/aes-encrypt-decrypt-service.service';
import { IonInput } from '@ionic/angular';

@Component({
  selector: 'app-signup',
  templateUrl: './signup.component.html',
  styleUrls: ['./signup.component.scss'],
})

export class SignupComponent implements OnInit {
  state: string = '';
  user: any = {};
  showVerificationCodeView = false;
  ischeckedcode: boolean = false;
  today = new Date();
  year = this.today.getFullYear();
  month = ('0' + (this.today.getMonth() + 1)).slice(-2);
  day = ('0' + this.today.getDate()).slice(-2);
  formattedDate = this.year + '-' + this.month + '-' + this.day;

  @ViewChild('showpassword') passwordInput!: any;
  @ViewChild('showConfirmpassword') confirmPasswordInput!: any;

  constructor(public router: Router, private actRouter: ActivatedRoute, public notifiService: NotificationUiService, private AESEncryptDecryptService: AESEncryptDecryptServiceService) {
    if (this.notifiService.hasToken()) {
      this.router.navigateByUrl('/home');
    }
    this.actRouter.queryParams.subscribe((param: Params) => {
      this.state = param['state'];
    });
  }

  ngOnInit() { }

  signUp() {
    try {
      this.validateRegistrationDetails();

      this.user.phone_number_extenstion = this.user.phone_number_extenstion.toString();
      this.notifiService.showLoader();
      var requestPayload = JSON.parse(JSON.stringify(this.user));
      requestPayload.password = this.AESEncryptDecryptService.encrypt(this.user.password),
        this.notifiService.signup(requestPayload).subscribe({
          next: (details: any) => {
            this.notifiService.hideLoader();
            this.showVerificationCodeView = true;
            this.notifiService.setTokenToCookie(details);
          },
          error: (err: any) => {
            err = err.error || err;
            this.notifiService.toster.error(err.message || 'User registration failed');
            this.notifiService.hideLoader();
          }
        });
    }
    catch (err: any) {
      this.notifiService.toster.error(err.message || err);
    }
  }

  validateRegistrationDetails() {
    if (this.user.length > 0)
      Object.keys(this.user).forEach(key => {
        if (typeof (this.user[key] == "string")) this.user[key] = this.user[key].trim();
      });

    const emailRegex = new RegExp(/^[A-Za-z0-9_!#$%&'*+\/=?`{|}~^.-]+@web-3.in$/);
    const phone_number_extenstionRegex = new RegExp(/^[\+]{1}[0-9]{1,9}$/);  //{3}[\s-]
    if (!this.user.first_name) throw { message: "Please enter first name" };
    if (this.user.first_name.trim().length === 0) throw { message: "Please enter first name" };
    if (!this.user.last_name) throw { message: "Please enter last name" };
    if (this.user.last_name.trim().length === 0) throw { message: "Please enter last name" };
    if (this.user.date_of_birth) {
      if (this.user.date_of_birth > this.formattedDate) throw { message: "Please enter valid date of birth" };
    }
    if (!this.user.username) throw { message: "Please enter email address" };
    if (!emailRegex.test(this.user.username)) { throw { message: "Email is not valid" } };
    if (!this.user.gender) throw { message: "Please select gender" };
    if (!this.user.phone_number_extenstion) throw { message: "Please enter phone number extenstion" };
    if (!phone_number_extenstionRegex.test(this.user.phone_number_extenstion)) throw { message: "Please enter phone number extenstion" };
    if (!this.user.phone_number) throw { message: "Please enter phone number" };
    if (isNaN(this.user.phone_number)) throw { message: "Phone number is not valid" };
    if (!this.user.password) throw { message: "Please enter password" };
    if (!this.user.confirmPassword) throw { message: "Please enter confirm password" };
    if (this.user.password != this.user.confirmPassword) throw "Confirm password not matched";
  }

  emailConfirmationCode() {
    try {
      if (!this.user.signUpconfirmationCode) throw "Please enter confirmation code";
      var SignUpRequestPayload: any = {
        username: this.user.username,
        confirmationCode: this.user.signUpconfirmationCode
      };
      this.notifiService.showLoader();
      this.notifiService.confirmRegistration(SignUpRequestPayload).subscribe(
        {
          next: (details: any) => {
            this.notifiService.hideLoader();
            this.ischeckedcode = true;//succes checkbox
            setTimeout((delay: any) => { this.router.navigateByUrl('/login'); }, 1000)
          },
          error: (err: any) => {
            this.notifiService.hideLoader();
            err = err.error || err;
            this.notifiService.toster.error(err.message || 'User registration failed');
          }
        }
      )
    }
    catch (err: any) {
      this.notifiService.toster.error(err.message || err);
      this.notifiService.hideLoader();
    }
  }

  resendConfirmationCode() {
    try {
      this.notifiService.showLoader();
      this.notifiService.resendConfirmation({ username: this.user.username }).subscribe(
        {
          next: (data: any) => {
            this.notifiService.hideLoader();
            this.notifiService.toster.success('Code has been Sent Successfully');
          },
          error: (err: any) => {
            this.notifiService.hideLoader();
            err = err.error || err;
            this.notifiService.toster.error(err.message || 'Failed');
          }
        }
      )
    } catch (err: any) {
      this.notifiService.toster.error(err.message || err);
      this.notifiService.hideLoader();
    }
  }

  showPasswordtoggle(status: any) {
    if (status == 'keyUp')
      this.passwordInput.type = 'password';
    this.passwordInput.type = status == 'leave' ? 'text' : 'password';
  }

  showConfirmPasswordtoggle(status: any) {
    if (status == 'keyUpConfirm')
      this.confirmPasswordInput.type = 'password';
    this.confirmPasswordInput.type = status == 'leave' ? 'text' : 'password';
  }
}
