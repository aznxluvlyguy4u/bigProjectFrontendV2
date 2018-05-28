import moment = require('moment');
import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {API_URI_GET_WEIGHT_HISTORY, API_URI_REVOKE_WEIGHT} from '../../../shared/services/nsfo-api/nsfo.settings';
import {NgxPaginationModule} from 'ngx-pagination';
import {ErrorMessage} from '../../../shared/models/error-message.model';
import {WeightChangeResponse} from '../../../shared/models/nsfo-declare.model';

@Component({
  providers: [NgxPaginationModule],
  templateUrl: './weight.history.html',
})

export class WeightHistoryComponent implements OnInit {
  private weightHistoryList = <WeightChangeResponse[]>[];
  private selectedWeight: WeightChangeResponse;
  private isSending = false;
  private modalDisplay = 'none';
  private errorModalDisplay = 'none';
  private errorMessages: ErrorMessage[] = [];

  constructor(private nsfo: NSFOService, private settings: SettingsService) {
  }

  ngOnInit() {
    this.getWeightHistoryList();
  }

  private getWeightHistoryList() {
    this.nsfo
      .doGetRequest(API_URI_GET_WEIGHT_HISTORY)
      .subscribe(
        res => {
          const weights = <WeightChangeResponse[]> res.result;
          for (const weight of weights) {
            weight.measurement_date = moment(weight.measurement_date).format(this.settings.getViewDateFormat());
          }
          this.weightHistoryList = _.orderBy(weights, ['log_date'], ['desc']);
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
        }
      );
  }

  private revokeWeight() {
    this.isSending = true;
    this.nsfo
      .doPutRequest(API_URI_REVOKE_WEIGHT + '/' + this.selectedWeight.message_id, '')
      .subscribe(
        res => {
          this.isSending = false;
          this.closeModal();

          this.selectedWeight.request_state = 'REVOKED';
          this.selectedWeight.revoke_date = moment();

          const index = _.findIndex(this.weightHistoryList, {message_id: this.selectedWeight.message_id});
          this.weightHistoryList.splice(index, 1, this.selectedWeight);
        },
        err => {
          this.isSending = false;
          this.closeModal();
        }
      );
  }

  private selectWeight(event) {
    this.selectedWeight = <WeightChangeResponse> event;
    this.openModal();
  }

  private openModal() {
    this.modalDisplay = 'block';
  }

  private closeModal() {
    this.modalDisplay = 'none';
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
