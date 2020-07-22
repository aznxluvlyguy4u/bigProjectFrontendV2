import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {User} from '../../shared/models/user.model';
import { API_URI_SIGNUP_USER } from '../../shared/services/nsfo-api/nsfo.settings';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html'
})
export class RegistrationComponent implements OnInit {

  public form: FormGroup;

  private registration_in_progress = false;

  private user: User;

  constructor(private fb: FormBuilder, private apiService: NSFOService) {
    this.form = this.fb.group({
      firstName: new FormControl( '', Validators.required),
      lastName: new FormControl('', Validators.required),
      emailAddress: new FormControl('', Validators.required),
      address: new FormControl('', Validators.required),
      addressNumber: new FormControl('', Validators.required),
      addressNumberSuffix: new FormControl(''),
      postalCode: new FormControl('', Validators.required),
      city: new FormControl('', Validators.required),
      ubn: new FormControl('', Validators.required),
      brs: new FormControl('', Validators.required),
      phoneNumber: new FormControl('', Validators.required),
    });
  }

  ngOnInit() {
  }

  private doRegistration() {
    this.registration_in_progress = true;
    this.user = new User();

    if (this.form.valid) {
      this.user.first_name = this.form.get('firstName').value;
      this.user.last_name = this.form.get('lastName').value;
      this.user.email_address = this.form.get('emailAddress').value;
      this.user.street_name = this.form.get('address').value;
      this.user.address_number = this.form.get('addressNumber').value;
      this.user.address_number_suffix = this.form.get('addressNumberSuffix').value;
      this.user.postal_code = this.form.get('postalCode').value;
      this.user.city = this.form.get('city').value;
      this.user.ubn = this.form.get('ubn').value;
      this.user.brs = this.form.get('brs').value;
      this.user.phone_number = this.form.get('phoneNumber').value;

      this.apiService.doPostRequest(API_URI_SIGNUP_USER, this.user)
        .subscribe((res) => {
          console.log(res);
          this.registration_in_progress = false;
        },
          (error => {
            alert(this.apiService.getErrorMessage(error));
            this.registration_in_progress = false;
          })
        );
    }
  }
}
