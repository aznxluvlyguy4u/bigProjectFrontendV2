import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';

import {Litter} from '../birth.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {
  API_URI_GET_BIRTHS_HISTORY,
  API_URI_REVOKE_BIRTH,
} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Settings} from '../../../shared/variables/settings';
import {NgxPaginationModule} from 'ngx-pagination';
import {JsonResponseModel} from '../../../shared/models/json-response.model';
import {CacheService} from '../../../shared/services/settings/cache.service';

@Component({
  providers: [NgxPaginationModule],
  templateUrl: './birth.history.html',
})

export class BirthHistoryComponent implements OnInit {
  public litters = <Litter[]>[];
  public modalDisplay = 'none';
  public selectedLitter: Litter;
  public modal_display: string;
  public page: number;
  public searchValue: string;

  public isLoading: boolean;

  constructor(private nsfo: NSFOService, private cache: CacheService) {
  }

  ngOnInit() {
    this.getBirthHistoryList();
  }

  public getBirthHistoryList() {
    this.isLoading = true;
    this.nsfo
      .doGetRequest(API_URI_GET_BIRTHS_HISTORY)
      .subscribe((res: JsonResponseModel) => {
          this.litters = <Litter[]> res.result;
          this.litters = _.orderBy(this.litters, ['log_date'], ['desc']);
          this.isLoading = false;
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
          this.isLoading = false;
        }
      );
  }

  public selectLitter(event) {
    this.selectedLitter = <Litter> event;
    this.openModal();
  }

  public openModal() {
    this.modal_display = 'block';
  }

  public closeModal() {
    this.modal_display = 'none';
  }

  public revokeLitter() {
    const originalRequestState = this.selectedLitter.request_state;
    this.selectedLitter.request_state = 'REVOKING';

    const jsonpayload = {
      litter_id: this.selectedLitter.litter_id
    };

    this.nsfo
      .doPostRequest(API_URI_REVOKE_BIRTH, jsonpayload)
      .subscribe(
        () => {
          this.selectedLitter.request_state = this.cache.useRvoLogic() ? 'REVOKING' : 'REVOKED';
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
          this.selectedLitter.request_state = originalRequestState;
        }
      );
    this.closeModal();

  }

}
