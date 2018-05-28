import moment = require('moment');
import * as _ from 'lodash';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl, FormGroup, FormBuilder} from '@angular/forms';

import {Datepicker} from '../../../shared/components/datepicker/datepicker.component';
import {LOSS_REASON_OF_LOSS, LossChangeResponse} from '../loss.model';
import {Settings} from '../../../shared/variables/settings';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Constants} from '../../../shared/variables/constants';
import {API_URI_CHANGE_LOSS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {RevokeButtonComponent} from '../../../shared/components/revokebutton/revoke-button.component';
import {HistoryErrorInfoComponent} from '../../../shared/components/historyerrorinfo/history-error-info.component';

declare var $;

@Component({
  selector: 'app-loss-history-row',
  directives: [Datepicker, RevokeButtonComponent, HistoryErrorInfoComponent],
  templateUrl: './loss.history.row.html',

})

export class LossHistoryRowComponent {
  @Input() loss: LossChangeResponse;
  @Input() loss_index: number;
  @Output() revokeLoss = new EventEmitter();
  private editMode = false;
  private temp_loss: LossChangeResponse;
  private form_valid = true;
  private options_reason_of_loss = LOSS_REASON_OF_LOSS;
  private view_datetime_format;
  private view_date_format;
  private model_datetime_format;
  private form: FormGroup;

  constructor(private fb: FormBuilder,
              private apiService: NSFOService,
              private constants: Constants,
              private settings: Settings) {
    this.view_datetime_format = settings.VIEW_DATETIME_FORMAT;
    this.view_date_format = settings.VIEW_DATE_FORMAT;
    this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;

    this.form = fb.group({
      date_of_death: new FormControl(''),
      reason_death: new FormControl('')
    });
  }

  private sendChangeRequest() {
    if (this.form.valid) {
      this.form_valid = true;
      this.editMode = false;

      const new_loss: LossChangeResponse = new LossChangeResponse();
      new_loss.date_of_death = this.form.get('date_of_death').value;
      new_loss.reason_of_loss = this.form.get('reason_death').value;
      new_loss.animal.uln_country_code = this.loss.uln_country_code;
      new_loss.animal.uln_number = this.loss.uln_number;

      this.apiService
        .doPutRequest(API_URI_CHANGE_LOSS + '/' + this.loss.request_id, new_loss)
        .subscribe(() => {
        });

      this.loss.date_of_death = moment(new_loss.date_of_death).format(this.settings.VIEW_DATE_FORMAT);

      this.loss.request_state = 'OPEN';
    } else {
      this.form_valid = false;
    }
  }

  private sendRevokeRequest() {
    this.revokeLoss.emit(this.loss);
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

