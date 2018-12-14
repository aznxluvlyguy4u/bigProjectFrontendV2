import * as moment from 'moment';
import * as _ from 'lodash';

import {Component, EventEmitter, OnInit} from '@angular/core';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {API_URI_GET_TAG_REPLACEMENT_ERRORS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {TagReplacementErrorResponse} from '../tagReplacement.model';

import {PaginationService} from 'ngx-pagination';
import {JsonResponseModel} from '../../../shared/models/json-response.model';
import {SortOrder, SortService} from '../../../shared/services/utils/sort.service';

@Component({
  providers: [PaginationService],
  templateUrl: './tagReplacement.errors.html',
})

export class TagReplacementErrorsComponent implements OnInit {
  public tagReplacementErrorList = <TagReplacementErrorResponse[]>[];
  public isLoading = true;
  public showHiddenMessages = false;
  public page: number;

  constructor(private nsfo: NSFOService, private settings: SettingsService, private sort: SortService) {
  }

  ngOnInit() {
    this.getTagReplacementErrorList();
  }

  public getTagReplacementErrorList() {
    this.nsfo
      .doGetRequest(API_URI_GET_TAG_REPLACEMENT_ERRORS)
      .subscribe(
          (res: JsonResponseModel) => {
          const tagReplacements = <TagReplacementErrorResponse[]> res.result;

          for (const tagReplacement of tagReplacements) {
            tagReplacement.log_date = moment(tagReplacement.log_date).format(this.settings.getViewDateTimeFormat());
            tagReplacement.uln = tagReplacement.uln_country_code + tagReplacement.uln_number;
            this.tagReplacementErrorList.push(tagReplacement);
          }

          const sortOrder: SortOrder = {
            variableName: 'log_date',
            ascending: false,
            isDate: true // it is date string, not a date
          };

          this.tagReplacementErrorList = this.sort.sort(this.tagReplacementErrorList, [sortOrder]);
          this.isLoading = false;
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
        });
  }

  public revokeTagReplacement(event) {
    const item = <TagReplacementErrorResponse> event;
    item.is_removed_by_user = true;
    this.tagReplacementErrorList = _.orderBy(this.tagReplacementErrorList, ['log_date'], ['desc']);
  }

  public displayHiddenMessages() {
    this.showHiddenMessages = !this.showHiddenMessages;
  }
}

