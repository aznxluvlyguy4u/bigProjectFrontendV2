import moment = require('moment');
import {Component, OnInit} from '@angular/core';
import {TranslatePipe} from '@ngx-translate/core';
import {BirthErrorRowComponent} from './birth.errors.row';

import {BirthErrorResponse} from '../birth.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_BIRTHS_ERRORS, API_URI_REVOKE_BIRTH} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Settings} from '../../../shared/variables/settings';
import {PaginationComponent} from '../../../shared/components/pagination/pagination.component';
import {HiddenMessagesFilterPipe} from '../../../shared/pipes/hiddenMessagesFilter';
import {NgxPaginationModule} from 'ngx-pagination';

@Component({
  providers: [NgxPaginationModule],
  directives: [BirthErrorRowComponent, PaginationComponent],
  templateUrl: './birth.errors.html',
  pipes: [HiddenMessagesFilterPipe]
})

export class BirthErrorsComponent implements OnInit {
  private birthErrorList = <BirthErrorResponse[]>[];
  private showHiddenMessages = false;

  constructor(private apiService: NSFOService, private settings: Settings) {
  }

  ngOnInit() {
    this.getBirthErrorList();
  }

  private getBirthErrorList() {
    this.apiService
      .doGetRequest(API_URI_GET_BIRTHS_ERRORS)
      .subscribe(res => {
          const births = <BirthErrorResponse[]> res.result;
          births.forEach((birth) => {
            birth.date_of_birth = moment(birth.date_of_birth).format(this.settings.VIEW_DATE_FORMAT);

          });
          this.birthErrorList = births; // _.orderBy(this.birthErrorList, ['log_date'], ['desc']);
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  private removeBirth(event) {
    const item = <BirthErrorResponse> event;
    const index = this.birthErrorList.indexOf(item);
    this.birthErrorList.splice(index, 1);
  }

  private displayHiddenMessages() {
    this.showHiddenMessages = !this.showHiddenMessages;
  };

}
