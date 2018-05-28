import * as _ from 'lodash';
import {Component} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';

import {BirthHistoryRow} from './birth.history.row';

import {BirthChangeResponse, Litter} from '../birth.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {
  API_URI_GET_BIRTHS_HISTORY,
  API_URI_REVOKE_BIRTH,
  API_URI_REVOKE_DECLARATION
} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Settings} from '../../../shared/variables/settings';
import {PaginationComponent} from '../../../shared/components/pagination/pagination.component';
import {BirthHistoryPipe} from './pipes/birth.history.pipe';

@Component({
  providers: [NgxPaginationModule],
  directives: [BirthHistoryRow, FORM_DIRECTIVES, PaginationComponent],
  templateUrl: './birth.history.html',
  pipes: [BirthHistoryPipe]
})

export class BirthHistoryComponent {
  private litters = <Litter[]>[];
  private modalDisplay = 'none';
  private selectedLitter: Litter;
  private modal_display: string;

  constructor(private nsfo: NSFOService, private settings: Settings) {
  }

  ngOnInit() {
    this.getBirthHistoryList();
  }

  private getBirthHistoryList() {
    this.nsfo
      .doGetRequest(API_URI_GET_BIRTHS_HISTORY)
      .subscribe(res => {
          this.litters = <Litter[]> res.result;
          this.litters = _.orderBy(this.litters, ['log_date'], ['desc']);
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
        }
      );
  }

  private selectLitter(event) {
    this.selectedLitter = <Litter> event;
    this.openModal();
  }

  private openModal() {
    this.modal_display = 'block';
  }

  private closeModal() {
    this.modal_display = 'none';
  }

  private revokeLitter() {
    const originalRequestState = this.selectedLitter.request_state;
    this.selectedLitter.request_state = 'REVOKING';

    let jsonpayload = {
      litter_id: this.selectedLitter.litter_id
    };

    this.nsfo
      .doPostRequest(API_URI_REVOKE_BIRTH, jsonpayload)
      .subscribe(
        () => {
          this.selectedLitter.request_state = 'REVOKING';
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
          this.selectedLitter.request_state = originalRequestState;
        }
      );
    this.closeModal();

  }

}
