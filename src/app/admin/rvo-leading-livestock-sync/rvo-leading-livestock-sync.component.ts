import {Component, OnDestroy, OnInit} from '@angular/core';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {
  API_URI_SYNC_ANIMALS,
  API_URI_SYNC_ANIMALS_RVO_LEADING
} from '../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../shared/services/settings/settings.service';
import {User} from '../../shared/models/person.model';
import {RetrieveAnimals} from '../../shared/models/rvo-declare.model';
import {Subscription} from 'rxjs';
import {JsonResponseModel} from '../../shared/models/json-response.model';

@Component({
  templateUrl: './rvo-leading-livestock-sync.component.html'
})
export class RvoLeadingLivestockSyncComponent implements OnInit, OnDestroy {
  private user = new User();
  private latestSyncData: RetrieveAnimals;
  private dateFormat: string;

  private isAtLeastSuperAdmin = false;
  private currentUserSubscription: Subscription;
  public loadingData = true;
  private loadingLatestSyncData = true;
  private showWarningMessage = false;

  private in_progress = false;
  private requested_livestock_sync = false;

  constructor(private apiService: NSFOService,
              private settingsService: SettingsService) {
    // this.dateFormat = settings.VIEW_DATETIME_FORMAT;
    this.dateFormat = 'DD-MM-YYYY HH:mm';
  }

  ngOnInit() {
    this.getLatestSyncData();
    this.getCurrentUser();
    this.dataLoadingCheck();
  }

  ngOnDestroy() {
    this.currentUserSubscription.unsubscribe();
  }

  public getLatestSyncDataActionByFullName(): string {
    if (this.latestSyncData !== null && this.latestSyncData.action_by !== null) {
      return this.latestSyncData.action_by.first_name + ' ' + this.latestSyncData.action_by.last_name;
    }
    return '';
  }

  public getLogDate(): string {
    if (this.latestSyncData !== null) {
      return this.latestSyncData.log_date;
    }
  }

  private getCurrentUser() {
    this.user = this.settingsService.getCurrentUser();
    this.currentUserSubscription = this.settingsService.currentUserChanged
      .subscribe(
        (user: User) => {
          this.user = user;
          this.dataLoadingCheck();
        }
      );
  }

  private getLatestSyncData() {
    this.apiService.doGetRequest(API_URI_SYNC_ANIMALS_RVO_LEADING)
      .subscribe(
          (res: JsonResponseModel) => {
          this.latestSyncData = res.result;
          if (res.result) {
            this.showWarningMessage = res.result.request_state === 'OPEN';
          } else {
            this.showWarningMessage = false;
          }
        },
        error => {
          const errorMessage = this.apiService.getErrorMessage(error);
          alert(errorMessage);
        }, () => {
          this.loadingLatestSyncData = false;
          this.dataLoadingCheck();
        }
      );
  }

  private dataLoadingCheck() {
    this.isAtLeastSuperAdmin = this.settingsService.isAtLeastSuperAdmin(this.user);
    this.loadingData = !this.user || this.loadingLatestSyncData;
  }

  private doForcedRvoLeadingLivestockSyncRequest() {
    this.in_progress = true;

    this.apiService
      .doPostRequest(API_URI_SYNC_ANIMALS, {is_rvo_leading: true})
      .subscribe(
        res => {
          this.requested_livestock_sync = true;
        },
        error => {
          const errorMessage = this.apiService.getErrorMessage(error);
          alert(errorMessage);
        }, () => {
          this.in_progress = false;
          this.getLatestSyncData();
        }
      );
  }
}
