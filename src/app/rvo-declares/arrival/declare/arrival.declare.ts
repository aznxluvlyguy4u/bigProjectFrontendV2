import * as moment from 'moment';
import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {ArrivalRequest} from '../arrival.model';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Constants} from '../../../shared/variables/constants';
import {API_URI_DECLARE_ARRIVAL} from '../../../shared/services/nsfo-api/nsfo.settings';
import {DateValidator, UBNValidator} from '../../../shared/validation/nsfo-validation';
import {SettingsService} from '../../../shared/services/settings/settings.service';

declare var $;

@Component({
  templateUrl: './arrival.declare.html',

})

export class ArrivalDeclareComponent implements OnInit, OnDestroy, AfterViewInit {
  private arrival_list = [];
  private country_code_list = [];
  private arrival = new ArrivalRequest();

  private form_valid = true;
  private in_progress = false;
  private error_message = 'SOMETHING WENT WRONG! TRY AGAIN AT LATER TIME!';
  private error_number = '';

  private modal_display = 'none';

  private view_date_format;
  private model_datetime_format;

  private form: FormGroup;
  private import_animal: FormGroup;

  private countryCodeObs;

  constructor(private constants: Constants,
              private fb: FormBuilder,
              private apiService: NSFOService,
              private settings: SettingsService) {
    this.view_date_format = settings.getViewDateFormat();
    this.model_datetime_format = settings.getModelDateTimeFormat();

    this.import_animal = new FormGroup({
      import_flag: new FormControl(constants.NO),
      ubn_previous_owner: new FormControl('', UBNValidator.validateWithSevenTest),
      certificate_number: new FormControl(''),
    });
    this.import_animal.validator = UBNValidator.isImportAnimal;

    this.form = fb.group({
      uid_type: new FormControl(constants.ULN),
      uid_country_code: new FormControl('NL'),
      uid_number: new FormControl('', Validators.required),
      arrival_date: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat])),
      import_animal: this.import_animal
    });
  }

  ngOnInit() {
    this.getTempArrivalList();
    this.getCountryCodeList();
  }

  ngAfterViewInit() {
    $('#error-message').foundation();
  }

  ngOnDestroy() {
    this.countryCodeObs.unsubscribe();
  }

  private getTempArrivalList() {
    if (sessionStorage['arrival_list']) {
      const arrival_list = <ArrivalRequest[]> JSON.parse(sessionStorage['arrival_list']);
      for (const arrival of arrival_list) {
        this.arrival_list.push(arrival);
      }
    }
  }

  private getCountryCodeList() {
    this.countryCodeObs = this.settings.getCountryList()
      .subscribe(countryCodeList => {
        this.country_code_list = countryCodeList;
      });
  }

  private addNewArrival() {
    if (this.form.valid) {
      this.form_valid = true;

      const arrival = new ArrivalRequest();
      arrival.arrival_date = moment(this.form.get('arrival_date').value, this.settings.getViewDateFormat());
      arrival.arrival_date = arrival.arrival_date.format(this.settings.getModelDateTimeFormat());

      if (this.import_animal.controls['import_flag'].value === this.constants.YES) {
        arrival.is_import_animal = true;
        arrival.country_origin = '';
        arrival.certificate_number = this.import_animal.controls['certificate_number'].value;
      }

      if (this.import_animal.controls['import_flag'].value === this.constants.NO) {
        arrival.is_import_animal = false;
        arrival.ubn_previous_owner = this.import_animal.controls['ubn_previous_owner'].value;
      }

      if (this.form.get('uid_type').value === this.constants.PEDIGREE) {
        arrival.animal.pedigree_country_code = this.form.get('uid_country_code').value;
        arrival.animal.pedigree_number = this.form.get('uid_number').value;
      }

      if (this.form.get('uid_type').value === this.constants.ULN) {
        arrival.animal.uln_country_code = this.form.get('uid_country_code').value;
        arrival.animal.uln_number = this.form.get('uid_number').value;
      }

      this.form.get('uid_number').setValue('');

      this.arrival_list.push(arrival);
      sessionStorage.setItem('arrival_list', JSON.stringify(this.arrival_list));
    } else {
      this.form_valid = false;
    }
  }

  private removeArrival(item) {
    const index = this.arrival_list.indexOf(item);
    this.arrival_list.splice(index, 1);
    sessionStorage.setItem('arrival_list', JSON.stringify(this.arrival_list));
  }

  private declareArrivals() {
    this.in_progress = true;

    if (this.arrival_list.length > 0) {
      let array_length = this.arrival_list.length;

      while (array_length--) {
        const arrival = this.arrival_list[array_length];
        arrival.country_origin = arrival.animal.uln_country_code;
        this.apiService
          .doPostRequest(API_URI_DECLARE_ARRIVAL, arrival)
          .subscribe(
            res => {
              const index = this.arrival_list.indexOf(arrival);
              this.arrival_list.splice(index, 1);
              sessionStorage.setItem('arrival_list', JSON.stringify(this.arrival_list));
              if (this.arrival_list.length === 0) {
                this.in_progress = false;
                this.form.get('import_flag').setValue('NO');
                this.form.get('ubn_previous_owner').setValue('');
                this.form.get('certificate_number').setValue('');
                this.form.get('arrival_date').setValue(this.getToday());
              }
            },
            err => {
              const error = err;
              this.error_message = error.message;
              this.error_number = error.pedigree;
              this.error_number = error.uln;

              if (!this.error_message) {
                this.error_message = 'SOMETHING WENT WRONG! TRY AGAIN AT LATER TIME!';
              }

              this.openModal();
              this.in_progress = false;
            });
      }
    }
  }

  private clearUBNValue() {
    this.import_animal.get('ubn_previous_owner').setValue('');
  }

  private clearCertificateValue() {
    this.import_animal.get('certificate_number').setValue('');
  }

  private openModal() {
    this.modal_display = 'block';
  }

  private closeModal() {
    this.modal_display = 'none';
  }

  private stringAsDate(date) {
    return moment(date).format(this.settings.getViewDateFormat());
  }

  private getToday() {
    moment().format(this.settings.getViewDateFormat());
  }
}
