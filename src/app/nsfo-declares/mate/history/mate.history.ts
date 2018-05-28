import moment = require('moment');
import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {PaginationComponent} from '../../../shared/components/pagination/pagination.component';
import {API_URI_GET_MATE_HISTORY, API_URI_REVOKE_MATE} from '../../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {MateHistoryPipe} from './pipes/mate.history.pipe';
import {NgxPaginationModule} from 'ngx-pagination';
import {MateHistoryRowComponent} from './mate.history.row';
import {MateChangeResponse} from '../../../shared/models/nsfo-declare.model';
import {ErrorMessage} from '../../../shared/models/error-message.model';

@Component({
  providers: [NgxPaginationModule],
  directives: [MateHistoryRowComponent, PaginationComponent],
  templateUrl: './mate.history.html',
  pipes: [MateHistoryPipe]
})

export class MateHistoryComponent implements OnInit {
  searchValue: string;
  private mateHistoryList = <MateChangeResponse[]>[];
  private selectedAnimal: MateChangeResponse;
  private isSending = false;
  private modal_display = 'none';
  private errorModalDisplay = 'none';
  private errorMessages: ErrorMessage[] = [];

  constructor(private apiService: NSFOService, private settings: SettingsService) {
  }

  ngOnInit() {
    this.getMateHistoryList();
  }

  private getMateHistoryList() {
    this.apiService
      .doGetRequest(API_URI_GET_MATE_HISTORY)
      .subscribe(
        res => {
          const mates = <MateChangeResponse[]> res.result;
          for (const mate of mates) {
            mate.start_date = moment(mate.start_date).format(this.settings.getViewDateFormat());
            mate.end_date = moment(mate.end_date).format(this.settings.getViewDateFormat());

            if (mate.pmsg) {
              mate.pmsg = 'YES';
            } else {
              mate.pmsg = 'NO';
            }

            if (mate.ki) {
              mate.ki = 'YES';
            } else {
              mate.ki = 'NO';
            }
          }
          this.mateHistoryList = _.orderBy(mates, ['log_date'], ['desc']);
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  private revokeMate() {
    this.isSending = true;
    this.apiService
      .doPutRequest(API_URI_REVOKE_MATE + '/' + this.selectedAnimal.message_id, '')
      .subscribe(
        res => {
          this.isSending = false;
          this.closeModal();

          this.selectedAnimal.request_state = 'REVOKED';
          this.selectedAnimal.revoke_date = moment();

          const index = _.findIndex(this.mateHistoryList, {message_id: this.selectedAnimal.message_id});
          this.mateHistoryList.splice(index, 1, this.selectedAnimal);
        },
        err => {
          this.isSending = false;
          this.closeModal();
        }
      );
  }

  private selectMate(event) {
    this.selectedAnimal = <MateChangeResponse> event;
    this.openModal();
  }

  private openModal() {
    this.modal_display = 'block';
  }

  private closeModal() {
    this.modal_display = 'none';
  }

  private showError(event) {
    this.errorMessages = event.result;

    if (this.errorMessages.length === 0) {
      const errorMessage = {
        code: 403,
        message: 'SOMETHING WENT WRONG! TRY AGAIN AT LATER TIME!'
      };
      this.errorMessages.push(errorMessage);
    }

    this.openErrorModal();
  }

  private openErrorModal() {
    this.errorModalDisplay = 'block';
  }

  private closeErrorModal() {
    this.errorModalDisplay = 'none';
  }
}
