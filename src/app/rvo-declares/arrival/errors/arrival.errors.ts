import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {ArrivalErrorResponse} from '../arrival.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_ARRIVALS_ERRORS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Settings} from '../../../shared/variables/settings';
import {NgxPaginationModule} from 'ngx-pagination';

@Component({
  providers: [NgxPaginationModule],
  templateUrl: './arrival.errors.html',
})

export class ArrivalErrorsComponent implements OnInit {
  private arrivalErrorList = <ArrivalErrorResponse[]>[];
  private error_modal_display = 'none';
  private error_message = '';
  private error_number = '';
  private isLoading = true;
  private showHiddenMessages = false;

  constructor(private apiService: NSFOService, private settings: Settings) {
  }

  ngOnInit() {
    this.getArrivalErrorList();
  }

  private getArrivalErrorList() {
    this.apiService
      .doGetRequest(API_URI_GET_ARRIVALS_ERRORS)
      .subscribe(res => {
          const arrivals = <ArrivalErrorResponse[]> res.json().result.arrivals;
          for (const arrival of arrivals) {
            arrival.arrival_date = moment(arrival.arrival_date).format(this.settings.VIEW_DATE_FORMAT);
            arrival.uln = arrival.uln_country_code + arrival.uln_number;
            arrival.pedigree = arrival.pedigree_country_code + arrival.pedigree_number;
            arrival.work_number = arrival.uln_number.substr(arrival.uln_number.length - 5);
            this.arrivalErrorList.push(arrival);
          }

          const arrival_imports = <ArrivalErrorResponse[]> res.json().result.imports;
          for (const arrival_import of arrival_imports) {
            arrival_import.arrival_date = moment(arrival_import.arrival_date).format(this.settings.VIEW_DATE_FORMAT);
            arrival_import.uln = arrival_import.uln_country_code + arrival_import.uln_number;
            arrival_import.pedigree = arrival_import.pedigree_country_code + arrival_import.pedigree_number;
            arrival_import.work_number = arrival_import.uln_number.substr(arrival_import.uln_number.length - 5);
            this.arrivalErrorList.push(arrival_import);
          }

          this.arrivalErrorList = _.orderBy(this.arrivalErrorList, ['log_date'], ['desc']);
          this.isLoading = false;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        });
  }

  private displayHiddenMessages() {
    this.showHiddenMessages = !this.showHiddenMessages;
  }

  private showError(event) {
    this.error_message = event.error.message;
    this.error_number = event.error.pedigree;
    this.error_number = event.error.uln;
    this.openErrorModal();
  }

  private removeArrival(event) {
    const item = <ArrivalErrorResponse> event;
    item.is_removed_by_user = true;
    this.arrivalErrorList = _.orderBy(this.arrivalErrorList, ['log_date'], ['desc']);
  }

  private openErrorModal() {
    this.error_modal_display = 'block';
  }

  private closeErrorModal() {
    this.error_modal_display = 'none';
  }
}
