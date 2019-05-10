import * as moment from 'moment';

import {Component, EventEmitter, Input, Output} from '@angular/core';

import {Litter, LitterDetails} from '../birth.model';
import {Settings} from '../../../shared/variables/settings';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_BIRTH_DETAILS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {JsonResponseModel} from '../../../shared/models/json-response.model';
import {SettingsService} from '../../../shared/services/settings/settings.service';

declare var $;

@Component({
  selector: '[app-birth-history-row]',
  templateUrl: './birth-history-row.component.html',
})

export class BirthHistoryRowComponent {
  @Input('litter-object') litter: Litter;
  @Input('allow-forced-revokes') allowForcedRevokes = false;
  @Output() revokeLitter = new EventEmitter();
  public modalDisplay = 'none';
  public litterDetails: LitterDetails = new LitterDetails();

  public isLoadingDetails: boolean;

  constructor(private nsfo: NSFOService,
              private settings: Settings,
              private settingsService: SettingsService
  ) {}

  private sendRevokeRequest() {
    this.revokeLitter.emit(this.litter);
  }

  public getLitterDetails() {
    this.isLoadingDetails = true;
    this.nsfo.doGetRequest(API_URI_GET_BIRTH_DETAILS + '/' + this.litter.litter_id)
      .subscribe(
          (res: JsonResponseModel) => {
          this.litterDetails = res.result;
          // for(let child of this.litterDetails.children) {
          //     child.error_message = 'test ' + child.uln_number;
          // }
          this.isLoadingDetails = false;
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
          this.isLoadingDetails = false;
        }
      );
  }

  public openModal() {
    this.modalDisplay = 'block';
  }

  public closeModal() {
    this.modalDisplay = 'none';
  }

  public stringAsViewDateTime(date) {
    return moment(date).format(this.settings.VIEW_DATETIME_FORMAT);
  }

  public stringAsViewDate(date) {
    return moment(date).format(this.settings.VIEW_DATE_FORMAT);
  }

  public loadPopup(child) {
    if (!child.isLoadedPopUp) {
      $('#popup-' + child.uln_number).foundation();
      child.isLoadedPopUp = true;
    }
  }

  public textify(bool: boolean) {
    if (bool) {
      return 'YES';
    }
    return 'NO';
  }

  public isRevokeButtonActive(): boolean {
    return this.allowStandardRevoke() || this.allowForcedRevokesByButton();
  }

  private allowStandardRevoke(): boolean {
    return this.litter.request_state !== 'OPEN' &&
           this.litter.request_state !== 'REVOKING' &&
           this.litter.request_state !== 'REVOKED'
      ;
  }

  private allowForcedRevokesByButton(): boolean {
    return this.allowForcedRevokes &&
           this.settingsService.isAdmin() &&
           this.litter.request_state !== 'REVOKED' &&
           this.isLitterCreationOneDayOldOrOlder()
      ;
  }

  private isLitterCreationOneDayOldOrOlder(): boolean {
    const logDateString = this.litter.log_date;
    if (logDateString !== undefined && logDateString !== null && logDateString !== '') {
      const logDate = new Date(logDateString);
      return logDate <= this.yesterday();
    }
    return true;
  }

  private yesterday(): Date {
    const maxLogDate = new Date();
    maxLogDate.setDate(maxLogDate.getDate() - 1);
    return maxLogDate;
  }
}
