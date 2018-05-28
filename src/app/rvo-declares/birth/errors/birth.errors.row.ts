import * as moment from 'moment';
import * as _ from 'lodash';
import {AfterViewChecked, Component, EventEmitter, Input, Output} from '@angular/core';
import {FormGroup, FormBuilder, Validators, FormControl} from '@angular/forms';

import {Datepicker} from '../../../shared/components/datepicker/datepicker.component';
import {BirthErrorResponse} from '../birth.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Constants} from '../../../shared/variables/constants';
import {Settings} from '../../../shared/variables/settings';
import {API_URI_CHANGE_BIRTH, API_URI_HIDE_ERROR} from '../../../shared/services/nsfo-api/nsfo.settings';
import {DateValidator} from '../../../shared/validation/nsfo-validation';

declare var $;

@Component({
  selector: 'app-birth-error-row',
  directives: [Datepicker],
  templateUrl: './birth.errors.row.html',

})

export class BirthErrorRowComponent implements AfterViewChecked {
  @Input() birth: BirthErrorResponse;
  @Input() birth_index: number;
  @Output() removeBirth = new EventEmitter();
  @Output() revokeLitter = new EventEmitter();
  private editMode = false;
  private popupIsLoaded = false;
  private temp_birth: BirthErrorResponse;
  private form_valid = true;
  private form: FormGroup;
  private view_date_format: string;
  private view_datetime_format;
  private model_datetime_format;

  constructor(private fb: FormBuilder,
              private apiService: NSFOService,
              private constants: Constants,
              private settings: Settings) {
    this.view_datetime_format = this.settings.VIEW_DATE_FORMAT;
    this.model_datetime_format = this.settings.MODEL_DATETIME_FORMAT;

    this.form = fb.group({
      date_of_birth: new FormControl('', Validators.compose([
        Validators.required,
        DateValidator.validateDateFormat,
        DateValidator.validateDateIsNotInTheFuture
      ])),
      gender: new FormControl('')
    });
  }

  ngAfterViewChecked() {
    if (!this.popupIsLoaded) {
      $('#error-' + this.birth_index).foundation();
      this.popupIsLoaded = true;
    }
  }

  private sendChangeRequest() {
    if (this.form.valid) {
      this.form_valid = true;
      this.editMode = false;

      const new_birth: BirthErrorResponse = _.clone(this.birth);

      new_birth.date_of_birth = this.form.get('date_of_birth').value;
      this.apiService
        .doPutRequest(API_URI_CHANGE_BIRTH + '/' + this.birth.request_id, new_birth)
        .subscribe(res => {
        });

      // this.birth.date_of_birth = moment(new_birth.date_of_birth).format(this.settings.VIEW_DATE_FORMAT);
      // this.birth.request_state = 'OPEN';

      // this.removeBirth.emit(this.birth);
    } else {
      // this.form_valid = false;
    }
  }

  private sendRevokeRequest() {
    this.revokeLitter.emit(this.birth);
  }

  private sendRemoveErrorRequest() {
    const request = {
      'is_removed_by_user': true,
      'request_id': this.birth.request_id
    };

    this.apiService
      .doPutRequest(API_URI_HIDE_ERROR, request)
      .subscribe(() => {
      });

    this.removeBirth.emit(this.birth);
  }

  private enableEditing() {
    if (this.editMode) {
      this.cancelEditing();
    }
    this.editMode = true;
    this.temp_birth = _.clone(this.birth);
  }

  private cancelEditing() {
    this.editMode = false;
    this.birth = this.temp_birth;
  }

  private stringAsViewDateTime(date) {
    return moment(date).format(this.settings.VIEW_DATETIME_FORMAT);
  }
}
