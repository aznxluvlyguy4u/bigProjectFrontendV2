import * as moment from 'moment';
import * as _ from 'lodash';

import {Component, EventEmitter, OnInit} from '@angular/core';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {API_URI_GET_TAG_REPLACEMENT_ERRORS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {TagReplacementErrorResponse} from '../tagReplacement.model';

import {NgxPaginationModule} from 'ngx-pagination';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

@Component({
  providers: [NgxPaginationModule],
  templateUrl: './tagReplacement.errors.html',
})

export class TagReplacementErrorsComponent implements OnInit {
  public tagReplacementErrorList = <TagReplacementErrorResponse[]>[];
  public isLoading = true;
  public showHiddenMessages = false;
  public page: number;

  constructor(private nsfo: NSFOService, private settings: SettingsService) {
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

          this.tagReplacementErrorList = _.orderBy(this.tagReplacementErrorList, ['log_date'], ['desc']);
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

