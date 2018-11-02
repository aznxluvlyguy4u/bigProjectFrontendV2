import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_MATE_HISTORY, API_URI_REVOKE_MATE} from '../../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {PaginationService} from 'ngx-pagination';
import {MateChangeResponse} from '../../../shared/models/nsfo-declare.model';
import {ErrorMessage} from '../../../shared/models/error-message.model';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

@Component({
  providers: [PaginationService],
  templateUrl: './mate.history.html',
})

export class MateHistoryComponent implements OnInit {
  searchValue: string;
  public mateHistoryList = <MateChangeResponse[]>[];
  public selectedAnimal: MateChangeResponse;
  public isSending = false;
  public modal_display = 'none';
  public errorModalDisplay = 'none';
  public errorMessages: ErrorMessage[] = [];

  public isLoading: boolean;

  constructor(private apiService: NSFOService, private settings: SettingsService) {
  }

  ngOnInit() {
    this.getMateHistoryList();
  }

  public getMateHistoryList() {
    this.isLoading = true;
    this.apiService
      .doGetRequest(API_URI_GET_MATE_HISTORY)
      .subscribe(
          (res: JsonResponseModel) => {
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
          this.isLoading = false;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
          this.isLoading = false;
        }
      );
  }

  public revokeMate() {
    this.isSending = true;
    this.apiService
      .doPutRequest(API_URI_REVOKE_MATE + '/' + this.selectedAnimal.message_id, '')
      .subscribe(
        res => {
          this.isSending = false;
          this.closeModal();

          this.selectedAnimal.request_state = 'REVOKED';
          this.selectedAnimal.revoke_date = moment().toISOString();

          const index = _.findIndex(this.mateHistoryList, {message_id: this.selectedAnimal.message_id});
          this.mateHistoryList.splice(index, 1, this.selectedAnimal);
        },
        err => {
          this.isSending = false;
          this.closeModal();
        }
      );
  }

  public selectMate(event) {
    this.selectedAnimal = <MateChangeResponse> event;
    this.openModal();
  }

  public openModal() {
    this.modal_display = 'block';
  }

  public closeModal() {
    this.modal_display = 'none';
  }

  public showError(event) {
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

  public openErrorModal() {
    this.errorModalDisplay = 'block';
  }

  public closeErrorModal() {
    this.errorModalDisplay = 'none';
  }
}
