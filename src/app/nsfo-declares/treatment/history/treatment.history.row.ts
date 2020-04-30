import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, FormBuilder} from '@angular/forms';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {TreatmentTemplate} from '../../../shared/models/treatment-template.model';
import {API_URI_GET_TREATMENT_TEMPLATES} from '../../../shared/services/nsfo-api/nsfo.settings';

@Component({
  selector: '[app-treatment-history-row]',
  templateUrl: './treatment.history.row.html'
})

export class TreatmentHistoryRowComponent implements OnInit {
  @Input() treatment: TreatmentTemplate;
  @Input() treatmentTemplatesToSelect = <TreatmentTemplate[]>[];
  // @Output() revokeTreatment = new EventEmitter();
  @Output() showError = new EventEmitter();
  public editMode = false;
  public temp_treatment: TreatmentTemplate;
  public isSending = false;
  public form: FormGroup;
  public selectedTreatmentTemplate: TreatmentTemplate;

  constructor(private fb: FormBuilder,
              private nsfo: NSFOService,
              private settings: SettingsService) {
    this.form = new FormGroup({
      start_date: new FormControl(''),
      end_date: new FormControl(''),
      description: new FormControl('')
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      const selectedTreatmentIndex = _.findIndex(this.treatmentTemplatesToSelect, {description: this.treatment.description});
      this.selectedTreatmentTemplate = this.treatmentTemplatesToSelect[selectedTreatmentIndex];
    }, 3000);
  }

  public sendChangeRequest() {
    if (this.form.valid) {
      this.isSending = true;

      const request = {
        start_date: this.form.get('start_date').value,
        end_date: this.form.get('end_date').value,
        description: this.selectedTreatmentTemplate.description
      };

      this.nsfo
        .doPutRequest(API_URI_GET_TREATMENT_TEMPLATES + '/' + this.treatment.id, request)
        .subscribe(
          res => {
            this.treatment.start_date = moment(request.start_date).format(this.settings.getViewDateFormat());
            this.treatment.end_date = moment(request.end_date).format(this.settings.getViewDateFormat());
            this.treatment.description = request.description;

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

  // public sendRevokeRequest() {
  //   this.revokeMate.emit(this.treatment);
  // }

  public enableEditing() {
    if (this.editMode) {
      this.cancelEditing();
    }
    this.editMode = true;
    this.temp_treatment = _.cloneDeep(this.treatment);

    // if (this.treatment.pmsg === 'YES') {
    //   this.form.get('pmsg').setValue('YES');
    // } else {
    //   this.form.get('pmsg').setValue('NO');
    // }
    //
    // if (this.mate.ki === 'YES') {
    //   this.form.get('ki').setValue('YES');
    // } else {
    //   this.form.get('ki').setValue('NO');
    // }
  }

  public cancelEditing() {
    this.editMode = false;
    this.treatment = this.temp_treatment;
  }

  public stringAsViewDate(date) {
    return moment(date).format(this.settings.getViewDateFormat());
  }

  public stringAsViewDateTime(date) {
    return moment(date).format(this.settings.getViewDateTimeFormat());
  }
}
