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
  public editMode = false;
  public isSending = false;
  public weightTemp: WeightChangeResponse;
  public form: FormGroup;

  constructor(private fb: FormBuilder,
              private nsfo: NSFOService,
              private settings: SettingsService) {
    this.form = fb.group({
      weight: new FormControl(''),
      measurement_date: new FormControl('')
    });
  }

  public sendChangeRequest() {
    if (this.form.valid) {
      this.isSending = true;
      const newWeight = _.cloneDeep(this.weight);
      newWeight.measurement_date = this.form.get('measurement_date').value;

      this.nsfo
        .doPutRequest(API_URI_CHANGE_WEIGHT + '/' + newWeight.message_id, newWeight)
        .subscribe(
          res => {
            this.weight.measurement_date = moment(newWeight.measurement_date).format(this.settings.getViewDateFormat());
            this.editMode = false;
            this.isSending = false;
          },
          err => {
            const error = err.error;
            this.showError.emit(error);
            this.cancelEditing();
            this.isSending = false;
          }
        );
    }
  }

  public sendRevokeRequest() {
    this.revokeWeight.emit(this.weight);
  }

  public enableEditing() {
    if (this.editMode) {
      this.cancelEditing();
    }
    this.editMode = true;
    this.weightTemp = _.cloneDeep(this.weight);
  }

  public cancelEditing() {
    this.editMode = false;
    this.weight = this.weightTemp;
  }

  public stringAsViewDate(date) {
    return moment(date).format(this.settings.getViewDateFormat());
  }

  public stringAsViewDateTime(date) {
    return moment(date).format(this.settings.getViewDateTimeFormat());
  }
}


