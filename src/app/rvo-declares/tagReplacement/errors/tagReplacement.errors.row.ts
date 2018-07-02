import {Component, EventEmitter, Input, Output} from '@angular/core';

import {TagReplacementErrorResponse} from '../tagReplacement.model';
import {API_URI_HIDE_ERROR} from '../../../shared/services/nsfo-api/nsfo.settings';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';

@Component({
  selector: '[app-tag-replacement-row]',
  templateUrl: './tagReplacement.errors.row.html',

})

export class TagReplacementErrorRowComponent {
  @Input() tagReplacement: TagReplacementErrorResponse;
  @Input() tagReplacement_index: number;

  @Output() revokeTagReplacement = new EventEmitter();

  constructor(private apiService: NSFOService) {
  }

  public sendRemoveErrorRequest() {
    const request = {
      'is_removed_by_user': true,
      'request_id': this.tagReplacement.request_id
    };

    this.apiService
      .doPutRequest(API_URI_HIDE_ERROR, request)
      .subscribe(() => {
      });
    this.revokeTagReplacement.emit(this.tagReplacement);
  }
}
