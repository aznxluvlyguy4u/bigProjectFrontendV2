import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl, FormGroup, FormBuilder} from '@angular/forms';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_CHANGE_MATE} from '../../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {MateChangeResponse} from '../../../shared/models/nsfo-declare.model';

@Component({
  selector: '[app-mate-history-row]',
  templateUrl: './mate.history.row.html',

})

export class MateHistoryRowComponent {
  @Input() mate: MateChangeResponse;
  @Input() mate_index: any;
  @Output() revokeMate = new EventEmitter();
  @Output() showError = new EventEmitter();
  public editMode = false;
  public temp_mate: MateChangeResponse;
  public isSending = false;
  public form: FormGroup;

  constructor(private fb: FormBuilder,
              private nsfo: NSFOService,
              private settings: SettingsService) {
    this.form = new FormGroup({
      start_date: new FormControl(''),
      end_date: new FormControl(''),
      pmsg: new FormControl(''),
      ki: new FormControl(''),
    });
  }

  public sendChangeRequest() {
    if (this.form.valid) {
      this.isSending = true;
      let newMate: MateChangeResponse = new MateChangeResponse();
      newMate = _.cloneDeep(this.mate);
      newMate.start_date = this.form.get('start_date').value;
      newMate.end_date = this.form.get('end_date').value;
      newMate.pmsg = this.form.get('pmsg').value === 'YES';
      newMate.ki = this.form.get('ki').value === 'YES';

      this.nsfo
        .doPutRequest(API_URI_CHANGE_MATE + '/' + newMate.message_id, newMate)
        .subscribe(
          res => {
            this.mate.start_date = moment(newMate.start_date).format(this.settings.getViewDateFormat());
            this.mate.end_date = moment(newMate.end_date).format(this.settings.getViewDateFormat());

            if (newMate.pmsg) {
              this.mate.pmsg = 'YES';
            } else {
              this.mate.pmsg = 'NO';
            }

            if (newMate.ki) {
              this.mate.ki = 'YES';
            } else {
              this.mate.ki = 'NO';
            }

            this.editMode = false;
            this.isSending = false;
          },
          err => {
            const error = err.error === undefined || err.error === null ? err : err.error;
            this.showError.emit(error);
            this.cancelEditing();
            this.isSending = false;
          }
        );
    }
  }

  public sendRevokeRequest() {
    this.revokeMate.emit(this.mate);
  }

  public enableEditing() {
    if (this.editMode) {
      this.cancelEditing();
    }
    this.editMode = true;
    this.temp_mate = _.cloneDeep(this.mate);

    if (this.mate.pmsg === 'YES') {
      this.form.get('pmsg').setValue('YES');
    } else {
      this.form.get('pmsg').setValue('NO');
    }

    if (this.mate.ki === 'YES') {
      this.form.get('ki').setValue('YES');
    } else {
      this.form.get('ki').setValue('NO');
    }
  }

  public cancelEditing() {
    this.editMode = false;
    this.mate = this.temp_mate;
  }

  public stringAsViewDate(date) {
    return moment(date).format(this.settings.getViewDateFormat());
  }

  public stringAsViewDateTime(date) {
    return moment(date).format(this.settings.getViewDateTimeFormat());
  }
}
