import * as moment from 'moment';
import {Component, OnInit} from '@angular/core';
import {BirthErrorResponse} from '../birth.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_BIRTHS_ERRORS, API_URI_REVOKE_BIRTH} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Settings} from '../../../shared/variables/settings';
import {NgxPaginationModule} from 'ngx-pagination';

@Component({
  providers: [NgxPaginationModule],
  templateUrl: './birth.errors.html',
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
          const births = <BirthErrorResponse[]> res.json().result;
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
