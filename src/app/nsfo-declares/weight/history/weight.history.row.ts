import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {API_URI_CHANGE_WEIGHT} from '../../../shared/services/nsfo-api/nsfo.settings';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {WeightChangeResponse} from '../../../shared/models/nsfo-declare.model';

@Component({
  selector: '[app-weight-history-row]',
  templateUrl: './weight.history.row.html',
})

export class WeightHistoryRowComponent {
  @Input() weight: WeightChangeResponse;
  @Input() weight_index: any;
  @Output() revokeWeight = new EventEmitter();
  @Output() showError = new EventEmitter();
  private editMode = false;
  private isSending = false;
  private weightTemp: WeightChangeResponse;
  private form: FormGroup;

  constructor(private fb: FormBuilder,
              private nsfo: NSFOService,
              private settings: SettingsService) {
    this.form = fb.group({
      weight: new FormControl(''),
      measurement_date: new FormControl('')
    });
  }

  private sendChangeRequest() {
    if (this.form.valid) {
      this.isSending = true;
      const newWeight = _.cloneDeep(this.weight);
      newWeight.measurement_date = this.form.get('measurement_date').value;
      newWeight.weight = this.form.get('weight').value;

      this.nsfo
        .doPutRequest(API_URI_CHANGE_WEIGHT + '/' + newWeight.message_id, newWeight)
        .subscribe(
          res => {
            this.weight.measurement_date = moment(newWeight.measurement_date).format(this.settings.getViewDateFormat());
            this.weight.request_state = 'OPEN';
            this.editMode = false;
            this.isSending = false;
          },
          err => {
            const error = err;
            this.showError.emit(error);
            this.editMode = false;
            this.isSending = false;
          }
        );
    }
  }

  private sendRevokeRequest() {
    this.revokeWeight.emit(this.weight);
  }

  private enableEditing() {
    if (this.editMode) {
      this.cancelEditing();
    }
    this.editMode = true;
    this.weightTemp = _.cloneDeep(this.weight);
  }

  private cancelEditing() {
    this.editMode = false;
    this.weight = this.weightTemp;
  }

  private stringAsViewDate(date) {
    return moment(date).format(this.settings.getViewDateFormat());
  }

  private stringAsViewDateTime(date) {
    return moment(date).format(this.settings.getViewDateTimeFormat());
  }
}


