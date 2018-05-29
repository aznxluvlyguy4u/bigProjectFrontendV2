import * as moment from 'moment';
import * as _ from 'lodash';
import {AfterViewChecked, Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';

import {EartagErrorResponse} from '../eartag.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {UBNValidator} from '../../../shared/validation/nsfo-validation';
import {API_URI_GET_COUNTRY_CODES, API_URI_HIDE_ERROR} from '../../../shared/services/nsfo-api/nsfo.settings';

declare var $;

@Component({
  selector: 'app-eartag-error-row',
  templateUrl: './eartag.errors.row.html',

})

export class EartagErrorRowComponent implements OnInit, AfterViewChecked {
  @Input() eartag: EartagErrorResponse;
  @Input() eartag_index: number;
  @Output() removeEartag = new EventEmitter();
  @Output() showError = new EventEmitter();
  private editMode = false;
  private popupIsLoaded = false;
  private temp_eartag: EartagErrorResponse;
  private country_code_list = [];
  private form_valid = true;
  private uid_type_changed;
  private form: FormGroup;

  constructor(private fb: FormBuilder,
              private apiService: NSFOService,
              private settings: SettingsService) {
    this.form = fb.group({
      ubn_new_owner: new FormControl('', UBNValidator.validateWithSevenTest)
    });
  }

  ngOnInit() {
    this.getCountryCodeList();
  }

  ngAfterViewChecked() {
    if (!this.popupIsLoaded) {
      $('#error-' + this.eartag_index).foundation();
      this.popupIsLoaded = true;
    }
  }

  private getCountryCodeList() {
    this.apiService
      .doGetRequest(API_URI_GET_COUNTRY_CODES)
      .subscribe(
        res => {
          this.country_code_list = _.sortBy(res.result, ['code']);
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  private sendChangeRequest() {
    if (this.form.valid) {
      // this.form_valid = true;
      // this.editMode = false;
      //
      // let new_arrival: ArrivalErrorResponse;
      // new_arrival = _.clone(this.arrival);
      //
      // new_arrival.arrival_date = this.form.get('arrival_date'].value;
      //
      // this.apiService
      //     .doPutRequest(API_URI_CHANGE_ARRIVAL + '/' + this.arrival.request_id, new_arrival)
      //     .subscribe(
      //         res => {},
      //         err => {
      //             let error = err.json();
      //             this.showError.emit(error);
      //         });
      //
      // this.arrival.arrival_date = moment(new_arrival.arrival_date).format(this.settings.VIEW_DATE_FORMAT);
      // this.arrival.request_state = 'OPEN';
      //
      // this.removeArrival.emit(this.arrival);
    } else {
      this.form_valid = false;
    }
  }

  private sendRemoveErrorRequest() {
    const request = {
      'is_removed_by_user': true,
      'request_id': this.eartag.request_id
    };

    this.apiService
      .doPutRequest(API_URI_HIDE_ERROR, request)
      .subscribe(() => {
      });
    this.removeEartag.emit(this.eartag);
  }

  private enableEditing() {
    if (this.editMode) {
      this.cancelEditing();
    }
    this.editMode = true;
    this.temp_eartag = _.clone(this.eartag);
  }

  private cancelEditing() {
    this.editMode = false;
    this.eartag = this.temp_eartag;
  }

  private stringAsViewDateTime(date) {
    return moment(date).format(this.settings.getViewDateTimeFormat());
  }
}
