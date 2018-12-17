import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {API_URI_GET_WEIGHT_HISTORY, API_URI_REVOKE_WEIGHT} from '../../../shared/services/nsfo-api/nsfo.settings';
import {PaginationService} from 'ngx-pagination';
import {ErrorMessage} from '../../../shared/models/error-message.model';
import {WeightChangeResponse} from '../../../shared/models/nsfo-declare.model';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

@Component({
  providers: [PaginationService],
  templateUrl: './weight.history.html',
})

export class WeightHistoryComponent implements OnInit {
  public weightHistoryList = <WeightChangeResponse[]>[];
  public selectedWeight: WeightChangeResponse;
  public isSending = false;
  public modalDisplay = 'none';
  public errorModalDisplay = 'none';
  public errorMessages: ErrorMessage[] = [];

  public isLoading: boolean;

  constructor(private nsfo: NSFOService, private settings: SettingsService) {
  }

  ngOnInit() {
    this.getWeightHistoryList();
  }

  public getWeightHistoryList() {
    this.isLoading = true;
    this.nsfo
      .doGetRequest(API_URI_GET_WEIGHT_HISTORY)
      .subscribe(
          (res: JsonResponseModel) => {
          const weights = <WeightChangeResponse[]> res.result;
          for (const weight of weights) {
            weight.measurement_date = moment(weight.measurement_date).format(this.settings.getViewDateFormat());
          }
          this.weightHistoryList = _.orderBy(weights, ['log_date'], ['desc']);
          this.isLoading = false;
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
          this.isLoading = false;
        }
      );
  }

  public revokeWeight() {
    this.isSending = true;
    this.nsfo
      .doPutRequest(API_URI_REVOKE_WEIGHT + '/' + this.selectedWeight.message_id, '')
      .subscribe(
        res => {
          this.isSending = false;
          this.closeModal();

          this.selectedWeight.request_state = 'REVOKED';
          this.selectedWeight.revoke_date = moment().toISOString();

          const index = _.findIndex(this.weightHistoryList, {message_id: this.selectedWeight.message_id});
          this.weightHistoryList.splice(index, 1, this.selectedWeight);
        },
        err => {
          this.isSending = false;
          this.closeModal();
        }
      );
  }

  public selectWeight(event) {
    this.selectedWeight = <WeightChangeResponse> event;
    this.openModal();
  }

  public openModal() {
    this.modalDisplay = 'block';
  }

  public closeModal() {
    this.modalDisplay = 'none';
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
