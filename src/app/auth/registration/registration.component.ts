import { Component, OnInit } from '@angular/core';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';

@Component({
  selector: 'app-registration',
  templateUrl: './registration.component.html'
})
export class RegistrationComponent implements OnInit {

  public form: FormGroup;

  private registration_in_progress = false;

  constructor(private fb: FormBuilder) {
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

  private doRegistration()
  {
    // this is a mock registration
    // TODO: add a request to the api
    this.registration_in_progress = true;

    setTimeout(() => { this.registration_in_progress = false; }, 5000);
  }
}
