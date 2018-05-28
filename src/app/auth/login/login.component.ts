import {Component} from '@angular/core';
import {Router} from '@angular/router/router';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {ACCESS_TOKEN_NAMESPACE, API_URI_RESET_PASSWORD} from '../../shared/services/nsfo-api/nsfo.settings';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  templateUrl: './login.component.html'
})

export class LoginComponent {
  private login_in_progress = false;
  private form_valid = true;
  private form: FormGroup;

  private form_forgot_pw_valid = true;
  private form_forgot_pw: FormGroup;

  private sent_email = false;
  private enable_forgot_pw = false;

  constructor(private apiService: NSFOService,
              private fb: FormBuilder,
              private router: Router) {
    this.form = this.fb.group({
      username: new FormControl( '', Validators.required),
      password: new FormControl('', Validators.required)
    });

    this.form_forgot_pw = this.fb.group(
      {
        email_address: new FormControl('', Validators.required)
      });
  }


  private requestNewPassword() {
    this.apiService
      .doPutRequest(API_URI_RESET_PASSWORD, this.form_forgot_pw.value)
      .subscribe(() => {
      });
    this.sent_email = true;
  }


  private enableForgetPassword() {
    this.enable_forgot_pw = !this.enable_forgot_pw;
  }

  private doLogin() {
    if (this.form.valid) {
      this.form_valid = true;
      this.login_in_progress = true;
      const username = this.form.get('username').value.toLowerCase().trim();
      const password = this.form.get('password').value;
      this.apiService.doLoginRequest(username, password)
        .subscribe(
          res => {
            if (res[ACCESS_TOKEN_NAMESPACE]) {
              localStorage.setItem(ACCESS_TOKEN_NAMESPACE, res[ACCESS_TOKEN_NAMESPACE]);
              this.router.navigate(['/main']);
            } else {
              this.form_valid = false;
              this.login_in_progress = false;
            }
          },
          err => {
            this.form_valid = false;
            this.login_in_progress = false;
          }
        );
    } else {
      this.form_valid = false;
      this.login_in_progress = false;
    }
  }

  private resetForm() {
    this.sent_email = false;

    this.form.reset({
      username: '',
      password: '',
    });

    this.form_forgot_pw.reset({
      email_address: '',
    });
  }
}
