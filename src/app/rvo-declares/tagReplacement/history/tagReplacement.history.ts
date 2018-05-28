import moment = require('moment');
import * as _ from 'lodash';

import {Component, OnInit} from '@angular/core';

import {PaginationComponent} from '../../../shared/components/pagination/pagination.component';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {TagReplacementHistoryChangeResponse} from '../tagReplacement.model';
import {API_URI_GET_TAG_REPLACEMENT_HISTORY, API_URI_REVOKE_DECLARATION} from '../../../shared/services/nsfo-api/nsfo.settings';
import {TagReplacementHistoryRowComponent} from './tagReplacement.history.row';
import {NgxPaginationModule} from 'ngx-pagination';

@Component({
  providers: [NgxPaginationModule],
  directives: [TagReplacementHistoryRowComponent, PaginationComponent],
  templateUrl: './tagReplacement.history.html',
})

export class TagReplacementHistoryComponent implements OnInit {
  private tagReplacementHistoryList = <TagReplacementHistoryChangeResponse[]>[];
  private selectedTagReplacement: TagReplacementHistoryChangeResponse;
  private modalDisplay = 'none';
  private isLoading = true;

  constructor(private nsfo: NSFOService, private settings: SettingsService) {
  }

  ngOnInit() {
    this.getTagReplacementHistoryList();
  }

  private getTagReplacementHistoryList() {
    this.nsfo
      .doGetRequest(API_URI_GET_TAG_REPLACEMENT_HISTORY)
      .subscribe(
        res => {
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

  private selectTagReplacement(event) {
    this.selectedTagReplacement = <TagReplacementHistoryChangeResponse> event;
    this.openModal();
  }

  private openModal() {
    this.modalDisplay = 'block';
  }

  private closeModal() {
    this.modalDisplay = 'none';
  }

  private revokeTagReplacement() {
    this.nsfo
      .doPostRequest(API_URI_REVOKE_DECLARATION, this.selectedTagReplacement)
      .subscribe(
        () => {
          this.selectedTagReplacement.request_state = 'REVOKING';
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
        }
      );
    this.closeModal();
  }
}
