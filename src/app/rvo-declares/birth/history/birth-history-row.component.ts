import * as moment from 'moment';

import {Component, EventEmitter, Input, Output} from '@angular/core';

import {Litter, LitterDetails} from '../birth.model';
import {Settings} from '../../../shared/variables/settings';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_BIRTH_DETAILS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

declare var $;

@Component({
  selector: '[app-birth-history-row]',
  templateUrl: './birth-history-row.component.html',
})

export class BirthHistoryRowComponent {
  @Input('litter-object') litter: Litter;
  @Output() revokeLitter = new EventEmitter();
  public modalDisplay = 'none';
  public litterDetails: LitterDetails = new LitterDetails();

  public isLoadingDetails: boolean;

  constructor(private settings: Settings, private nsfo: NSFOService) {
  }

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
}
