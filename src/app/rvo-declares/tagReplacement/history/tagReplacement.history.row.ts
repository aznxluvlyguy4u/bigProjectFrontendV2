import {Component, EventEmitter, Input, Output} from '@angular/core';

import {TagReplacementHistoryChangeResponse} from '../tagReplacement.model';
import {RevokeButtonComponent} from '../../../shared/components/revokebutton/revoke-button.component';

@Component({
  selector: 'app-tag-replacement-history-row',
  templateUrl: './tagReplacement.history.row.html',
  directives: [RevokeButtonComponent],

})

export class TagReplacementHistoryRowComponent {
  @Input() tagReplacement: TagReplacementHistoryChangeResponse;
  @Input() tagReplacementIndex: number;

  @Output() revokeTagReplacement = new EventEmitter();

  constructor() {
  }

  private sendRevokeRequest() {
    this.revokeTagReplacement.emit(this.tagReplacement);
  }
}
