import moment = require('moment');
import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';

import {LossChangeResponse} from '../loss.model';
import {TranslatePipe} from '@ngx-translate/core';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_LOSS_HISTORY, API_URI_REVOKE_DECLARATION} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Settings} from '../../../shared/variables/settings';
import {PaginationComponent} from '../../../shared/components/pagination/pagination.component';
import {LossHistoryFilterPipe} from './pipes/lossHistoryFilter';
import {NgxPaginationModule} from 'ngx-pagination';
import {LossHistoryRowComponent} from './loss.history.row';

@Component({
  providers: [NgxPaginationModule],
  directives: [LossHistoryRowComponent, PaginationComponent],
  templateUrl: './loss.history.html',
  pipes: [LossHistoryFilterPipe]
})

export class LossHistoryComponent implements OnInit {
  private lossHistoryList = <LossChangeResponse[]>[];
  private selected_loss: LossChangeResponse;
  private modal_display = 'none';
  private isLoading = true;

  constructor(private apiService: NSFOService, private settings: Settings) {
  }

  ngOnInit() {
    this.getLossHistoryList();
  }

  private getLossHistoryList() {
    this.apiService
      .doGetRequest(API_URI_GET_LOSS_HISTORY)
      .subscribe(res => {
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

  private selectLoss(event) {
    this.selected_loss = <LossChangeResponse> event;
    this.openModal();
  }

  private openModal() {
    this.modal_display = 'block';
  }

  private closeModal() {
    this.modal_display = 'none';
  }

  private revokeLoss() {
    this.apiService
      .doPostRequest(API_URI_REVOKE_DECLARATION, this.selected_loss)
      .subscribe(
        () => {
          this.selected_loss.request_state = 'REVOKING';
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
    this.closeModal();
  }
}
