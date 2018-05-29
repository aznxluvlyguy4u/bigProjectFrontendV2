import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_CHANGE_EMAIL, API_URI_GET_COMPANY_LOGIN} from '../../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {LoginInfo} from '../../../shared/models/login-info.model';

@Component({
  templateUrl: './email.component.html',
})
export class ProfileEmailComponent implements OnInit {
  private login_nsfo = new LoginInfo();
  private form_nsfo: FormGroup;

  private error_message = '';
  private in_progress = false;
  private form_nsfo_valid = true;
  private changed_nsfo_email = false;

  constructor(private apiService: NSFOService, private fb: FormBuilder, private settings: SettingsService) {
    this.form_nsfo = fb.group({
      email_address: new FormControl('', Validators.required),
      password: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
    this.getCompanyInfo();
  }

  private getCompanyInfo() {
    this.apiService.doGetRequest(API_URI_GET_COMPANY_LOGIN)
      .subscribe(
        res => {
          this.login_nsfo = res.result.nsfo;
          this.settings.setCurrentUser(this.login_nsfo.logged_in_user);
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  private saveNSFOLoginInfo() {
    this.error_message = '';
    this.changed_nsfo_email = false;

    if (this.form_nsfo.valid) {
      this.form_nsfo_valid = true;
      this.in_progress = true;

      const request = {
        'password': btoa(this.form_nsfo.controls['password'].value),
        'email_address': btoa(this.form_nsfo.controls['email_address'].value),
        'dashboard_type': 'client'
      };

      this.apiService
        .doPostRequest(API_URI_CHANGE_EMAIL, request)
        .subscribe(
          res => {
            this.changed_nsfo_email = true;
            this.in_progress = false;
          },
          err => {
            this.in_progress = false;
            alert(this.apiService.getErrorMessage(err));
          }
        );
    } else {
      this.form_nsfo_valid = false;
    }
  }
}
