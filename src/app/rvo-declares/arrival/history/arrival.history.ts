import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {ArrivalChangeResponse} from '../arrival.model';


import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_ARRIVALS_HISTORY, API_URI_REVOKE_DECLARATION} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Settings} from '../../../shared/variables/settings';
import {NgxPaginationModule} from 'ngx-pagination';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

@Component({
  providers: [NgxPaginationModule],
  templateUrl: './arrival.history.html',
})

export class ArrivalHistoryComponent implements OnInit {
  private arrivalHistoryList = <ArrivalChangeResponse[]>[];
  private selected_arrival: ArrivalChangeResponse;
  private searchValue = '';
  private modal_display = 'none';
  private error_modal_display = 'none';
  private error_message = '';
  private error_number = '';
  private isLoading = true;

  constructor(private apiService: NSFOService, private settings: Settings) {
  }

  ngOnInit() {
    this.getArrivalHistoryList();
  }

  private getArrivalHistoryList() {
    this.apiService
      .doGetRequest(API_URI_GET_ARRIVALS_HISTORY)
      .subscribe((res: JsonResponseModel) => {
        const arrivals = <ArrivalChangeResponse[]> res.result.arrivals;
        for (const arrival of arrivals) {
          arrival.arrival_date = moment(arrival.arrival_date).format(this.settings.VIEW_DATE_FORMAT);
          arrival.uln = arrival.uln_country_code + arrival.uln_number;
          arrival.pedigree = arrival.pedigree_country_code + arrival.pedigree_number;
          arrival.work_number = arrival.uln_number.substr(arrival.uln_number.length - 5);
          this.arrivalHistoryList.push(arrival);
        }

        const arrival_imports = <ArrivalChangeResponse[]> res.result.imports;
        for (const arrival_import of arrival_imports) {
          arrival_import.arrival_date = moment(arrival_import.arrival_date).format(this.settings.VIEW_DATE_FORMAT);
          arrival_import.uln = arrival_import.uln_country_code + arrival_import.uln_number;
          arrival_import.pedigree = arrival_import.pedigree_country_code + arrival_import.pedigree_number;
          arrival_import.work_number = arrival_import.uln_number.substr(arrival_import.uln_number.length - 5);
          this.arrivalHistoryList.push(arrival_import);
        }

        this.arrivalHistoryList = _.orderBy(this.arrivalHistoryList, ['log_date'], ['desc']);
        this.isLoading = false;
      });
  }

  private selectArrival(event) {
    this.selected_arrival = <ArrivalChangeResponse> event;
    this.openModal();
  }

  private showError(event) {
    this.error_message = event.error.message;
    this.error_number = event.error.pedigree;
    this.error_number = event.error.uln;
    this.openErrorModal();
  }

  private openModal() {
    this.modal_display = 'block';
  }

  private closeModal() {
    this.modal_display = 'none';
  }

  private openErrorModal() {
    this.error_modal_display = 'block';
  }

  private closeErrorModal() {
    this.error_modal_display = 'none';
  }

  private revokeArrival() {
    this.apiService
      .doPostRequest(API_URI_REVOKE_DECLARATION, this.selected_arrival)
      .subscribe(
        () => {
          this.selected_arrival.request_state = 'REVOKING';
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
    this.closeModal();
  }
}
