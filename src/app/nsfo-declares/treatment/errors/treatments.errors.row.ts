import {AfterViewChecked, Component, EventEmitter, Input, Output} from '@angular/core';

import {TreatmentErrorResponse} from '../models/treatment-error-response.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Constants} from '../../../shared/variables/constants';
import {Settings} from '../../../shared/variables/settings';
import {API_URI_HIDE_ERROR} from '../../../shared/services/nsfo-api/nsfo.settings';

@Component({
  selector: '[app-treatments-error-row]',
  templateUrl: './treatments.errors.row.html',
})

export class TreatmentsErrorRowComponent implements AfterViewChecked {
  @Input() treatment: TreatmentErrorResponse;
  @Input() treatment_index: number;
  @Output() removeTreatment = new EventEmitter();
  public editMode = false;
  public popupIsLoaded = false;
  public form_valid = true;
  public view_date_format;
  public view_datetime_format;
  public model_datetime_format;

  constructor(private apiService: NSFOService,
              public constants: Constants,
              private settings: Settings) {
    this.view_date_format = settings.VIEW_DATE_FORMAT;
    this.view_datetime_format = settings.VIEW_DATETIME_FORMAT;
    this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;
  }

  ngAfterViewChecked() {
    if (!this.popupIsLoaded) {
      // $('#error-' + this.loss_index).foundation();
      this.popupIsLoaded = true;
    }
  }

  public sendRemoveErrorRequest() {
    const request = {
      'is_removed_by_user': true,
      'request_id': this.treatment.request_id
    };

    this.apiService
      .doPutRequest(API_URI_HIDE_ERROR, request)
      .subscribe(() => {
      });
    this.removeTreatment.emit(this.treatment);
  }
}
