import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {PasswordValidator} from '../../../shared/validation/nsfo-validation';
import {API_URI_CHANGE_PASSWORD, API_URI_GET_COMPANY_LOGIN} from '../../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {LoginInfo} from '../../../shared/models/login-info.model';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

@Component({
  templateUrl: './login.component.html',
})

export class ProfileLoginComponent implements OnInit {
  private login_nsfo = new LoginInfo();
  private form_nsfo: FormGroup;

  private error_message = '';
  private in_progress = false;
  private changed_nsfo_password = false;

  constructor(private apiService: NSFOService, private fb: FormBuilder, private settings: SettingsService) {
    this.form_nsfo = new FormGroup({
      current_password: new FormControl('', Validators.required),
      password: new FormControl('', Validators.compose([Validators.required, Validators.minLength(6)])),
      repeat_password: new FormControl('', Validators.compose([Validators.required, Validators.minLength(6)]))
    });
    this.form_nsfo.validator = PasswordValidator.validatePassword;
  }

  ngOnInit() {
    this.getCompanyInfo();
  }

  private getCompanyInfo() {
    this.apiService.doGetRequest(API_URI_GET_COMPANY_LOGIN)
      .subscribe(
          (res: JsonResponseModel) => {
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
    this.changed_nsfo_password = false;

    if (this.form_nsfo.valid) {
      this.in_progress = true;

      const request = {
        'current_password': btoa(this.form_nsfo.get('current_password').value),
        'new_password': btoa(this.form_nsfo.get('password').value)
      };

      this.apiService
        .doPutRequest(API_URI_CHANGE_PASSWORD, request)
        .subscribe(
          res => {
            this.changed_nsfo_password = true;
            this.in_progress = false;
          },
          err => {
            this.error_message = this.apiService.getErrorMessage(err);
            this.in_progress = false;
          }
        );
    }
  }
}
