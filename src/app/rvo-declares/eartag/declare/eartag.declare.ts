import * as _ from 'lodash';
import * as moment from 'moment';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';

import {EartagRequest, EartagStatusOverviewResponse, EartagTransfer} from '../eartag.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {UBNValidator} from '../../../shared/validation/nsfo-validation';
import {
  API_URI_GET_EARTAGS,
  API_URI_SYNC_EARTAGS,
  API_URI_TRANSFER_EARTAGS
} from '../../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {NgxPaginationModule} from 'ngx-pagination';
import {User} from '../../../shared/models/person.model';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

@Component({
  providers: [NgxPaginationModule],
  templateUrl: './eartag.declare.html',
})

export class EartagDeclareComponent implements OnInit, OnDestroy {
  areRecurrentApiCallsActivated = true;
  eartagStatusOverview: EartagStatusOverviewResponse;
  birthDeclaresInProgress: number;
  birthRevokesInProgress: number;
  areBirthsInProgress: boolean;
  statusHasBeenRetrieved: boolean;
  private eartags_list = [];
  private selected_eartags_list = <EartagRequest[]> [];
  private selected_eartag: EartagRequest;
  private sync_in_progress = false;
  private form_valid = true;
  private form_single_valid = true;
  private form: FormGroup;
  private form_single_tag: FormGroup;
  private modal_display = 'none';
  private modal_all_display = 'none';
  private all_eartags_in_progress = false;
  private eartag_in_progress = false;
  private order_column_uln_asc = true;
  private error_message = '';
  private loopGetEartagsSyncStatusOverview = true;

  private loopSyncEartagsList = true;

  constructor(private apiService: NSFOService,
              private fb: FormBuilder,
              private translate: TranslateService,
              private settings: SettingsService) {
    this.form = fb.group({
      ubn_new_owner: new FormControl('', Validators.compose([UBNValidator.validateWithSevenTest, Validators.required]))
    });

    this.form_single_tag = fb.group({
      ubn_new_owner: new FormControl('', Validators.compose([UBNValidator.validateWithSevenTest, Validators.required]))
    });
  }

  ngOnInit() {
    this.getEartagsList();
    this.getEartagsSyncStatusOverview();
    this.areRecurrentApiCallsActivated = true;
    this.birthDeclaresInProgress = 0;
    this.birthRevokesInProgress = 0;
    this.areBirthsInProgress = false;
    this.statusHasBeenRetrieved = false;
  }

  ngOnDestroy() {
    this.areRecurrentApiCallsActivated = false;
  }

  getBirthsInProgressMessage(): string {
    const birthDeclareMessage = this.birthDeclaresInProgress === 0 ? ''
      : this.birthDeclaresInProgress + ' ' + this.translate.instant('DECLARE BIRTHS IN PROGRESS');
    const birthRevokeMessage = this.birthRevokesInProgress === 0 ? ''
      : this.birthRevokesInProgress + ' ' + this.translate.instant('BIRTH REVOKES IN PROGRESS');

    return birthDeclareMessage + (birthDeclareMessage === '' ? '' : '. ') + birthRevokeMessage + (birthRevokeMessage === '' ? '' : '. ')
      + this.translate.instant('A MANUAL TAG SYNC IS ONLY ALLOWED IF ALL BIRTH DECLARES AND REVOKES HAVE BEEN PROCESSED');
  }

  hasLastManualRetrieveTag(): boolean {
    return this.eartagStatusOverview ? !!this.eartagStatusOverview.last_retrieve_tags : false;
  }

  getLastManualRetrieveTagRequestState() {
    const status = this.eartagStatusOverview ? this.eartagStatusOverview.last_retrieve_tags
      ? this.eartagStatusOverview.last_retrieve_tags.request_state : null : null;
    return status ? this.translate.instant(status) : '-';
  }

  isLastManualRetrieveTagRequestCancelled(): boolean {
    const status = this.eartagStatusOverview ? this.eartagStatusOverview.last_retrieve_tags
      ? this.eartagStatusOverview.last_retrieve_tags.request_state : null : null;
    return status === 'CANCELLED';
  }

  hasForceDeleteAnimalsFailed(): boolean {
    return this.hasLastManualRetrieveTag() ? this.eartagStatusOverview.last_retrieve_tags.has_force_delete_animals_failed : false;
  }

  getLastManualRetrieveTagLogDate() {
    const logDate = this.eartagStatusOverview ? this.eartagStatusOverview.last_retrieve_tags
      ? this.eartagStatusOverview.last_retrieve_tags.log_date : null : null;
    if (logDate) {

      return moment(logDate).format(this.settings.getViewDateTimeFormat());
    }
    return '-';
  }

  getLastManualRetrieveTagActionBy() {
    const actionBy: User = this.eartagStatusOverview ? this.eartagStatusOverview.last_retrieve_tags
      ? this.eartagStatusOverview.last_retrieve_tags.action_by : null : null;
    if (actionBy) {
      return actionBy.first_name + ' ' + actionBy.last_name;
    }
    return '-';
  }

  private getEartagsList() {
    this.apiService
      .doGetRequest(API_URI_GET_EARTAGS)
      .subscribe(
          (res: JsonResponseModel) => {
          const eartags = res.result;
          this.eartags_list = [];

          for (const eartag of eartags) {
            eartag.uln = eartag.uln_country_code + eartag.uln_number;
            eartag.ulnLastFive = eartag.uln_number.substr(eartag.uln_number.length - 5);
            this.eartags_list.push(eartag);
          }
          this.eartags_list = _.orderBy(this.eartags_list, ['ulnLastFive']);
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  private syncEartagsList() {
    this.sync_in_progress = true;
    this.apiService
      .doPostRequest(API_URI_SYNC_EARTAGS, {
        is_manual: true
      })
      .subscribe(() => {
        this.getEartagsList();
        this.sync_in_progress = false;
      },
      error => {
        this.loopSyncEartagsList = false;
      });

    setTimeout(() => {
      if (this.areRecurrentApiCallsActivated && this.loopSyncEartagsList) {
        this.syncEartagsList();
      }
    }, 10 * 1000);
  }

  private getEartagsSyncStatusOverview() {
    this.apiService
      .doGetRequest(API_URI_SYNC_EARTAGS + '-status')
      .subscribe(
          (res: JsonResponseModel) => {
          this.eartagStatusOverview = res.result;
          this.birthDeclaresInProgress = this.eartagStatusOverview.births_in_progress;
          this.birthRevokesInProgress = this.eartagStatusOverview.birth_revokes_in_progress;
          this.areBirthsInProgress = this.birthDeclaresInProgress + this.birthRevokesInProgress > 0;
          this.statusHasBeenRetrieved = true;
        },
        error => {
          this.loopGetEartagsSyncStatusOverview = false;
          // DO NOT LOGOUT HERE TO PREVENT THE RISK OF BEING LOGGED OUT, WHILE TRYING TO LOGIN AGAIN
        }
      );
    setTimeout(() => {
      if (this.areRecurrentApiCallsActivated && this.loopGetEartagsSyncStatusOverview) {
        this.getEartagsSyncStatusOverview();
      }
    }, 10 * 1000);
  }

  private selectEartag(eartag, event) {
    if (event.target.checked) {
      eartag.selected = true;
      this.selected_eartags_list.push(eartag);
    }

    if (!event.target.checked) {
      eartag.selected = false;
      const index = this.selected_eartags_list.indexOf(eartag);
      this.selected_eartags_list.splice(index, 1);
    }
  }

  private selectAllEartags(event) {
    if (event.target.checked) {
      for (const eartag of this.eartags_list) {
        eartag.selected = true;
        this.selected_eartags_list.push(eartag);
      }
    }

    if (!event.target.checked) {
      for (const eartag of this.eartags_list) {
        eartag.selected = false;
        const indexOfEartag = this.selected_eartags_list.indexOf(eartag);
        this.selected_eartags_list.splice(indexOfEartag, 1);
      }
    }
  }

  private setOrderULN() {
    this.order_column_uln_asc = !this.order_column_uln_asc;

    if (this.order_column_uln_asc) {
      this.eartags_list = _.orderBy(this.eartags_list, ['ulnLastFive'], ['asc']);
    } else {
      this.eartags_list = _.orderBy(this.eartags_list, ['ulnLastFive'], ['desc']);
    }
  }

  private sendEartagTransferRequest() {
    if (this.form_single_tag.valid) {
      this.form_single_valid = true;
      this.eartag_in_progress = true;

      const transfer = new EartagTransfer();
      transfer.ubn_new_owner = this.form_single_tag.controls['ubn_new_owner'].value;
      transfer.tags = [];
      transfer.tags.push(this.selected_eartag);

      this.apiService
        .doPostRequest(API_URI_TRANSFER_EARTAGS, transfer)
        .subscribe(
          res => {

            if (this.selected_eartag.selected) {
              this.selected_eartag.selected = false;
              const indexOfEartag = this.selected_eartags_list.indexOf(this.selected_eartag);
              this.selected_eartags_list.splice(indexOfEartag, 1);
            }

            const index = this.eartags_list.indexOf(this.selected_eartag);
            this.eartags_list.splice(index, 1);

            this.eartag_in_progress = false;
            this.closeModal();
          },
          err => {
            const error = err;
            this.error_message = error.message;
            this.eartag_in_progress = false;
          }
        );

      this.form_single_tag.get('ubn_new_owner').setValue('');

    } else {
      this.form_single_valid = false;
    }
  }

  private sendAllEartagTransferRequest() {
    if (this.form.valid) {
      this.form_valid = true;
      this.all_eartags_in_progress = true;

      const transfer = new EartagTransfer();
      transfer.ubn_new_owner = this.form.get('ubn_new_owner').value;
      transfer.tags = this.selected_eartags_list;

      this.apiService
        .doPostRequest(API_URI_TRANSFER_EARTAGS, transfer)
        .subscribe(
          res => {
            if (this.selected_eartags_list.length > 0) {
              let array_length = this.selected_eartags_list.length;

              while (array_length--) {
                const eartag = this.selected_eartags_list[array_length];

                const index_selected = this.selected_eartags_list.indexOf(eartag);
                this.selected_eartags_list.splice(index_selected, 1);

                const index = this.eartags_list.indexOf(eartag);
                this.eartags_list.splice(index, 1);
              }
            }

            this.all_eartags_in_progress = false;
            this.closeModalAll();
          },
          err => {
            const error = err;
            this.error_message = error.message;
            this.all_eartags_in_progress = false;
          }
        );

      this.form.get('ubn_new_owner').setValue('');

    } else {
      this.form_valid = false;
    }
  }

  private openModal() {
    this.modal_display = 'block';
  }

  private closeModal() {
    this.modal_display = 'none';
    this.error_message = '';
  }

  private openModalAll() {
    this.modal_all_display = 'block';
  }

  private closeModalAll() {
    this.modal_all_display = 'none';
    this.error_message = '';
  }
}
