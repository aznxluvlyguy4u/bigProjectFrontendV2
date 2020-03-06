import * as moment from 'moment';
import * as _ from 'lodash';

import {Component, EventEmitter, Input, OnDestroy, OnInit} from '@angular/core';
import {Subscription} from 'rxjs';
import {MeasurementOutput} from '../../../shared/models/measurement.model';
import {ScanMeasurementsEditModalService} from './scan-measurements-edit-modal.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';

@Component({
  selector: 'app-scan-measurement-edit-modal',
  templateUrl: './scan-measurements-edit-modal.component.html'
})
export class ScanMeasurementsEditModalComponent implements OnInit, OnDestroy {
  public title = 'SCAN MEASUREMENTS';
  public modalDisplay = 'none';
  public measurementDateString: string;

  @Input()
  public initialScanMeasurement: MeasurementOutput;
  public editedScanMeasurement: MeasurementOutput;
  public deleteScanMeasurement = false;
  public initialValuesChanged = new EventEmitter();

  public isModalActiveSubscription: Subscription;
  public toggleModalSubscription: Subscription;
  public scanMeasurementsSetChangedSubscription: Subscription;

  constructor(
    private scanMeasurementsEditService: ScanMeasurementsEditModalService,
    private settings: SettingsService
  ) {}

  ngOnInit() {
    this.scanMeasurementsSetChangedSubscription = this.scanMeasurementsEditService.scanMeasurementsSetChanged.subscribe(
      (scanMeasurementsSet: MeasurementOutput) => {
        this.initialScanMeasurement = scanMeasurementsSet;
        this.editedScanMeasurement = _.cloneDeep(this.initialScanMeasurement);
        this.initialValuesChanged.emit();
        this.setEditableScanMeasurmentMeasurementDateString();
      }
    );

    this.isModalActiveSubscription = this.scanMeasurementsEditService.isModalActive.subscribe(
      (notifyUser: boolean) => {
        if (notifyUser) {
          this.openModal();
        } else {
          this.closeModal();
        }
      }
    );

    this.toggleModalSubscription = this.scanMeasurementsEditService.toggleIsModalActive.subscribe(
      (toggleModal: boolean) => {
        if (toggleModal) {
          this.toggleModal();
        }
      }
    );
  }

  ngOnDestroy() {
    if (this.isModalActiveSubscription) {
      this.isModalActiveSubscription.unsubscribe();
    }

    if (this.toggleModalSubscription) {
      this.toggleModalSubscription.unsubscribe();
    }
  }

  private setEditableScanMeasurmentMeasurementDateString() {
    if (this.editedScanMeasurement != null && this.editedScanMeasurement.measurement_date != null) {
      this.updateReferenceDateString(this.editedScanMeasurement.measurement_date);
    } else {
      this.updateReferenceDateString(null);
    }
  }

  public save() {
    if (this.deleteScanMeasurement) {
      this.scanMeasurementsEditService.deleteScanMeasurement();
    } else {
      this.scanMeasurementsEditService.modifyScanMeasurement(this.editedScanMeasurement);
    }
    this.closeModal();
  }

  public openModal() {
    this.modalDisplay = 'block';
  }

  public closeModal() {
    this.editedScanMeasurement = _.cloneDeep(this.initialScanMeasurement);
    this.modalDisplay = 'none';
  }

  public toggleModal() {
    if (this.modalDisplay === 'none') {
      this.openModal();
    } else {
      this.closeModal();
    }
  }


  public stringAsViewDate(date) {
    return moment(date).format(this.settings.getViewDateFormat());
  }

  updateReferenceDateString(referenceDateString: string) {
    if (referenceDateString != null) {
      this.editedScanMeasurement.measurement_date = referenceDateString;
      this.measurementDateString = SettingsService.getDateString_YYYY_MM_DD_fromDate(
        new Date(referenceDateString)
      );
    } else {
      this.editedScanMeasurement.measurement_date = null;
      this.measurementDateString = SettingsService.getDateString_YYYY_MM_DD_fromDate();
    }
  }
}
