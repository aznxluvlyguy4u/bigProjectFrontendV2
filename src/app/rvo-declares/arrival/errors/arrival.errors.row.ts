import * as moment from 'moment';

import * as _ from 'lodash';
import {AfterViewChecked, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';

import {ArrivalErrorResponse} from '../arrival.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Settings} from '../../../shared/variables/settings';
import {API_URI_CHANGE_ARRIVAL, API_URI_GET_COUNTRY_CODES, API_URI_HIDE_ERROR} from '../../../shared/services/nsfo-api/nsfo.settings';
import {DateValidator, UBNValidator} from '../../../shared/validation/nsfo-validation';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

@Component({
  selector: '[app-arrival-errors-row]',
  templateUrl: './arrival.errors.row.html',
})

export class ArrivalErrorRowComponent implements OnInit, AfterViewChecked {
  @Input() arrival: ArrivalErrorResponse;
  @Input() arrival_index: number;
  @Output() removeArrival = new EventEmitter();
  @Output() showError = new EventEmitter();
  public editMode = false;
  public popupIsLoaded = false;
  public temp_arrival: ArrivalErrorResponse;
  public country_code_list = [];
  public form_valid = true;
  public uid_type_changed;
  public view_date_format;
  public view_datetime_format;
  public model_datetime_format;
  public form: FormGroup;

  constructor(private fb: FormBuilder,
              private apiService: NSFOService,
              private settings: Settings) {
    this.view_date_format = settings.VIEW_DATE_FORMAT;
    this.view_datetime_format = settings.VIEW_DATETIME_FORMAT;
    this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;

    this.form = fb.group({
      arrival_date: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat])),
      ubn_previous_owner: new FormControl('', UBNValidator.validateUbn),
      certificate_number: new FormControl('')
    });
  }

  ngOnInit() {
    this.getCountryCodeList();
  }

  ngAfterViewChecked() {
    // if (!this.popupIsLoaded) {
    //   $('#error-' + this.arrival_index).foundation();
    //   this.popupIsLoaded = true;
    // }
  }

  public getCountryCodeList() {
    this.apiService
      .doGetRequest(API_URI_GET_COUNTRY_CODES)
      .subscribe(
          (res: JsonResponseModel) => {
          this.country_code_list = _.sortBy(res.result, ['code']);
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  public sendChangeRequest() {
    if (this.form.valid) {
      this.form_valid = true;
      this.editMode = false;

      let new_arrival: ArrivalErrorResponse;
      new_arrival = _.clone(this.arrival);

      new_arrival.arrival_date = this.form.get('arrival_date').value;

      this.apiService
        .doPutRequest(API_URI_CHANGE_ARRIVAL + '/' + this.arrival.request_id, new_arrival)
        .subscribe(
          res => {
          },
          err => {
            const error = err;
            const errorMessage = this.apiService.getErrorMessage(err);
            this.showError.emit(error);
          });

      this.arrival.arrival_date = moment(new_arrival.arrival_date).format(this.settings.VIEW_DATE_FORMAT);
      this.arrival.request_state = 'OPEN';

      this.removeArrival.emit(this.arrival);
    } else {
      this.form_valid = false;
    }
  }

  public sendRemoveErrorRequest() {
    const request = {
      'is_removed_by_user': true,
      'request_id': this.arrival.request_id
    };

    this.apiService
      .doPutRequest(API_URI_HIDE_ERROR, request)
      .subscribe(
        () => {
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        });
    this.removeArrival.emit(this.arrival);
  }

  public enableEditing() {
    if (this.editMode) {
      this.cancelEditing();
    }
    this.editMode = true;
    this.temp_arrival = _.clone(this.arrival);
  }

  public cancelEditing() {
    this.editMode = false;
    this.arrival = this.temp_arrival;
  }

  public stringAsViewDateTime(date) {
    return moment(date).format(this.settings.VIEW_DATETIME_FORMAT);
  }
}
