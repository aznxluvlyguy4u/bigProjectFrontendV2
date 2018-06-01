import * as moment from 'moment';
import * as _ from 'lodash';
import {AfterViewChecked, Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';

import {LOSS_REASON_OF_LOSS, LossErrorResponse} from '../loss.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Constants} from '../../../shared/variables/constants';
import {DateValidator} from '../../../shared/validation/nsfo-validation';
import {Settings} from '../../../shared/variables/settings';
import {API_URI_CHANGE_LOSS, API_URI_HIDE_ERROR} from '../../../shared/services/nsfo-api/nsfo.settings';

@Component({
  selector: '[app-loss-error-row]',
  templateUrl: './loss.errors.row.html',
})

export class LossErrorRowComponent implements AfterViewChecked {
  @Input() loss: LossErrorResponse;
  @Input() loss_index: number;
  @Output() removeLoss = new EventEmitter();
  private editMode = false;
  private popupIsLoaded = false;
  private temp_loss: LossErrorResponse;
  private form_valid = true;
  private options_reason_of_loss = LOSS_REASON_OF_LOSS;
  private view_date_format;
  private view_datetime_format;
  private model_datetime_format;
  private form: FormGroup;

  constructor(private fb: FormBuilder,
              private apiService: NSFOService,
              private constants: Constants,
              private settings: Settings) {
    this.view_date_format = settings.VIEW_DATE_FORMAT;
    this.view_datetime_format = settings.VIEW_DATETIME_FORMAT;
    this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;

    this.form = new FormGroup({
      date_of_death: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat])),
      reason_death: new FormControl('')
    });
  }

  ngAfterViewChecked() {
    if (!this.popupIsLoaded) {
      // $('#error-' + this.loss_index).foundation();
      this.popupIsLoaded = true;
    }
  }

  private sendChangeRequest() {
    if (this.form.valid) {
      this.form_valid = true;
      this.editMode = false;

      const new_loss: LossErrorResponse = new LossErrorResponse();
      new_loss.date_of_death = this.form.get('date_of_death').value;
      new_loss.reason_of_loss = this.form.get('reason_death').value;
      new_loss.animal.uln_country_code = this.loss.uln_country_code;
      new_loss.animal.uln_number = this.loss.uln_number;

      this.apiService.doPutRequest(API_URI_CHANGE_LOSS + '/' + this.loss.request_id, new_loss)
        .subscribe(() => {
        });

      this.loss.date_of_death = moment(new_loss.date_of_death).format(this.settings.VIEW_DATE_FORMAT);

      this.loss.request_state = 'open';

      this.removeLoss.emit(this.loss);
    } else {
      this.form_valid = false;
    }
  }

  private sendRemoveErrorRequest() {
    const request = {
      'is_removed_by_user': true,
      'request_id': this.loss.request_id
    };

    this.apiService
      .doPutRequest(API_URI_HIDE_ERROR, request)
      .subscribe(() => {
      });
    this.removeLoss.emit(this.loss);
  }

  private enableEditing() {
    if (this.editMode) {
      this.cancelEditing();
    }
    this.editMode = true;
    this.temp_loss = _.clone(this.loss);
  }

  private cancelEditing() {
    this.editMode = false;
    this.loss = this.temp_loss;
  }

  private stringAsViewDateTime(date) {
    return moment(date).format(this.settings.VIEW_DATETIME_FORMAT);
  }
}
