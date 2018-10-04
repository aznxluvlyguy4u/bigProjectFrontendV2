import * as moment from 'moment';
import * as _ from 'lodash';

import {Component, OnInit} from '@angular/core';

import {PaginationComponent} from '../../../shared/components/pagination/pagination.component';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {TagReplacementHistoryChangeResponse} from '../tagReplacement.model';
import {API_URI_GET_TAG_REPLACEMENT_HISTORY, API_URI_REVOKE_DECLARATION} from '../../../shared/services/nsfo-api/nsfo.settings';
import {TagReplacementHistoryRowComponent} from './tagReplacement.history.row';
import {NgxPaginationModule} from 'ngx-pagination';
import {JsonResponseModel} from '../../../shared/models/json-response.model';
import {CacheService} from '../../../shared/services/settings/cache.service';

@Component({
  providers: [NgxPaginationModule],
  templateUrl: './tagReplacement.history.html',
})

export class TagReplacementHistoryComponent implements OnInit {
  public tagReplacementHistoryList = <TagReplacementHistoryChangeResponse[]>[];
  public selectedTagReplacement: TagReplacementHistoryChangeResponse;
  public modalDisplay = 'none';
  public isLoading = true;
  public page: number;
  public searchValue: string;

  constructor(private nsfo: NSFOService, private settings: SettingsService, private cache: CacheService) {
  }

  ngOnInit() {
    this.getTagReplacementHistoryList();
  }

  public getTagReplacementHistoryList() {
    this.nsfo
      .doGetRequest(API_URI_GET_TAG_REPLACEMENT_HISTORY)
      .subscribe(
          (res: JsonResponseModel) => {
          const tagReplacements = <TagReplacementHistoryChangeResponse[]> res.result;

          for (const tagReplacement of tagReplacements) {
            tagReplacement.log_date = moment(tagReplacement.log_date).format(this.settings.getViewDateTimeFormat());
            tagReplacement.animal.uln = tagReplacement.animal.uln_country_code + tagReplacement.animal.uln_number;
            tagReplacement.tag.uln = tagReplacement.tag.uln_country_code + tagReplacement.tag.uln_number;
            this.tagReplacementHistoryList.push(tagReplacement);
          }

          this.tagReplacementHistoryList = _.orderBy(this.tagReplacementHistoryList, ['log_date'], ['desc']);
          this.isLoading = false;
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
        });
  }

  public selectTagReplacement(event) {
    this.selectedTagReplacement = <TagReplacementHistoryChangeResponse> event;
    this.openModal();
  }

  public openModal() {
    this.modalDisplay = 'block';
  }

  public closeModal() {
    this.modalDisplay = 'none';
  }

  public revokeTagReplacement() {
    const originalRequestState = this.selectedTagReplacement;
    this.selectedTagReplacement.request_state = 'REVOKING';
    this.nsfo
      .doPostRequest(API_URI_REVOKE_DECLARATION, this.selectedTagReplacement)
      .subscribe(
        () => {
          this.selectedTagReplacement.request_state = this.cache.useRvoLogic() ? 'REVOKING' : 'REVOKED';
        },
        error => {
          this.selectedTagReplacement = originalRequestState;
          alert(this.nsfo.getErrorMessage(error));
        }
      );
    this.closeModal();
  }
}
