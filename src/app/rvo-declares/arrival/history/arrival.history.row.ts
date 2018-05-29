import * as moment from 'moment';
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';

import {ArrivalChangeResponse} from '../arrival.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Settings} from '../../../shared/variables/settings';
import {API_URI_CHANGE_ARRIVAL, API_URI_GET_COUNTRY_CODES} from '../../../shared/services/nsfo-api/nsfo.settings';
import {DateValidator, UBNValidator} from '../../../shared/validation/nsfo-validation';

declare var $;

@Component({
  selector: 'app-arrival-history-row',
  templateUrl: './arrival.history.row.html',

})

export class ArrivalHistoryRowComponent implements OnInit {
  @Input() arrival: ArrivalChangeResponse;
  @Input() arrival_index: number;
  @Output() revokeArrival = new EventEmitter();
  @Output() showError = new EventEmitter();
  private editMode = false;
  private temp_arrival: ArrivalChangeResponse;
  private country_code_list = [];
  private form_valid = true;
  private uid_type_changed;
  private view_datetime_format;
  private view_date_format;
  private model_datetime_format;
  private form: FormGroup;

  constructor(private fb: FormBuilder,
              private apiService: NSFOService,
              private settings: Settings) {
    this.view_datetime_format = settings.VIEW_DATETIME_FORMAT;
    this.view_date_format = settings.VIEW_DATE_FORMAT;
    this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;

    this.form = fb.group({
      arrival_date: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat])),
      country_origin: new FormControl(''),
      ubn_previous_owner: new FormControl('', UBNValidator.validateWithSevenTest),
      certificate_number: new FormControl('')
    });
  }

  ngOnInit() {
    this.getCountryCodeList();
  }

  private getCountryCodeList() {
    this.apiService
      .doGetRequest(API_URI_GET_COUNTRY_CODES)
      .subscribe(
        res => this.country_code_list = _.sortBy(res.result, ['code'])
      );
  }

  private sendChangeRequest() {
    if (this.form.valid) {
      this.form_valid = true;
      this.editMode = false;

      let new_arrival: ArrivalChangeResponse;
      new_arrival = _.clone(this.arrival);

      new_arrival.arrival_date = this.form.get('arrival_date').value;

      this.apiService
        .doPutRequest(API_URI_CHANGE_ARRIVAL + '/' + this.arrival.request_id, new_arrival)
        .subscribe(
          res => {
          },
          err => {
            const error = err.json();
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
    this.temp_arrival = _.clone(this.arrival);
  }

  private cancelEditing() {
    this.editMode = false;
    this.arrival = this.temp_arrival;
  }

  private stringAsViewDateTime(date) {
    return moment(date).format(this.settings.VIEW_DATETIME_FORMAT);
  }
}
