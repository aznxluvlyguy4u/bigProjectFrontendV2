import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {LossErrorResponse} from '../loss.model';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_LOSS_ERRORS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {PaginationService} from 'ngx-pagination';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

@Component({
  providers: [PaginationService],
  templateUrl: './loss.errors.html',
})

export class LossErrorsComponent implements OnInit {
  public lossErrorList = <LossErrorResponse[]>[];
  public isLoading = true;
  public showHiddenMessages = false;
  public page: number;

  constructor(private apiService: NSFOService, private settings: SettingsService) {
  }

  ngOnInit() {
    this.getLossErrorList();
  }

  public getLossErrorList() {
    this.apiService
      .doGetRequest(API_URI_GET_LOSS_ERRORS)
      .subscribe((res: JsonResponseModel) => {
          const losses = <LossErrorResponse[]> res.result;

          for (const loss of losses) {
            loss.date_of_death = moment(loss.date_of_death).format(this.settings.getViewDateFormat());
            this.lossErrorList.push(loss);
          }

          this.lossErrorList = _.orderBy(this.lossErrorList, ['log_date'], ['desc']);
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

  public removeLoss(event) {
    const item = <LossErrorResponse> event;
    item.is_removed_by_user = true;
    this.lossErrorList = _.orderBy(this.lossErrorList, ['log_date'], ['desc']);
  }
}
