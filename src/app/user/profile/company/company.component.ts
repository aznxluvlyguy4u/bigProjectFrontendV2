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
import {JsonResponseModel} from '../../../shared/models/json-response.model';

@Component({
  templateUrl: './company.component.html',
})

export class ProfileCompanyComponent implements OnInit {
  private stateList = [];
  private company = new Company();
  private form: FormGroup;
  private changed_company_info = false;
  private in_progress = false;

  constructor(private apiService: NSFOService, private fb: FormBuilder, private utils: UtilsService) {
    this.form = fb.group({
      company_name: ['', Validators.required],
      telephone_number: [''],
      vat_number: [''],
      chamber_of_commerce_number: [''],
      first_name: ['', Validators.required],
      last_name: ['', Validators.required],
      cellphone_number: [''],
      is_reveal_historic_animals: [''],
      address_street_name: ['', Validators.required],
      address_address_number: ['', Validators.required],
      address_suffix: [''],
      address_postal_code: ['', Validators.required],
      address_city: ['', Validators.required],
      address_state: ['', Validators.required],
      billing_address_street_name: ['', Validators.required],
      billing_address_address_number: ['', Validators.required],
      billing_address_suffix: [''],
      billing_address_postal_code: ['', Validators.required],
      billing_address_city: ['', Validators.required],
      billing_address_state: ['', Validators.required],
      veterinarian_dap_number: [''],
      veterinarian_company_name: [''],
      veterinarian_telephone_number: [''],
      veterinarian_email_address: [''],
    });
  }

  ngOnInit() {
    this.getStateList();
    this.getCompanyInfo();
  }

  private getCompanyInfo() {
    this.apiService.doGetRequest(API_URI_GET_COMPANY_PROFILE)
      .subscribe(
          (res: JsonResponseModel) => {
          this.company = res.result;

          if (this.company !== null && this.company !== undefined) {
            this.form.patchValue({
              company_name: this.company.company_name,
              telephone_number: this.company.telephone_number,
              vat_number: this.company.vat_number,
              chamber_of_commerce_number: this.company.chamber_of_commerce_number,
              is_reveal_historic_animals: this.company.is_reveal_historic_animals,
            });

            if (this.company.contact_person !== null && this.company.contact_person !== undefined) {
              this.form.patchValue({
                first_name: this.company.contact_person.first_name,
                last_name: this.company.contact_person.last_name,
                cellphone_number: this.company.contact_person.cellphone_number,
              });
            }

            if (this.company.address !== null && this.company.address !== undefined) {
              this.form.patchValue({
                address_street_name: this.company.address.street_name,
                address_address_number: this.company.address.address_number,
                address_suffix: this.company.address.address_number_suffix,
                address_postal_code: this.company.address.postal_code,
                address_city: this.company.address.city,
                address_state: this.company.address.state,
              });
            }

            if (this.company.billing_address !== null && this.company.billing_address !== undefined) {
              this.form.patchValue({
                billing_address_street_name: this.company.billing_address.street_name,
                billing_address_address_number: this.company.billing_address.address_number,
                billing_address_suffix: this.company.billing_address.address_number_suffix,
                billing_address_postal_code: this.company.billing_address.postal_code,
                billing_address_city: this.company.billing_address.city,
                billing_address_state: this.company.billing_address.state,
              });
            }

            if (this.company.veterinarian !== null && this.company.veterinarian !== undefined) {
              this.form.patchValue({
                veterinarian_dap_number: this.company.veterinarian.dap_number,
                veterinarian_company_name: this.company.veterinarian.company_name,
                veterinarian_telephone_number: this.company.veterinarian.telephone_number,
                veterinarian_email_address: this.company.veterinarian.email_address,
              });
            }
          }

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
          (res: JsonResponseModel) => {
          this.stateList = _.sortBy(res.result, ['name']);
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  saveCompanyInfo() {
    this.changed_company_info = false;

    if (this.form.valid) {
      this.in_progress = true;

      this.company.company_name = this.form.get('company_name').value;
      this.company.telephone_number = this.form.get('telephone_number').value;
      this.company.vat_number = this.form.get('vat_number').value;
      this.company.chamber_of_commerce_number = this.form.get('chamber_of_commerce_number').value;
      this.company.is_reveal_historic_animals = this.form.get('is_reveal_historic_animals').value;

      this.company.contact_person.first_name = this.form.get('first_name').value;
      this.company.contact_person.last_name = this.form.get('last_name').value;
      this.company.contact_person.cellphone_number = this.form.get('cellphone_number').value;

      this.company.address.street_name = this.form.get('address_street_name').value;
      this.company.address.address_number = this.form.get('address_address_number').value;
      this.company.address.suffix = this.form.get('address_suffix').value;
      this.company.address.postal_code = this.form.get('address_postal_code').value;
      this.company.address.city = this.form.get('address_city').value;
      this.company.address.state = this.form.get('address_state').value;

      this.company.billing_address.street_name = this.form.get('billing_address_street_name').value;
      this.company.billing_address.address_number = this.form.get('billing_address_address_number').value;
      this.company.billing_address.suffix = this.form.get('billing_address_suffix').value;
      this.company.billing_address.postal_code = this.form.get('billing_address_postal_code').value;
      this.company.billing_address.city = this.form.get('billing_address_city').value;
      this.company.billing_address.state = this.form.get('billing_address_state').value;

      this.company.veterinarian.dap_number = this.form.get('veterinarian_dap_number').value;
      this.company.veterinarian.company_name = this.form.get('veterinarian_company_name').value;
      this.company.veterinarian.telephone_number = this.form.get('veterinarian_telephone_number').value;
      this.company.veterinarian.email_address = this.form.get('veterinarian_email_address').value;

      this.apiService.doPutRequest(API_URI_CHANGE_COMPANY_PROFILE, this.company)
        .subscribe(
          res => {
            this.utils.initUserInfo();
            this.changed_company_info = true;
            this.in_progress = false;
          },
          error => {
            alert(this.apiService.getErrorMessage(error));
          }
        );

      this.updateIsRevealHistoricAnimalsValue();
    }
  }

  private updateIsRevealHistoricAnimalsValue() {
    if (this.company.is_reveal_historic_animals === undefined) {
      this.company.is_reveal_historic_animals = false;
      this.form.patchValue({
        is_reveal_historic_animals: this.company.is_reveal_historic_animals,
      });
    }
  }
}
