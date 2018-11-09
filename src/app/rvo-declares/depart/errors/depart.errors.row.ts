import * as moment from 'moment';
import * as _ from 'lodash';

import {AfterViewChecked, Component, EventEmitter, Input, Output} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {DEPART_REASON_OF_DEPART, DepartErrorResponse} from '../depart.model';
import {Constants} from '../../../shared/variables/constants';
import {Settings} from '../../../shared/variables/settings';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {DateValidator, UBNValidator} from '../../../shared/validation/nsfo-validation';
import {API_URI_CHANGE_DEPART, API_URI_HIDE_ERROR} from '../../../shared/services/nsfo-api/nsfo.settings';

@Component({
  selector: '[app-depart-error-row]',
  templateUrl: './depart.errors.row.html',

})

export class DepartErrorRowComponent implements AfterViewChecked {
  @Input() depart: DepartErrorResponse;
  @Input() depart_index: number;
  @Output() removeDepart = new EventEmitter();
  public editMode = false;
  public popupIsLoaded = false;
  public temp_depart: DepartErrorResponse;
  public form_valid = true;
  public options_reason_of_depart = DEPART_REASON_OF_DEPART;
  public view_date_format;
  public view_datetime_format;
  public model_datetime_format;
  public form: FormGroup;

  constructor(private fb: FormBuilder,
              private apiService: NSFOService,
              public constants: Constants,
              private settings: Settings) {
    this.view_date_format = settings.VIEW_DATE_FORMAT;
    this.view_datetime_format = settings.VIEW_DATETIME_FORMAT;
    this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;

    this.form = new FormGroup({
      depart_date: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat])),
      ubn_new_owner: new FormControl('', UBNValidator.validateUbn),
      reason_of_depart: new FormControl(''),
      certificate_number: new FormControl(''),
    });
  }

  ngAfterViewChecked() {
    if (!this.popupIsLoaded) {
      // $('#error-' + this.depart_index).foundation();
      this.popupIsLoaded = true;
    }
  }

  public sendChangeRequest() {
    if (this.form.valid) {
      this.form_valid = true;
      this.editMode = false;

      const new_depart: DepartErrorResponse = new DepartErrorResponse();
      new_depart.depart_date = this.form.get('depart_date').value;
      new_depart.reason_of_depart = this.form.get('reason_of_depart').value;
      new_depart.ubn_new_owner = this.depart.ubn_new_owner;
      new_depart.is_export_animal = this.depart.is_export_animal;
      new_depart.animal.uln_country_code = this.depart.uln_country_code;
      new_depart.animal.uln_number = this.depart.uln_number;
      new_depart.animal.pedigree_country_code = this.depart.pedigree_country_code;
      new_depart.animal.pedigree_number = this.depart.pedigree_number;

      this.apiService.doPutRequest(API_URI_CHANGE_DEPART + '/' + this.depart.request_id, new_depart)
        .subscribe(() => {
        });

      this.depart.depart_date = moment(new_depart.depart_date).format(this.settings.VIEW_DATE_FORMAT);
      this.depart.request_state = 'OPEN';

      this.removeDepart.emit(this.depart);
    } else {
      this.form_valid = false;
    }
  }

  public sendRemoveErrorRequest() {
    const request = {
      'is_removed_by_user': true,
      'request_id': this.depart.request_id
    };

    this.apiService
      .doPutRequest(API_URI_HIDE_ERROR, request)
      .subscribe(() => {
      });
    this.removeDepart.emit(this.depart);
  }

  public enableEditing() {
    if (this.editMode) {
      this.cancelEditing();
    }
    this.editMode = true;
    this.temp_depart = _.clone(this.depart);
  }

  public cancelEditing() {
    this.editMode = false;
    this.depart = this.temp_depart;
  }

  public stringAsViewDateTime(date) {
    return moment(date).format(this.settings.VIEW_DATETIME_FORMAT);
  }
}
