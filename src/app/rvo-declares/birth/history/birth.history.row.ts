import moment = require('moment');

import {Component, EventEmitter, Input, Output} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {Datepicker} from '../../../shared/components/datepicker/datepicker.component';
import {Litter, LitterDetails} from '../birth.model';
import {Settings} from '../../../shared/variables/settings';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_BIRTH_DETAILS} from '../../../shared/services/nsfo-api/nsfo.settings';

declare var $;

@Component({
  selector: 'tr',
  providers: [FORM_PROVIDERS],
  directives: [Datepicker],
  templateUrl: './birth.history.row.html',

})

export class BirthHistoryRow {
  @Input('litter-object') litter: Litter;
  @Output() revokeLitter = new EventEmitter();
  private modalDisplay = 'none';
  private litterDetails: LitterDetails = new LitterDetails();

  constructor(private settings: Settings, private nsfo: NSFOService) {
  }

  private sendRevokeRequest() {
    this.revokeLitter.emit(this.litter);
  }

  private getLitterDetails() {
    this.nsfo.doGetRequest(API_URI_GET_BIRTH_DETAILS + '/' + this.litter.litter_id)
      .subscribe(
        res => {
          this.litterDetails = res.result;
          // for(let child of this.litterDetails.children) {
          //     child.error_message = 'test ' + child.uln_number;
          // }
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
        }
      );
  }

  private openModal() {
    this.modalDisplay = 'block';
  }

  private closeModal() {
    this.modalDisplay = 'none';
  }

  private stringAsViewDateTime(date) {
    return moment(date).format(this.settings.VIEW_DATETIME_FORMAT);
  }

  private stringAsViewDate(date) {
    return moment(date).format(this.settings.VIEW_DATE_FORMAT);
  }

  private loadPopup(child) {
    if (!child.isLoadedPopUp) {
      $('#popup-' + child.uln_number).foundation();
      child.isLoadedPopUp = true;
    }
  }

  private textify(bool: boolean) {
    if (bool) {
      return 'YES';
    }
    return 'NO';
  }
}
