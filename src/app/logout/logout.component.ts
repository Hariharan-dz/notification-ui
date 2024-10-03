import { Component, OnInit } from '@angular/core';
import { NotificationUiService } from '../services/notification-ui.service';

@Component({
  selector: 'app-logout',
  templateUrl: './logout.component.html',
  styleUrls: ['./logout.component.scss'],
})
export class LogoutComponent implements OnInit {

  constructor(public notifiService: NotificationUiService) {
    this.notifiService.showLoader();
    if(this.notifiService.hasToken()){
      this.notifiService.logout().subscribe({
        next: async (details: any) => {
          await this.notifiService.deleteLoginDetails();
          location.href = '/login';
        },
        error: async (err: any) => {
          await this.notifiService.deleteLoginDetails();
          err = err.error || err;
          console.log(err.message || 'Failed');
          location.href = '/login';
        }
      });
    }else{
      location.href = '/login';
    }
  }

  ngOnInit() { }

}
