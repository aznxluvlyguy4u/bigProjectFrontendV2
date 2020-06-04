import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_TREATMENT_TEMPLATES} from '../../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {PaginationService} from 'ngx-pagination';
import {ErrorMessage} from '../../../shared/models/error-message.model';
import {JsonResponseModel} from '../../../shared/models/json-response.model';
import {CacheService} from '../../../shared/services/settings/cache.service';
import {TreatmentTemplate} from '../../../shared/models/treatment-template.model';
import {TreatmentService} from '../treatment.service';
import {Subscription} from 'rxjs';

@Component({
  providers: [PaginationService],
  templateUrl: './treatment.history.html',
})

export class TreatmentHistoryComponent implements OnInit, OnDestroy {

  private treatmentTemplatesSubscription: Subscription;
  public treatmentHistoryList = <TreatmentTemplate[]>[];
  public treatmentTemplates = <TreatmentTemplate[]>[];
  public selectedTreatment: TreatmentTemplate;
  public isSending = false;
  public modal_display = 'none';
  public medicine_modal_display = [];
  public animal_modal_display = [];
  public errorModalDisplay = 'none';
  public errorMessages: ErrorMessage[] = [];
  private currentLocationUbn;

  public isLoading: boolean;

  public page: number;
  public searchValue: string;

  public totalTreatments: number;

  constructor(
    private apiService: NSFOService,
    private settings: SettingsService,
    private treatmentService: TreatmentService,
    private cache: CacheService
  ) {
    this.currentLocationUbn = this.cache.getUbn();
  }

  ngOnInit() {
    this.getTreatmentHistoryList();

    this.treatmentTemplatesSubscription = this.treatmentService.treatmentTemplatesChanged.subscribe(
      (templates: TreatmentTemplate[]) => {
        this.treatmentTemplates = templates;
      }
    );
    this.treatmentTemplates = this.treatmentService.getTreatmentTemplates();
  }

  ngOnDestroy(): void {
    this.treatmentTemplatesSubscription.unsubscribe();
  }

  public getTreatmentHistoryList(page = 1) {
    this.isLoading = true;

    this.page = page;

    let queryParam = '?page=' + this.page;

    if (this.searchValue && this.searchValue.length >= 2) {
      queryParam += `&query=${this.searchValue}`;
    }

    this.apiService
      .doGetRequest(API_URI_GET_TREATMENT_TEMPLATES + '/historic' + queryParam)
      .subscribe(
          (res: JsonResponseModel) => {
            const treatments: TreatmentTemplate[] = res.result.items;
            this.totalTreatments = res.result.totalItems;
            for (const treatment of treatments) {
              treatment.start_date = moment(treatment.start_date).format(this.settings.getViewDateFormat());
              treatment.end_date = moment(treatment.end_date).format(this.settings.getViewDateFormat());
              treatment.create_date = moment(treatment.create_date).format(this.settings.getViewDateTimeFormat());
            }
            this.treatmentHistoryList = _.orderBy(treatments, ['create_date'], ['desc']);
            this.treatmentHistoryList.forEach((treatment) => {
                this.medicine_modal_display[treatment.id] = 'none';
                this.animal_modal_display[treatment.id] = 'none';
            });
            this.isLoading = false;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
          this.isLoading = false;
        }
      );
  }

  public formatDate(date) {
    // console.log(date);
    return moment(date).format('DD-MM-YYYY');
  }

  public revokeTreatment() {
    this.isSending = true;
    this.apiService
      .doPutRequest(API_URI_GET_TREATMENT_TEMPLATES + '/' + this.selectedTreatment.id + '/revoke', '')
      .subscribe(
        () => {
          this.isSending = false;
          this.closeModal();

          this.selectedTreatment.status = 'REVOKED';
          this.selectedTreatment.revoke_date = moment().toISOString();

          const index = _.findIndex(this.treatmentHistoryList, {id: this.selectedTreatment.id});
          this.treatmentHistoryList.splice(index, 1, this.selectedTreatment);
        },
        () => {
          this.isSending = false;
          this.closeModal();
        }
      );
  }

  public selectTreatment(event) {
    this.selectedTreatment = <TreatmentTemplate> event;
    this.openModal();
  }

  public openModal(type= 'default', treatment_id = 0) {
    switch (type) {
      case 'default':
        this.modal_display = 'block';
        break;
      case 'medicine':
        this.medicine_modal_display[treatment_id] = 'block';
        break;
      case 'animal':
        this.animal_modal_display[treatment_id] = 'block';
        break;
    }
  }

  public closeModal(type = 'default', treatment_id = 0) {
    switch (type) {
      case 'default':
        this.modal_display = 'none';
        break;
      case 'medicine':
        this.medicine_modal_display[treatment_id] = 'none';
        break;
      case 'animal':
        this.animal_modal_display[treatment_id] = 'none';
        break;
    }
  }

  public showError(event) {
    const result = event.result;
    this.errorMessages = [];
    let errorMessage = {
      code: 403,
      message: 'SOMETHING WENT WRONG! TRY AGAIN AT LATER TIME!'
    };

    if (result.code && result.message) {
      errorMessage = {
        code: result.code,
        message: result.message
      };
    }

    this.errorMessages.push(errorMessage);
    this.openErrorModal();
  }

  public openErrorModal() {
    this.errorModalDisplay = 'block';
  }

  public closeErrorModal() {
    this.errorModalDisplay = 'none';
  }
}
