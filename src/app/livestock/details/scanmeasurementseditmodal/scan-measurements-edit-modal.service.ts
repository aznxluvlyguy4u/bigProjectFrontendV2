import * as _ from 'lodash';

import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {MeasurementOutput} from '../../../shared/models/measurement.model';
import {API_URI_SCAN_MEASUREMENTS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {ResponseResultModel} from '../../../shared/models/response-result.model';
import {HttpErrorResponse} from '@angular/common/http';
import * as HttpStatus from 'http-status-codes';
import {RequestStatus} from '../../../shared/models/request.status';


@Injectable()
export class ScanMeasurementsEditModalService {

  private _animalId: string;

  public isModalActive = new Subject<boolean>();
  public toggleIsModalActive = new Subject<boolean>();
  public scanMeasurementsSetChanged = new Subject<MeasurementOutput>();

  public processStatus = new Subject<RequestStatus>();

  private _scanMeasurementsSet: MeasurementOutput = new MeasurementOutput();

  constructor(
    private apiService: NSFOService
  ) {
  }

  set animalId(animalId: string) {
    this._animalId = animalId;
  }

  set scanMeasurementsSet(scanMeasurementsSet: MeasurementOutput) {
    this._scanMeasurementsSet = scanMeasurementsSet;
    this.scanMeasurementsSetChanged.next(this._scanMeasurementsSet);
  }

  public openScanMeasurementsEditModal() {
    this.updateModalNotificationStatus(true);
  }

  public closeScanMeasurementsEditModal() {
    this.updateModalNotificationStatus(false);
  }

  private updateModalNotificationStatus(openModal: boolean) {
    this.isModalActive.next(openModal);
  }

  public toggleScanMeasurementsEditModal() {
    this.toggleIsModalActive.next(true);
  }

  private notifyScanMeasurementSetHasChanged() {
    this.scanMeasurementsSetChanged.next(_.cloneDeep(this.scanMeasurementsSet));
  }

  private validateAnimalId() {
    if (this._animalId == null) {
      alert('animalId is missing!');
    }
  }

  public deleteScanMeasurement() {
    this.validateAnimalId();
    this.sendRequestIsProcessing();

    this.apiService
      .doDeleteRequest(API_URI_SCAN_MEASUREMENTS, this._animalId)
      .subscribe(
        (res: ResponseResultModel) => {
          this.actionsAfterSuccessfulSave(new MeasurementOutput());
        },
        (err: HttpErrorResponse) => {
          if (err.status === HttpStatus.NOT_FOUND) {
            this.actionsAfterSuccessfulSave(new MeasurementOutput());
          } else {
            this.actionsAfterFailedSave(err);
          }
        }
      );
  }



  public modifyScanMeasurement(scanMeasurementsSet: MeasurementOutput) {
    this.validateAnimalId();
    this.sendRequestIsProcessing();

    const request = {
      'fat1': scanMeasurementsSet.fat1,
      'fat2': scanMeasurementsSet.fat2,
      'fat3': scanMeasurementsSet.fat3,
      'muscle_thickness': scanMeasurementsSet.muscle_thickness,
      'scan_weight': scanMeasurementsSet.scan_weight,
      'measurement_date': scanMeasurementsSet.measurement_date,
      'inspector_id': scanMeasurementsSet.inspector_id,
    };

    console.log(request);

    this.apiService
      .doPutRequest(API_URI_SCAN_MEASUREMENTS + '/' + this._animalId, request)
      .subscribe(
        (res: ResponseResultModel) => {
          const result: MeasurementOutput = res.result;
          this.actionsAfterSuccessfulSave(result);
        },
        err => {
          this.actionsAfterFailedSave(err);
        }
      );
  }

  private sendRequestIsProcessing() {
    this.sendRequestStatus(true);
  }

  private sendRequestStatus(isProcessing: boolean,
                            isResponseSuccessful: boolean = null,
                            response: any = null,
                            errorMessage: string = ''
  ) {
    const requestStatus = new RequestStatus();
    requestStatus.isProcessing = isProcessing;
    requestStatus.isResponseSuccessful = isResponseSuccessful;
    requestStatus.response = response;
    requestStatus.errorMessage = errorMessage;
    this.processStatus.next(requestStatus);
  }

  private actionsAfterSuccessfulSave(updatedScanMeasurementSet: MeasurementOutput) {
    this._scanMeasurementsSet = updatedScanMeasurementSet;
    this.sendRequestStatus(false, true, this._scanMeasurementsSet);
  }

  private actionsAfterFailedSave(err: HttpErrorResponse) {
    const errorMessage = this.apiService.getErrorMessage(err);
    this.sendRequestStatus(false, false, err, errorMessage);
  }
}
