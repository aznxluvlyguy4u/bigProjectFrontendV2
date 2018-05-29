import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl, FormGroup, FormBuilder} from '@angular/forms';

import {EartagChangeResponse} from '../eartag.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {UBNValidator} from '../../../shared/validation/nsfo-validation';

declare var $;

@Component({
  selector: 'app-eartag-history-row',
  templateUrl: './eartag.history.row.html',

})

export class EartagHistoryRowComponent {
  @Input() eartag: EartagChangeResponse;
  @Input() eartag_index: number;
  @Output() revokeEartag = new EventEmitter();
  @Output() showError = new EventEmitter();
  private editMode = false;
  private temp_eartag: EartagChangeResponse;
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

  private sendRevokeRequest() {
    this.revokeEartag.emit(this.eartag);
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
