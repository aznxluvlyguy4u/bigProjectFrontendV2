import * as moment from 'moment';
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';

import {ArrivalChangeResponse} from '../arrival.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Settings} from '../../../shared/variables/settings';
import {API_URI_CHANGE_ARRIVAL, API_URI_GET_COUNTRY_CODES} from '../../../shared/services/nsfo-api/nsfo.settings';
import {DateValidator, UBNValidator} from '../../../shared/validation/nsfo-validation';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

import { sortBy, clone } from 'lodash';

declare var $;

@Component({
  selector: '[app-arrival-history-row]',
  templateUrl: './arrival.history.row.html',
})

export class ArrivalHistoryRowComponent implements OnInit {
  @Input() arrival: ArrivalChangeResponse;
  @Input() arrival_index: number;
  @Output() revokeArrival = new EventEmitter();
  @Output() showError = new EventEmitter();
  public editMode = false;
  public temp_arrival: ArrivalChangeResponse;
  public country_code_list = [];
  public form_valid = true;
  public uid_type_changed;
  public view_datetime_format;
  public view_date_format;
  public model_datetime_format;
  public form: FormGroup = new FormGroup({
      arrival_date: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat])),
      country_origin: new FormControl(''),
      ubn_previous_owner: new FormControl('', UBNValidator.validateWithSevenTest),
      certificate_number: new FormControl('')
  });

  constructor(private fb: FormBuilder,
              private apiService: NSFOService,
              private settings: Settings) {
    this.view_datetime_format = settings.VIEW_DATETIME_FORMAT;
    this.view_date_format = settings.VIEW_DATE_FORMAT;
    this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;
  }

  ngOnInit() {
    this.getCountryCodeList();
  }

  private getCountryCodeList() {
    this.apiService
      .doGetRequest(API_URI_GET_COUNTRY_CODES)
      .subscribe(
          (res: JsonResponseModel) => this.country_code_list = sortBy(res.result, ['code'])
      );
  }

  private sendChangeRequest() {
    if (this.form.valid) {
      this.form_valid = true;
      this.editMode = false;

      let new_arrival: ArrivalChangeResponse;
      new_arrival = clone(this.arrival);

      new_arrival.arrival_date = this.form.get('arrival_date').value;

      this.apiService
        .doPutRequest(API_URI_CHANGE_ARRIVAL + '/' + this.arrival.request_id, new_arrival)
        .subscribe(
          res => {
          },
          err => {
            const error = err;
            this.showError.emit(error);
          }
        );

      this.arrival.arrival_date = moment(new_arrival.arrival_date).format(this.settings.VIEW_DATE_FORMAT);
      this.arrival.request_state = 'OPEN';
    } else {
      this.form_valid = false;
    }
  }

  private sendRevokeRequest() {
    this.revokeArrival.emit(this.arrival);
  }

  private enableEditing() {
    if (this.editMode) {
      this.cancelEditing();
    }
    this.editMode = true;
    this.temp_arrival = clone(this.arrival);
  }

  private cancelEditing() {
    this.editMode = false;
    this.arrival = this.temp_arrival;
  }

  private stringAsViewDateTime(date) {
    return moment(date).format(this.settings.VIEW_DATETIME_FORMAT);
  }
}
