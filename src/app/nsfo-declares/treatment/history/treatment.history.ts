import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_TREATMENT_TEMPLATES} from '../../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {PaginationService} from 'ngx-pagination';
import {MateChangeResponse} from '../../../shared/models/nsfo-declare.model';
import {ErrorMessage} from '../../../shared/models/error-message.model';
import {JsonResponseModel} from '../../../shared/models/json-response.model';
import {CacheService} from '../../../shared/services/settings/cache.service';
import {TreatmentTemplate} from '../../../shared/models/treatment-template.model';

@Component({
  providers: [PaginationService],
  templateUrl: './treatment.history.html',
})

export class TreatmentHistoryComponent implements OnInit {

  searchValue: string;
  public treatmentHistoryList = <TreatmentTemplate[]>[];
  public treatmentTemplates = <TreatmentTemplate[]>[];
  public selectedTreatment: TreatmentTemplate;
  public isSending = false;
  public modal_display = 'none';
  public errorModalDisplay = 'none';
  public errorMessages: ErrorMessage[] = [];
  private currentLocationUbn;

  public isLoading: boolean;

  constructor(
    private apiService: NSFOService,
    private settings: SettingsService,
    private cache: CacheService,
    private nsfo: NSFOService
  ) {
    this.currentLocationUbn = this.cache.getUbn();
  }

  ngOnInit() {
    this.getTreatmentHistoryList();
    this.getTreatmentTemplates();
  }

  public getTreatmentHistoryList() {
    this.isLoading = true;
    this.apiService
      .doGetRequest(API_URI_GET_TREATMENT_TEMPLATES + '/historic?minimal_output=true')
      .subscribe(
          (res: JsonResponseModel) => {
            const treatments = <TreatmentTemplate[]>res.result;
            for (const treatment of treatments) {
              treatment.start_date = moment(treatment.start_date).format(this.settings.getViewDateFormat());
              treatment.end_date = moment(treatment.end_date).format(this.settings.getViewDateFormat());
              treatment.create_date = moment(treatment.create_date).format(this.settings.getViewDateTimeFormat());
            }
            this.treatmentHistoryList = _.orderBy(treatments, ['create_date'], ['desc']);
            this.isLoading = false;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
          this.isLoading = false;
        }
      );
  }

  getTreatmentTemplates() {
    this.nsfo
      .doGetRequest(API_URI_GET_TREATMENT_TEMPLATES + '/template/individual/' + this.currentLocationUbn)
      .subscribe(
        (res: JsonResponseModel) => {
          this.treatmentTemplates = res.result;
        }
      );

    this.nsfo
      .doGetRequest(API_URI_GET_TREATMENT_TEMPLATES + '/template/location/' + this.currentLocationUbn)
      .subscribe(
        (res: JsonResponseModel) => {
          for (let x = 0; x < res.result.length; x++) {
            this.treatmentTemplates.push(res.result[x]);
          }
        }
      );

    this.nsfo
      .doGetRequest(API_URI_GET_TREATMENT_TEMPLATES + '/template/individual')
      .subscribe(
        (res: JsonResponseModel) => {
          for (let x = 0; x < res.result.length; x++) {
            this.treatmentTemplates.push(res.result[x]);
          }
        }
      );

    this.nsfo
      .doGetRequest(API_URI_GET_TREATMENT_TEMPLATES + '/template/location')
      .subscribe(
        (res: JsonResponseModel) => {
          for (let x = 0; x < res.result.length; x++) {
            this.treatmentTemplates.push(res.result[x]);
          }
        }
      );
  }

  public revokeMate() {
    // this.isSending = true;
    // this.apiService
    //   .doPutRequest(API_URI_REVOKE_MATE + '/' + this.selectedAnimal.message_id, '')
    //   .subscribe(
    //     res => {
    //       this.isSending = false;
    //       this.closeModal();
    //
    //       this.selectedAnimal.request_state = 'REVOKED';
    //       this.selectedAnimal.revoke_date = moment().toISOString();
    //
    //       const index = _.findIndex(this.mateHistoryList, {message_id: this.selectedAnimal.message_id});
    //       this.mateHistoryList.splice(index, 1, this.selectedAnimal);
    //     },
    //     err => {
    //       this.isSending = false;
    //       this.closeModal();
    //     }
    //   );
  }

  public selectTreatment(event) {
    this.selectedTreatment = <TreatmentTemplate> event;
    this.openModal();
  }

  public openModal() {
    this.modal_display = 'block';
  }

  public closeModal() {
    this.modal_display = 'none';
  }

  public showError(event) {
    this.errorMessages = event.result;

    if (this.errorMessages.length === 0) {
      const errorMessage = {
        code: 403,
        message: 'SOMETHING WENT WRONG! TRY AGAIN AT LATER TIME!'
      };
      this.errorMessages.push(errorMessage);
    }

    this.openErrorModal();
  }

  public openErrorModal() {
    this.errorModalDisplay = 'block';
  }

  public closeErrorModal() {
    this.errorModalDisplay = 'none';
  }
}
