import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {EartagErrorResponse} from '../eartag.model';
import {API_URI_GET_EARTAGS_ERRORS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {PaginationService} from 'ngx-pagination';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

@Component({
  providers: [PaginationService],
  templateUrl: './eartag.errors.html',
})
export class EartagErrorsComponent implements OnInit {
  public eartagErrorList = <EartagErrorResponse[]>[];
  public error_modal_display = 'none';
  public error_message = '';
  public error_number = '';
  public isLoading = true;
  public showHiddenMessages = false;
  public page: number;

  constructor(private apiService: NSFOService, private settings: SettingsService) {
  }

  ngOnInit() {
    this.getEartagErrorList();
  }

  public getEartagErrorList() {
    this.apiService
      .doGetRequest(API_URI_GET_EARTAGS_ERRORS)
      .subscribe((res: JsonResponseModel) => {
          this.eartagErrorList = _.orderBy(res.result, ['log_date'], ['desc']);
          this.isLoading = false;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  public displayHiddenMessages() {
    this.showHiddenMessages = !this.showHiddenMessages;
  }

  public showError(event) {
    this.error_message = event.error.message;
    this.error_number = event.error.pedigree;
    this.error_number = event.error.uln;
    this.openErrorModal();
  }

  public removeEartag(event) {
    const item = <EartagErrorResponse> event;
    const index = this.eartagErrorList.indexOf(item);
    this.eartagErrorList.splice(index, 1);
  }

  public openErrorModal() {
    this.error_modal_display = 'block';
  }

  public closeErrorModal() {
    this.error_modal_display = 'none';
  }
}

