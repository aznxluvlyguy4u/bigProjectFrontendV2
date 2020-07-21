import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {FormControl, FormGroup, FormBuilder} from '@angular/forms';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {TreatmentTemplate} from '../../../shared/models/treatment-template.model';
import {API_URI_GET_TREATMENT_TEMPLATES} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Treatment} from '../../../shared/models/treatment-model';

@Component({
  selector: '[app-treatment-history-row]',
  templateUrl: './treatment.history.row.html'
})

export class TreatmentHistoryRowComponent implements OnInit {
  @Input() treatment: Treatment;
  @Input() treatmentTemplatesToSelect = <TreatmentTemplate[]>[];
  @Input() displayTreatmentLocationIndividualType: boolean;
  @Input() qFeverDescriptions: Array<string>;

  @Output() showError = new EventEmitter();
  @Output() revokeTreatment = new EventEmitter();
  @Output() openMedicationModal = new EventEmitter();
  @Output() openAnimalModal = new EventEmitter();

  public editMode = false;
  public temp_treatment: Treatment;
  public isSending = false;
  public form: FormGroup;
  public selectedTreatmentTemplate: TreatmentTemplate;

  constructor(private fb: FormBuilder,
              private nsfo: NSFOService,
              private settings: SettingsService) {
    this.form = new FormGroup({
      start_date: new FormControl(''),
      end_date: new FormControl('')
    });
  }

  ngOnInit(): void {
    setTimeout(() => {
      const selectedTreatmentIndex = _.findIndex(this.treatmentTemplatesToSelect, {description: this.treatment.description});
      this.selectedTreatmentTemplate = this.treatmentTemplatesToSelect[selectedTreatmentIndex];
    }, 3000);
  }

  public openMedicineModal() {
    this.openMedicationModal.emit();
  }

  public openAnimalsModal() {
    this.openAnimalModal.emit();
  }

  public sendChangeRequest() {
    if (this.form.valid) {
      this.isSending = true;

      const request = {
        start_date: this.form.get('start_date').value,
        end_date: this.form.get('end_date').value
      };

      this.nsfo
        .doPutRequest(API_URI_GET_TREATMENT_TEMPLATES + '/' + this.treatment.treatment_id, request)
        .subscribe(
          () => {
            this.treatment.start_date = moment(request.start_date).format(this.settings.getViewDateFormat());
            this.treatment.end_date = moment(request.end_date).format(this.settings.getViewDateFormat());

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

  public hasMedications(treatment: Treatment): boolean {
    return treatment && treatment.medications && treatment.medications.length > 0;
  }

  public sendRevokeRequest() {
    this.revokeTreatment.emit(this.treatment);
  }

  public enableEditing() {
    if (this.editMode) {
      this.cancelEditing();
    }
    this.editMode = true;
    this.temp_treatment = _.cloneDeep(this.treatment);
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
