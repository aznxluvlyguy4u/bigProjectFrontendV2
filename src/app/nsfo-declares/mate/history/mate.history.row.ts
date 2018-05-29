import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl, FormGroup, FormBuilder} from '@angular/forms';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_CHANGE_MATE} from '../../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {MateChangeResponse} from '../../../shared/models/nsfo-declare.model';

@Component({
  selector: 'app-mate-history-row',
  templateUrl: './mate.history.row.html',

})

export class MateHistoryRowComponent {
  @Input('mate-object') mate: MateChangeResponse;
  @Input('mate-index') mate_index: any;
  @Output() revokeMate = new EventEmitter();
  @Output() showError = new EventEmitter();
  private editMode = false;
  private temp_mate: MateChangeResponse;
  private isSending = false;
  private form: FormGroup;

  constructor(private fb: FormBuilder,
              private nsfo: NSFOService,
              private settings: SettingsService) {
    this.form = fb.group({
      start_date: new FormControl(''),
      end_date: new FormControl(''),
      pmsg: new FormControl(''),
      ki: new FormControl(''),
    });
  }

  private sendChangeRequest() {
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

            this.mate.request_state = 'OPEN';
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
    this.revokeMate.emit(this.mate);
  }

  private enableEditing() {
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

  private cancelEditing() {
    this.editMode = false;
    this.mate = this.temp_mate;
  }

  private stringAsViewDate(date) {
    return moment(date).format(this.settings.getViewDateFormat());
  }

  private stringAsViewDateTime(date) {
    return moment(date).format(this.settings.getViewDateTimeFormat());
  }
}
