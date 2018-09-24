import * as moment from 'moment';
import * as _ from 'lodash';

import {AfterViewInit, Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {FormGroup, FormBuilder, FormControl} from '@angular/forms';

import {SettingsService} from '../../../shared/services/settings/settings.service';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_MEASUREMENTS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {ExteriorMeasurementsValidator} from '../../../shared/validation/nsfo-validation';
import {Exterior} from '../../../shared/models/measurement.model';
import {User} from '../../../shared/models/person.model';
import {JsonResponseModel} from '../../../shared/models/json-response.model';


@Component({
  selector: 'app-exterior-component',
  templateUrl: './exterior.component.html',
})

export class ExteriorComponent implements OnInit, AfterViewInit, OnChanges {

  @Input() exteriors: Exterior[] = [];
  @Input() uln: string;
  @Output() latestExteriors = new EventEmitter<Exterior[]>();

  public inspectors: User[] = [];

  private fullOutputQuery = '?full_output=true';

  public showExteriorModal = false;
  public exteriorForm: FormGroup;
  public isValidExteriorForm = true;
  public isRequestingExterior = false;
  public hasServerError = false;

  public isExteriorEditMode = false;
  public kinds: string[] = [];
  public selectedExterior: Exterior = new Exterior();
  public isAdmin = false;
  public tempExterior: Exterior = new Exterior();
  public displayExteriorModal = 'none';
  // public selectedExteriorDate = '';
  public selectedDate: string;
  public invalidMeasurementDate = false;

  public initDate: string;

  public showConfirmDeleteModal = false;

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
      this.selectedDate = this.selectedExterior.measurement_date;
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

  public getExteriorKinds() {
    this.apiService
      .doGetRequest(API_URI_MEASUREMENTS + '/' + this.uln + '/exteriors/kinds')
      .subscribe(
          (res: JsonResponseModel) => {
          this.kinds = res.result;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  public getExteriorKindsForEdit(measurementDate: string) {
    this.apiService
      .doGetRequest(API_URI_MEASUREMENTS + '/' + this.uln + '/exteriors/kinds/' + measurementDate)
      .subscribe(
          (res: JsonResponseModel) => {
          this.kinds = res.result;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  public getInspectors() {
    if (!this.settings.isAdmin()) {
        return;
    }

    this.apiService
      .doGetRequest(API_URI_MEASUREMENTS + '/' + this.uln + '/exteriors/inspectors')
      .subscribe(
          (res: JsonResponseModel) => {
          this.inspectors = res.result;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  public doPostExteriorRequest() {
    this.isValidExteriorForm = true;
    this.isRequestingExterior = true;
    this.hasServerError = false;
    // this.invalidMeasurementDate = true;

    this.tempExterior.measurement_date = this.exteriorForm.get('measurement_date').value;

    this.replaceEmptyStringsInTempExterior();

    const body = this.tempExterior;

    if (this.exteriorForm.valid && !this.invalidMeasurementDate) {
      this.apiService.doPostRequest(API_URI_MEASUREMENTS + '/' + this.uln + '/exteriors' + this.fullOutputQuery, body)
        .subscribe(
          res => {
            this.isRequestingExterior = false;
            this.updateLocalValues(res);
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

  private updateLocalValues(res: any, useLatestAsSelected = false) {
    this.exteriors = res.result.full_output;
    this.latestExteriors.emit(this.exteriors);

    if (useLatestAsSelected) {
      if (this.exteriors.length > 0) {
        this.selectedExterior = this.exteriors[0];
      } else {
        this.selectedExterior = new Exterior();
      }
    } else {
      this.selectedExterior = res.result.selected;
    }

    this.selectedDate = this.selectedExterior.measurement_date;
  }

  public openConfirmDeleteModal() {
    this.showConfirmDeleteModal = true;
  }

  public closeConfirmDeleteModal() {
    this.showConfirmDeleteModal = false;
  }

  public doPutExteriorDeactivateRequest() {
    this.isRequestingExterior = true;
    this.hasServerError = false;

    const date = this.stringAsModelDate(this.selectedExterior.measurement_date);
    const body = {
      'is_active': false
    };

    this.apiService.doPutRequest(API_URI_MEASUREMENTS + '/' + this.uln + '/exteriors/' + date + this.fullOutputQuery, body)
      .subscribe(
        res => {
          this.isRequestingExterior = false;
          this.updateLocalValues(res, true);
          this.closeConfirmDeleteModal();
        },
        err => {
          this.isRequestingExterior = false;
          this.hasServerError = true;
        }
      );
  }


  public doPutExteriorRequest() {
    this.isValidExteriorForm = true;
    this.isRequestingExterior = true;
    this.hasServerError = false;
    this.tempExterior.measurement_date = this.exteriorForm.get('measurement_date').value;

    this.replaceEmptyStringsInTempExterior();

    const body = this.tempExterior;

    if (this.exteriorForm.valid && !this.invalidMeasurementDate) {

      const date = this.stringAsModelDate(this.selectedExterior.measurement_date);

      this.apiService.doPutRequest(API_URI_MEASUREMENTS + '/' + this.uln + '/exteriors/' + date + this.fullOutputQuery, body)
        .subscribe(
            (res: JsonResponseModel) => {
            this.isRequestingExterior = false;
            this.updateLocalValues(res);
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

  private replaceEmptyStringsInTempExterior() {
    if (!this.tempExterior.inspector || !this.tempExterior.inspector.person_id) {
      delete(this.tempExterior.inspector);
    }

    if (this.tempExterior.kind === '') {
      delete(this.tempExterior.kind);
    }

    if (this.tempExterior.skull == null) {
      this.tempExterior.skull = 0;
    }

    if (this.tempExterior.progress == null) {
      this.tempExterior.progress = 0;
    }

    if (this.tempExterior.muscularity == null) {
      this.tempExterior.muscularity = 0;
    }

    if (this.tempExterior.proportion == null) {
      this.tempExterior.proportion = 0;
    }

    if (this.tempExterior.exterior_type == null) {
      this.tempExterior.exterior_type = 0;
    }

    if (this.tempExterior.leg_work == null) {
      this.tempExterior.leg_work = 0;
    }

    if (this.tempExterior.fur == null) {
      this.tempExterior.fur = 0;
    }

    if (this.tempExterior.general_appearance == null) {
      this.tempExterior.general_appearance = 0;
    }

    if (this.tempExterior.height == null) {
      this.tempExterior.height = 0;
    }

    if (this.tempExterior.torso_length == null) {
      this.tempExterior.torso_length = 0;
    }

    if (this.tempExterior.breast_depth == null) {
      this.tempExterior.breast_depth = 0;
    }

    if (this.tempExterior.markings == null) {
      this.tempExterior.markings = 0;
    }
  }

  public closeExteriorModal() {
    this.showExteriorModal = false;
    this.displayExteriorModal = 'none';
  }

  public openExteriorModal(editMode: boolean = false) {
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
      if (!this.tempExterior.inspector) {
        this.tempExterior.inspector = new Inspector();
      }
      this.initDate = moment(this.selectedExterior.measurement_date).format(this.settings.getViewDateFormat());
      this.getExteriorKindsForEdit(this.initDate);
    }
    this.displayExteriorModal = 'block';
  }

  selectExteriorData(value: string) {
    this.selectedExterior = _.find(this.exteriors, ['measurement_date', value]);
  }

  public exteriorMeasurementDateExists(measurement_date: string): boolean {
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

  public stringAsViewDate(date): string {
    return moment(date).format(this.settings.getViewDateFormat());
  }

  public stringAsViewDateTime(date: string): string {
    return moment(date).format(this.settings.getViewDateTimeFormat());
  }

  public stringAsModelDate(date: string): string {
    return moment(date).format(this.settings.getModelDateFormat());
  }

  public getSelectedInspectorName(): string {
    return this.getInspectorName(this.selectedExterior);
  }

  private getInspectorName(exterior: Exterior): string {
    if (!this.hasInspectorName(exterior)) {
      return '';
    }
    if (exterior.inspector.first_name === undefined) {
      return exterior.inspector.last_name;
    }
    return exterior.inspector.first_name + ' ' + exterior.inspector.last_name;
  }

  private hasInspectorName(exterior: Exterior): boolean {
    if (!exterior || !exterior.inspector) {
      return false;
    }
    return exterior.inspector.first_name !== undefined || exterior.inspector.last_name !== undefined;
  }

}
