import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {EartagChangeResponse} from '../eartag.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {API_URI_GET_EARTAGS_HISTORY, API_URI_REVOKE_DECLARATION} from '../../../shared/services/nsfo-api/nsfo.settings';
import {PaginationService} from 'ngx-pagination';
import {JsonResponseModel} from '../../../shared/models/json-response.model';
import {CacheService} from '../../../shared/services/settings/cache.service';

@Component({
  providers: [PaginationService],
  templateUrl: './eartag.history.html',
})

export class EartagHistoryComponent implements OnInit {
  public eartagHistoryList = <EartagChangeResponse[]>[];
  public selected_eartag: EartagChangeResponse;
  public searchValue = '';
  public modal_display = 'none';
  public error_modal_display = 'none';
  public error_message = '';
  public error_number = '';
  public isLoading = true;
  public page: number;

  constructor(private apiService: NSFOService, private settings: SettingsService, private cache: CacheService) {
  }

  ngOnInit() {
    this.getEartaglHistoryList();
  }

  public getEartaglHistoryList() {
    this.apiService
      .doGetRequest(API_URI_GET_EARTAGS_HISTORY)
      .subscribe((res: JsonResponseModel) => {
          const eartags = res.result;

          for (const eartag of eartags) {
            eartag.uln = eartag.uln_country_code + eartag.uln_number;
            eartag.ulnLastFive = eartag.uln.substr(eartag.uln.length - 5);
          }

          this.eartagHistoryList = _.orderBy(eartags, ['log_date'], ['desc']);
          this.isLoading = false;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        });
  }

  public selectEartag(event) {
    this.selected_eartag = <EartagChangeResponse> event;
    this.openModal();
  }

  public showError(event) {
    this.error_message = event.error.message;
    this.error_number = event.error.pedigree;
    this.error_number = event.error.uln;
    this.openErrorModal();
  }

  public openModal() {
    this.modal_display = 'block';
  }

  public closeModal() {
    this.modal_display = 'none';
  }

  public openErrorModal() {
    this.error_modal_display = 'block';
  }

  public closeErrorModal() {
    this.error_modal_display = 'none';
  }

  public revokeEartag() {
    const originalRequestState = this.selected_eartag.request_state;
    this.selected_eartag.request_state = 'REVOKING';
    this.apiService
      .doPostRequest(API_URI_REVOKE_DECLARATION, this.selected_eartag)
      .subscribe(
        () => {
          this.selected_eartag.request_state = this.cache.useRvoLogic() ? 'REVOKING' : 'REVOKED';
        },
        error => {
          this.selected_eartag.request_state = originalRequestState;
          alert(this.apiService.getErrorMessage(error));
        }
      );
    this.closeModal();
  }
}
