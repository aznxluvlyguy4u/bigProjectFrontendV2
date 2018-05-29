import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {DepartChangeResponse} from '../depart.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_DEPARTS_HISTORY, API_URI_REVOKE_DECLARATION} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Settings} from '../../../shared/variables/settings';
import {NgxPaginationModule} from 'ngx-pagination';

@Component({
  providers: [NgxPaginationModule],
  templateUrl: './depart.history.html',
})

export class DepartHistoryComponent implements OnInit {
  private departHistoryList = <DepartChangeResponse[]>[];
  private selected_depart: DepartChangeResponse;
  private modal_display = 'none';
  private isLoading = true;

  constructor(private apiService: NSFOService, private settings: Settings) {
  }

  ngOnInit() {
    this.getDepartHistoryList();
  }

  private getDepartHistoryList() {
    this.apiService
      .doGetRequest(API_URI_GET_DEPARTS_HISTORY)
      .subscribe(res => {
          const departs = <DepartChangeResponse[]> res.result.departs;

          for (const depart of departs) {
            depart.depart_date = moment(depart.depart_date).format(this.settings.VIEW_DATE_FORMAT);
            depart.uln = depart.uln_country_code + depart.uln_number;
            depart.pedigree = depart.pedigree_country_code + depart.pedigree_number;
            depart.work_number = depart.uln_number.substr(depart.uln_number.length - 5);
            this.departHistoryList.push(depart);
          }

          const departs_exports = <DepartChangeResponse[]> res.result.exports;

          for (const depart of departs_exports) {
            depart.depart_date = moment(depart.depart_date).format(this.settings.VIEW_DATE_FORMAT);
            depart.uln = depart.uln_country_code + depart.uln_number;
            depart.pedigree = depart.pedigree_country_code + depart.pedigree_number;
            depart.work_number = depart.uln_number.substr(depart.uln_number.length - 5);
            this.departHistoryList.push(depart);
          }

          this.departHistoryList = _.orderBy(this.departHistoryList, ['log_date'], ['desc']);
          this.isLoading = false;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        });
  }

  private selectDepart(event) {
    this.selected_depart = <DepartChangeResponse> event;
    this.openModal();
  }

  private openModal() {
    this.modal_display = 'block';
  }

  private closeModal() {
    this.modal_display = 'none';
  }

  private revokeDepart() {
    this.apiService
      .doPostRequest(API_URI_REVOKE_DECLARATION, this.selected_depart)
      .subscribe(
        () => {
          this.selected_depart.request_state = 'REVOKING';
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
    this.closeModal();
  }
}
