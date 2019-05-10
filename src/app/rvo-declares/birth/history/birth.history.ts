import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';

import {Litter} from '../birth.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {
  API_URI_GET_BIRTHS_HISTORY,
  API_URI_REVOKE_BIRTH,
} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Settings} from '../../../shared/variables/settings';
import {PaginationService} from 'ngx-pagination';
import {JsonResponseModel} from '../../../shared/models/json-response.model';
import {CacheService} from '../../../shared/services/settings/cache.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';

@Component({
  providers: [PaginationService],
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
  public allowForcedRevokes: boolean;

  constructor(private cache: CacheService,
              private nsfo: NSFOService,
              private settingsService: SettingsService
  ) {}

  ngOnInit() {
    this.getBirthHistoryList();
    this.allowForcedRevokes = false;
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
    this.selectedLitter.isRevokeButtonClicked = true;

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
          this.selectedLitter.isRevokeButtonClicked = false;
        }
      );
    this.closeModal();

  }

  public showForcedRevokeOption(): boolean {
    return this.settingsService.isAdmin();
  }
}
