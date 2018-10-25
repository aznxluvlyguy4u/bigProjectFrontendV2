import * as moment from 'moment';
import {AfterViewInit, Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {ArrivalRequest} from '../arrival.model';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Constants} from '../../../shared/variables/constants';
import {API_URI_DECLARE_ARRIVAL} from '../../../shared/services/nsfo-api/nsfo.settings';
import {DateValidator, UBNValidator} from '../../../shared/validation/nsfo-validation';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {CacheService} from '../../../shared/services/settings/cache.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  templateUrl: './arrival.declare.html',

})

export class ArrivalDeclareComponent implements OnInit, OnDestroy, AfterViewInit {
  public arrival_list = [];
    public country_code_list = [];
    public arrival = new ArrivalRequest();

    public form_valid = true;
    public in_progress = false;
    public error_message = 'SOMETHING WENT WRONG! TRY AGAIN AT LATER TIME!';
    public error_number = '';

    public modal_display = 'none';

    public view_date_format;
    public model_datetime_format;

    public import_animal: FormGroup = new FormGroup({
        import_flag: new FormControl(this.constants.NO),
        ubn_previous_owner: new FormControl('', UBNValidator.validateUbn),
        certificate_number: new FormControl(''),
    });

    public form: FormGroup = new FormGroup({
        uid_type: new FormControl(this.constants.ULN),
        uid_country_code: new FormControl('NL'),
        uid_number: new FormControl('', Validators.required),
        arrival_date: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat])),
        import_animal: this.import_animal
    });

    public countryCodeObs;

  constructor(public constants: Constants,
              private fb: FormBuilder,
              private apiService: NSFOService,
              private cache: CacheService,
              private translate: TranslateService,
              private settings: SettingsService) {
    this.view_date_format = settings.getViewDateFormat();
    this.model_datetime_format = settings.getModelDateTimeFormat();

    this.import_animal = new FormGroup({
      import_flag: new FormControl(constants.NO),
      ubn_previous_owner: new FormControl('', UBNValidator.validateUbnAllowEmpty),
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
    // $('#error-message').foundation();
  }

  ngOnDestroy() {
    this.countryCodeObs.unsubscribe();
  }

  public getTempArrivalList() {
    if (sessionStorage['arrival_list']) {
      const arrival_list = <ArrivalRequest[]> JSON.parse(sessionStorage['arrival_list']);
      for (const arrival of arrival_list) {
        this.arrival_list.push(arrival);
      }
    }
  }

  public getCountryCodeList() {
    this.countryCodeObs = this.settings.getCountryList()
      .subscribe(countryCodeList => {
        this.country_code_list = countryCodeList[0];
      });
  }

  public addNewArrival() {
    if (this.form.valid) {
      this.form_valid = true;

      if (this.import_animal.controls['import_flag'].value === this.constants.NO) {
        const ubnPreviousOwner = this.import_animal.controls['ubn_previous_owner'].value;
        if (ubnPreviousOwner === this.cache.getUbn()) {
          this.error_message = this.translate.instant('UBN OF DEPARTURE AND ARRIVAL ARE IDENTICAL');
          this.openModal();
          return;
        }
        if (!this.isValidUbn(ubnPreviousOwner)) {
          this.error_message = this.translate.instant('UBN IS INVALID') + ': ' + ubnPreviousOwner;
          this.openModal();
          return;
        }
      }

      const arrival = new ArrivalRequest();
      const arrival_date_string = moment(this.form.get('arrival_date').value, this.settings.getViewDateFormat());
      arrival.arrival_date = arrival_date_string.format(this.settings.getModelDateTimeFormat());

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

  public removeArrival(item) {
    const index = this.arrival_list.indexOf(item);
    this.arrival_list.splice(index, 1);
    sessionStorage.setItem('arrival_list', JSON.stringify(this.arrival_list));
  }

  public declareArrivals() {
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
                this.import_animal.get('import_flag').setValue('NO');
                this.import_animal.get('ubn_previous_owner').setValue('');
                this.import_animal.get('certificate_number').setValue('');
                this.form.get('arrival_date').setValue(this.getToday());
              }
            },
            err => {
              const error = err.error ? err.error.result : undefined;

              if (!error || !error.message) {
                this.error_message = 'SOMETHING WENT WRONG! TRY AGAIN AT LATER TIME!';
              } else {
                this.error_message = error.message;
                this.error_number = error.pedigree;
                this.error_number = error.uln;
              }

              this.openModal();
              this.in_progress = false;
            });
      }
    }
  }

  public clearUBNValue() {
    this.import_animal.get('ubn_previous_owner').setValue('');
  }

  public clearCertificateValue() {
    this.import_animal.get('certificate_number').setValue('');
  }

  public openModal() {
    this.modal_display = 'block';
  }

  public closeModal() {
    this.modal_display = 'none';
  }

  public stringAsDate(date) {
    return moment(date).format(this.settings.getViewDateFormat());
  }

  public getToday() {
    moment().format(this.settings.getViewDateFormat());
  }

  private isValidUbn(ubn: string): boolean {
    if (this.cache.useRvoLogic()) {
      return UBNValidator.isValidDutchUbn(ubn);
    }
    return UBNValidator.isValidNonDutchUbn(ubn);
  }
}
