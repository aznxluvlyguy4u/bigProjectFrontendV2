import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';

import {DepartErrorResponse} from '../depart.model';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Settings} from '../../../shared/variables/settings';
import {API_URI_GET_DEPARTS_ERRORS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {NgxPaginationModule} from 'ngx-pagination';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

@Component({
  providers: [NgxPaginationModule],
  templateUrl: './depart.errors.html',
})

export class DepartErrorsComponent implements OnInit {
  public departErrorList = <DepartErrorResponse[]>[];
  public isLoading = true;
  public showHiddenMessages = false;
  public page: number;

  constructor(private apiService: NSFOService, private settings: Settings) {
  }

  ngOnInit() {
    this.getDepartErrorList();
  }

  public getDepartErrorList() {
    this.apiService
      .doGetRequest(API_URI_GET_DEPARTS_ERRORS)
      .subscribe((res: JsonResponseModel) => {
          const departs = <DepartErrorResponse[]> res.result.departs;
          for (const depart of departs) {
            depart.depart_date = moment(depart.depart_date).format(this.settings.VIEW_DATE_FORMAT);
            this.departErrorList.push(depart);
          }

          const departs_exports = <DepartErrorResponse[]> res.result.exports;
          for (const depart_export of departs_exports) {
            depart_export.depart_date = moment(depart_export.depart_date).format(this.settings.VIEW_DATE_FORMAT);
            this.departErrorList.push(depart_export);
          }

          this.departErrorList = _.orderBy(this.departErrorList, ['log_date'], ['desc']);
          this.isLoading = false;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  public removeDepart(event) {
    const item = <DepartErrorResponse> event;
    item.is_removed_by_user = true;
    this.departErrorList = _.orderBy(this.departErrorList, ['log_date'], ['desc']);
  }

  public displayHiddenMessages() {
    this.showHiddenMessages = !this.showHiddenMessages;
  }
}
