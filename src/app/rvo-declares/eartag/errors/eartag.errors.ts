import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';


import {PaginationComponent} from '../../../shared/components/pagination/pagination.component';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {EartagErrorResponse} from '../eartag.model';
import {EartagErrorRowComponent} from './eartag.errors.row';
import {API_URI_GET_EARTAGS_ERRORS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {NgxPaginationModule} from 'ngx-pagination';

@Component({
  providers: [NgxPaginationModule],
  directives: [EartagErrorRowComponent, PaginationComponent],
  templateUrl: './eartag.errors.html',
})

export class EartagErrorsComponent implements OnInit {
  private eartagErrorList = <EartagErrorResponse[]>[];
  private error_modal_display = 'none';
  private error_message = '';
  private error_number = '';
  private isLoading = true;
  private showHiddenMessages = false;

  constructor(private apiService: NSFOService, private settings: SettingsService) {
  }

  ngOnInit() {
    this.getEartagErrorList();
  }

  private getEartagErrorList() {
    this.apiService
      .doGetRequest(API_URI_GET_EARTAGS_ERRORS)
      .subscribe(res => {
          this.eartagErrorList = _.orderBy(res.result, ['log_date'], ['desc']);
          this.isLoading = false;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
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

  private removeEartag(event) {
    const item = <EartagErrorResponse> event;
    const index = this.eartagErrorList.indexOf(item);
    this.eartagErrorList.splice(index, 1);
  }

  private openErrorModal() {
    this.error_modal_display = 'block';
  }

  private closeErrorModal() {
    this.error_modal_display = 'none';
  }
}

