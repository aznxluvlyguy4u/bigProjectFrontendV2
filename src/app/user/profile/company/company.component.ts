import {Component, OnInit} from '@angular/core';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {
  API_URI_CHANGE_COMPANY_PROFILE,
  API_URI_GET_COMPANY_PROFILE,
  API_URI_GET_STATE_CODES
} from '../../../shared/services/nsfo-api/nsfo.settings';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {UtilsService} from '../../../shared/services/utils/utils.services';
import * as _ from 'lodash';
import {Company} from '../../../shared/models/company.model';

@Component({
  templateUrl: './company.component.html',

})

export class ProfileCompanyComponent implements OnInit {
  private stateList = [];
  private company = new Company();
  private form: FormGroup;
  private form_valid = true;
  private changed_company_info = false;
  private in_progress = false;

  constructor(private apiService: NSFOService, private fb: FormBuilder, private utils: UtilsService) {
    this.form = fb.group({
      company_name: new FormControl('', Validators.required),
      telephone_number: new FormControl(''),
      vat_number: new FormControl(''),
      chamber_of_commerce_number: new FormControl(''),
      company_relation_number: new FormControl(''),
      first_name: new FormControl('', Validators.required),
      last_name: new FormControl('', Validators.required),
      cellphone_number: new FormControl(''),
      is_reveal_historic_animals: new FormControl(''),
      address_street_name: new FormControl('', Validators.required),
      address_address_number: new FormControl('', Validators.required),
      address_suffix: new FormControl(''),
      address_postal_code: new FormControl('', Validators.required),
      address_city: new FormControl('', Validators.required),
      address_state: new FormControl('', Validators.required),
      billing_address_street_name: new FormControl('', Validators.required),
      billing_address_address_number: new FormControl('', Validators.required),
      billing_address_suffix: new FormControl(''),
      billing_address_postal_code: new FormControl('', Validators.required),
      billing_address_city: new FormControl('', Validators.required),
      billing_address_state: new FormControl('', Validators.required),
      veterinarian_dap_number: new FormControl(''),
      veterinarian_company_name: new FormControl(''),
      veterinarian_telephone_number: new FormControl(''),
      veterinarian_email_address: new FormControl(''),
    });
  }

  ngOnInit() {
    this.getStateList();
    this.getCompanyInfo();
  }

  private getCompanyInfo() {
    this.apiService.doGetRequest(API_URI_GET_COMPANY_PROFILE)
      .subscribe(
        res => {
          this.company = res.result;

          this.updateIsRevealHistoricAnimalsValue();
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  private getStateList() {
    this.apiService.doGetRequest(API_URI_GET_STATE_CODES)
      .subscribe(
        res => {
          this.stateList = _.sortBy(res.result, ['name']);
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  private saveCompanyInfo() {
    this.changed_company_info = false;

    if (this.form.valid) {
      this.form_valid = true;
      this.in_progress = true;

      this.apiService.doPutRequest(API_URI_CHANGE_COMPANY_PROFILE, this.company)
        .subscribe(
          res => {
            this.utils.initUserInfo();
            this.changed_company_info = true;
            this.in_progress = false;
          }
        );

      this.updateIsRevealHistoricAnimalsValue();
    } else {
      this.form_valid = false;
    }
  }

  private updateIsRevealHistoricAnimalsValue() {
    if (this.company.is_reveal_historic_animals === undefined) {
      this.company.is_reveal_historic_animals = false;
    }
  }
}
