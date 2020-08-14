import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {TreatmentErrorResponse} from '../models/treatment-error-response.model';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_TREATMENT_ERRORS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {PaginationService} from 'ngx-pagination';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

@Component({
  providers: [PaginationService],
  templateUrl: './treatments.errors.html',
})

export class TreatmentsErrorsComponent implements OnInit {
  public treatmentsErrorList = <TreatmentErrorResponse[]>[];
  public isLoading = true;
  public showHiddenMessages = false;
  public page: number;

  constructor(private apiService: NSFOService, private settings: SettingsService) {
  }

  ngOnInit() {
    this.getTreatmentsErrorList();
  }

  public getTreatmentsErrorList() {
    this.apiService
      .doGetRequest(API_URI_GET_TREATMENT_ERRORS)
      .subscribe((res: JsonResponseModel) => {
          const treatments = <TreatmentErrorResponse[]> res.result;

          for (const treatment of treatments) {
            treatment.log_date = moment(treatment.log_date).format(this.settings.getViewDateFormat());
            treatment.flag_start_date = moment(treatment.flag_start_date).format(this.settings.getViewDateFormat());
            treatment.flag_end_date = treatment.flag_end_date ?
              moment(treatment.flag_end_date).format(this.settings.getViewDateFormat()) : null;
            this.treatmentsErrorList.push(treatment);
          }

          this.treatmentsErrorList = _.orderBy(this.treatmentsErrorList, ['log_date'], ['desc']);
          this.isLoading = false;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  public displayHiddenMessages() {
    this.showHiddenMessages = !this.showHiddenMessages;
  }

  public removeTreatment = (event) => {
    const item = <TreatmentErrorResponse> event;
    item.is_removed_by_user = true;
    this.treatmentsErrorList = _.orderBy(this.treatmentsErrorList, ['log_date'], ['desc']);
  }
}
