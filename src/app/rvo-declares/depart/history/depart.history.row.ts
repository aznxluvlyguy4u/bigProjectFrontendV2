import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';

import {DEPART_REASON_OF_DEPART, DepartChangeResponse} from '../depart.model';
import {Datepicker} from '../../../shared/components/datepicker/datepicker.component';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Constants} from '../../../shared/variables/constants';
import {Settings} from '../../../shared/variables/settings';
import {API_URI_CHANGE_DEPART} from '../../../shared/services/nsfo-api/nsfo.settings';
import {DateValidator, UBNValidator} from '../../../shared/validation/nsfo-validation';

declare var $;

@Component({
  selector: 'app-depart-history-row',
  templateUrl: './depart.history.row.html',
})

export class DepartHistoryRowComponent {
  @Input() depart: DepartChangeResponse;
  @Input() depart_index: number;
  @Output() revokeDepart = new EventEmitter();
  private editMode = false;
  private temp_depart: DepartChangeResponse;
  private form_valid = true;
  private options_reason_of_depart = DEPART_REASON_OF_DEPART;
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
      depart_date: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat])),
      ubn_new_owner: new FormControl('', UBNValidator.validateWithSevenTest),
      reason_of_depart: new FormControl(''),
      certificate_number: new FormControl('')
    });
  }

  private sendChangeRequest() {
    if (this.form.valid) {
      this.form_valid = true;
      this.editMode = false;

      const new_depart: DepartChangeResponse = new DepartChangeResponse();
      new_depart.depart_date = this.form.get('depart_date').value;
      new_depart.reason_of_depart = this.form.get('reason_of_depart').value;
      new_depart.is_export_animal = this.depart.is_export_animal;
      new_depart.animal.uln_country_code = this.depart.uln_country_code;
      new_depart.animal.uln_number = this.depart.uln_number;
      new_depart.animal.pedigree_country_code = this.depart.pedigree_country_code;
      new_depart.animal.pedigree_number = this.depart.pedigree_number;

      this.apiService
        .doPutRequest(API_URI_CHANGE_DEPART + '/' + this.depart.request_id, new_depart)
        .subscribe(() => {
        });

      this.depart.depart_date = moment(new_depart.depart_date).format(this.settings.VIEW_DATE_FORMAT);

      this.depart.request_state = 'OPEN';
    } else {
      this.form_valid = false;
    }
  }

  private sendRevokeRequest() {
    this.revokeDepart.emit(this.depart);
  }

  private enableEditing() {
    if (this.editMode) {
      this.cancelEditing();
    }
    this.editMode = true;
    this.temp_depart = _.clone(this.depart);
  }

  private cancelEditing() {
    this.editMode = false;
    this.depart = this.temp_depart;
  }

  private stringAsViewDateTime(date) {
    return moment(date).format(this.settings.VIEW_DATETIME_FORMAT);
  }
}
