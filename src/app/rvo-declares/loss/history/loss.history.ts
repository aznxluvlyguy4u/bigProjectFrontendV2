import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';

import {LossChangeResponse} from '../loss.model';


import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_LOSS_HISTORY, API_URI_REVOKE_DECLARATION} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Settings} from '../../../shared/variables/settings';
import {PaginationService} from 'ngx-pagination';
import {JsonResponseModel} from '../../../shared/models/json-response.model';
import {CacheService} from '../../../shared/services/settings/cache.service';

@Component({
  providers: [PaginationService],
  templateUrl: './loss.history.html',
})

export class LossHistoryComponent implements OnInit {
  public lossHistoryList = <LossChangeResponse[]>[];
  public selected_loss: LossChangeResponse;
  public modal_display = 'none';
  public isLoading = true;
  public page: number;
  public searchValue: string;

  constructor(private apiService: NSFOService, private settings: Settings, private cache: CacheService) {
  }

  ngOnInit() {
    this.getLossHistoryList();
  }

  public getLossHistoryList() {
    this.apiService
      .doGetRequest(API_URI_GET_LOSS_HISTORY)
      .subscribe((res: JsonResponseModel) => {
          const losses = <LossChangeResponse[]> res.result;

          for (const loss of losses) {
            loss.date_of_death = moment(loss.date_of_death).format(this.settings.VIEW_DATE_FORMAT);
            loss.uln = loss.uln_country_code + loss.uln_number;
            loss.pedigree = loss.pedigree_country_code + loss.pedigree_number;
            loss.work_number = loss.uln_number.substr(loss.uln_number.length - 5);
            this.lossHistoryList.push(loss);
          }

          this.lossHistoryList = _.orderBy(this.lossHistoryList, ['log_date'], ['desc']);
          this.isLoading = false;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  public selectLoss(event) {
    this.selected_loss = <LossChangeResponse> event;
    this.openModal();
  }

  public openModal() {
    this.modal_display = 'block';
  }

  public closeModal() {
    this.modal_display = 'none';
  }

  public revokeLoss() {
    const originalRequestState = this.selected_loss.request_state;
    this.selected_loss.request_state = 'REVOKING';
    this.apiService
      .doPostRequest(API_URI_REVOKE_DECLARATION, this.selected_loss)
      .subscribe(
        () => {
          this.selected_loss.request_state = this.cache.useRvoLogic() ? 'REVOKING' : 'REVOKED';
        },
        error => {
          this.selected_loss.request_state = originalRequestState;
          alert(this.apiService.getErrorMessage(error));
        }
      );
    this.closeModal();
  }
}
