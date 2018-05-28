import moment = require('moment');
import * as _ from 'lodash';

import {Component, OnInit} from '@angular/core';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {API_URI_GET_TAG_REPLACEMENT_ERRORS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {TagReplacementErrorResponse} from '../tagReplacement.model';

import {TagReplacementErrorRowComponent} from './tagReplacement.errors.row';
import {PaginationComponent} from '../../../shared/components/pagination/pagination.component';
import {NgxPaginationModule} from 'ngx-pagination';

@Component({
  providers: [NgxPaginationModule],
  directives: [TagReplacementErrorRowComponent, PaginationComponent],
  templateUrl: './tagReplacement.errors.html',
})

export class TagReplacementErrorsComponent implements OnInit {
  private tagReplacementErrorList = <TagReplacementErrorResponse[]>[];
  private isLoading = true;
  private showHiddenMessages = false;

  constructor(private nsfo: NSFOService, private settings: SettingsService) {
  }

  ngOnInit() {
    this.getTagReplacementErrorList();
  }

  private getTagReplacementErrorList() {
    this.nsfo
      .doGetRequest(API_URI_GET_TAG_REPLACEMENT_ERRORS)
      .subscribe(
        res => {
          const tagReplacements = <TagReplacementErrorResponse[]> res.result;

          for (const tagReplacement of tagReplacements) {
            tagReplacement.log_date = moment(tagReplacement.log_date).format(this.settings.getViewDateTimeFormat());
            tagReplacement.uln = tagReplacement.uln_country_code + tagReplacement.uln_number;
            this.tagReplacementErrorList.push(tagReplacement);
          }

          this.tagReplacementErrorList = _.orderBy(this.tagReplacementErrorList, ['log_date'], ['desc']);
          this.isLoading = false;
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
        });
  }

  private revokeTagReplacement(event) {
    const item = <TagReplacementErrorResponse> event;
    item.is_removed_by_user = true;
    this.tagReplacementErrorList = _.orderBy(this.tagReplacementErrorList, ['log_date'], ['desc']);
  }

  private displayHiddenMessages() {
    this.showHiddenMessages = !this.showHiddenMessages;
  }
}

