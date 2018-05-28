import moment = require('moment');
import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {LossErrorResponse} from '../loss.model';

import {LossErrorRowComponent} from './loss.errors.row';


import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_LOSS_ERRORS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {PaginationComponent} from '../../../shared/components/pagination/pagination.component';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {NgxPaginationModule} from 'ngx-pagination';

@Component({
  providers: [NgxPaginationModule],
  directives: [LossErrorRowComponent, PaginationComponent],
  templateUrl: './loss.errors.html',
})

export class LossErrorsComponent implements OnInit {
  private lossErrorList = <LossErrorResponse[]>[];
  private isLoading = true;
  private showHiddenMessages = false;

  constructor(private apiService: NSFOService, private settings: SettingsService) {
  }

  ngOnInit() {
    this.getLossErrorList();
  }

  private getLossErrorList() {
    this.apiService
      .doGetRequest(API_URI_GET_LOSS_ERRORS)
      .subscribe(res => {
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

  private displayHiddenMessages() {
    this.showHiddenMessages = !this.showHiddenMessages;
  }

  private removeLoss(event) {
    const item = <LossErrorResponse> event;
    item.is_removed_by_user = true;
    this.lossErrorList = _.orderBy(this.lossErrorList, ['log_date'], ['desc']);
  }
}
