import moment = require('moment');
import * as _ from 'lodash';
import {TranslatePipe} from '@ngx-translate/core';
import {AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {FormGroup, FormBuilder, FormControl} from '@angular/forms';

import {SettingsService} from '../../../shared/services/settings/settings.service';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_MEASUREMENTS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Datepicker} from '../../../shared/components/datepicker/datepicker.component';
import {ExteriorMeasurementsValidator} from '../../../shared/validation/nsfo-validation';
import {Exterior} from '../../../shared/models/measurement.model';
import {User} from '../../../shared/models/person.model';


@Component({
  selector: 'app-exterior-component',
  directives: [Datepicker],
  templateUrl: './exterior.component.html',
  
})

export class ExteriorComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() exteriors: Exterior[] = [];
  @Input() uln: string;
  @Output() getAnimalDetails = new EventEmitter();

  private inspectors: User[] = [];

  private showExteriorModal = false;
  private exteriorForm: FormGroup;
  private isValidExteriorForm = true;
  private isRequestingExterior = false;
  private hasServerError = false;

  private isExteriorEditMode = false;
  private kinds: string[] = [];
  private selectedExterior: Exterior = new Exterior();
  private isAdmin = false;
  private tempExterior: Exterior = new Exterior();
  private displayExteriorModal = 'none';
  // private selectedExteriorDate = '';
  private selectedDate: string;
  private invalidMeasurementDate = false;

  private initDate: string;

  private showConfirmDeleteModal = false;

  constructor(private apiService: NSFOService,
              private settings: SettingsService,
              private fb: FormBuilder) {
    this.isAdmin = settings.isAdmin();
    this.exteriorForm = fb.group({
      measurement_date: new FormControl(''),
      kind: new FormControl(''),
      inspector: new FormControl(''),
      skull: new FormControl(0, ExteriorMeasurementsValidator.validateMeasurementValue),
      progress: new FormControl(0, ExteriorMeasurementsValidator.validateMeasurementValue),
      muscularity: new FormControl(0, ExteriorMeasurementsValidator.validateMeasurementValue),
      proportion: new FormControl(0, ExteriorMeasurementsValidator.validateMeasurementValue),
      exterior_type: new FormControl(0, ExteriorMeasurementsValidator.validateMeasurementValue),
      leg_work: new FormControl(0, ExteriorMeasurementsValidator.validateMeasurementValue),
      fur: new FormControl(0, ExteriorMeasurementsValidator.validateMeasurementValue),
      general_appearance: new FormControl(0, ExteriorMeasurementsValidator.validateMeasurementValue),
      height: new FormControl(0, ExteriorMeasurementsValidator.validateMeasurementValueBetween0And99),
      breast_depth: new FormControl(0, ExteriorMeasurementsValidator.validateMeasurementValueBetween0And99),
      torso_length: new FormControl(0, ExteriorMeasurementsValidator.validateMeasurementValueBetween0And99),
      markings: new FormControl(0, ExteriorMeasurementsValidator.validateMeasurementValue)
    });
  }

  ngOnInit() {
    if (this.exteriors.length > 0) {
      this.selectedExterior = this.exteriors[0];
      this.initDate = this.stringAsViewDate(this.selectedExterior.measurement_date);
    }

    this.exteriorForm.valueChanges.subscribe(
      () => {
        this.invalidMeasurementDate = this.exteriorMeasurementDateExists(this.exteriorForm.get('measurement_date').value);
      }
    );
  }

  ngAfterViewInit() {
    this.getInspectors();
  }

  ngOnChanges() {

  }

  private getExteriorKinds() {
    this.apiService
      .doGetRequest(API_URI_MEASUREMENTS + '/' + this.uln + '/exteriors/kinds')
      .subscribe(
        res => {
          this.kinds = res.result;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  private getExteriorKindsForEdit(measurementDate: string) {
    this.apiService
      .doGetRequest(API_URI_MEASUREMENTS + '/' + this.uln + '/exteriors/kinds/' + measurementDate)
      .subscribe(
        res => {
          this.kinds = res.result;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  private getInspectors() {
    this.apiService
      .doGetRequest(API_URI_MEASUREMENTS + '/' + this.uln + '/exteriors/inspectors')
      .subscribe(
        res => {
          this.inspectors = res.result;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  private doPostExteriorRequest() {
    this.isValidExteriorForm = true;
    this.isRequestingExterior = true;
    this.hasServerError = false;
    // this.invalidMeasurementDate = true;

    this.tempExterior.measurement_date = this.exteriorForm.get('measurement_date').value;

    if (!this.tempExterior.kind) {
      delete(this.tempExterior.kind);
    }

    const body = this.tempExterior;

    if (this.exteriorForm.valid && !this.invalidMeasurementDate) {
      this.apiService.doPostRequest(API_URI_MEASUREMENTS + '/' + this.uln + '/exteriors', body)
        .subscribe(
          res => {
            this.isRequestingExterior = false;
            this.getAnimalDetails.emit({});
            this.closeExteriorModal();
          },
          err => {
            this.isRequestingExterior = false;
            this.hasServerError = true;
          }
        );
    } else {
      this.isValidExteriorForm = false;
      this.isRequestingExterior = false;
    }
  }

  private openConfirmDeleteModal() {
    this.showConfirmDeleteModal = true;
  }

  private closeConfirmDeleteModal() {
    this.showConfirmDeleteModal = false;
  }

  private doPutExteriorDeactivateRequest() {
    this.isRequestingExterior = true;
    this.hasServerError = false;

    const date = this.stringAsModelDate(this.selectedExterior.measurement_date);
    const body = {
      'is_active': false
    };

    this.apiService.doPutRequest(API_URI_MEASUREMENTS + '/' + this.uln + '/exteriors/' + date, body)
      .subscribe(
        res => {
          this.isRequestingExterior = false;
          this.getAnimalDetails.emit({});
          this.closeConfirmDeleteModal();
          const existingDate = moment(this.selectedExterior.measurement_date).format(this.settings.getViewDateFormat());

          _.remove(this.exteriors, {
            measurement_date: this.selectedExterior.measurement_date
          });


          if (this.exteriors.length > 0) {
            this.selectedExterior = this.exteriors[0];
          } else {
            this.selectedExterior = new Exterior();
          }
        },
        err => {
          this.isRequestingExterior = false;
          this.hasServerError = true;
        }
      );
  }


  private doPutExteriorRequest() {
    this.isValidExteriorForm = true;
    this.isRequestingExterior = true;
    this.hasServerError = false;
    this.tempExterior.measurement_date = this.exteriorForm.get('measurement_date').value;

    if (!this.tempExterior.inspector) {
      delete(this.tempExterior.inspector);
    }

    if (this.tempExterior.kind === '') {
      delete(this.tempExterior.kind);
    }

    const body = this.tempExterior;

    if (this.exteriorForm.valid && !this.invalidMeasurementDate) {

      const date = this.stringAsModelDate(this.selectedExterior.measurement_date);

      this.apiService.doPutRequest(API_URI_MEASUREMENTS + '/' + this.uln + '/exteriors/' + date, body)
        .subscribe(
          res => {
            this.isRequestingExterior = false;
            // this.getAnimalDetails.emit({});
            this.selectedExterior = res.result;
            this.closeExteriorModal();
          },
          err => {
            this.isRequestingExterior = false;
            this.hasServerError = true;
          }
        );
    } else {
      this.isValidExteriorForm = false;
      this.isRequestingExterior = false;
    }
  }

  private closeExteriorModal() {
    this.showExteriorModal = false;
    this.displayExteriorModal = 'none';
  }

  private openExteriorModal(editMode: boolean = false) {
    this.isValidExteriorForm = true;
    this.hasServerError = false;
    this.isExteriorEditMode = editMode;
    this.showExteriorModal = true;

    if (!editMode) {
      this.kinds = [];
      this.getExteriorKinds();
      this.initDate = moment().format(this.settings.getViewDateFormat()); // today
      this.tempExterior = new Exterior();
      this.tempExterior.kind = '';
    }

    if (editMode) {
      this.kinds = [];
      this.tempExterior = _.clone(this.selectedExterior);
      this.initDate = moment(this.selectedExterior.measurement_date).format(this.settings.getViewDateFormat());
      this.getExteriorKindsForEdit(this.initDate);
    }
    this.displayExteriorModal = 'block';
  }

  selectExteriorData(value: string) {
    this.selectedExterior = _.find(this.exteriors, ['measurement_date', value]);
  }

  private exteriorMeasurementDateExists(measurement_date: string): boolean {
    let alreadyExists = false;

    this.exteriors.forEach(
      exterior => {
        const existingDate = moment(exterior.measurement_date).format(this.settings.getViewDateFormat());
        const newDate = moment(measurement_date).format(this.settings.getViewDateFormat());

        if (newDate === existingDate) {
          alreadyExists = true;
        }

        if (this.isExteriorEditMode
          && newDate === moment(this.selectedExterior.measurement_date).format(this.settings.getViewDateFormat())) {
          alreadyExists = false;
        }
      }
    );
    return alreadyExists;
  }

  private stringAsViewDate(date): string {
    return moment(date).format(this.settings.getViewDateFormat());
  }

  private stringAsViewDateTime(date: string): string {
    return moment(date).format(this.settings.getViewDateTimeFormat());
  }

  private stringAsModelDate(date: string): string {
    return moment(date).format(this.settings.getModelDateFormat());
  }
}
