import * as moment from 'moment';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {DashboardInfo} from './dashboard.model';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_DASHBOARD_INFO, API_URI_SYNC_ANIMALS, API_URI_SYNC_EARTAGS} from '../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../shared/services/settings/settings.service';
import {JsonResponseModel} from '../../shared/models/json-response.model';
import {CacheService} from '../../shared/services/settings/cache.service';
import {POLLING_INTERVAL_DASHBOARD_SECONDS} from '../../shared/variables/timeout.constant';

@Component({
  templateUrl: './dashboard.component.html'
})

export class DashboardComponent implements OnInit, OnDestroy {
  public showUsedEartagsCount = false;
  public dashboard_info: DashboardInfo = new DashboardInfo;
  public cleanUpComponent = false;
  public loopGetDashboardInfo = true;
  public isLoading: boolean;

  private retryTimeoutSeconds = 2;

  constructor(
      private apiService: NSFOService,
      private cache: CacheService,
      private settings: SettingsService,
      private router: Router) {
  }

  ngOnInit() {
     this.isLoading = true;
     this.getDashboardInfo();
     this.syncLivestock();
     this.syncEartags();
  }

  ngOnDestroy() {
    this.cleanUpComponent = true;
  }

  private getDashboardInfo() {
    if (this.cache.getAccessToken() === undefined) { return; }
    this.apiService.doGetRequest(API_URI_GET_DASHBOARD_INFO)
      .subscribe(
          (res: JsonResponseModel) => {
          this.dashboard_info = res.result;
          this.isLoading = false;
        },
        error => {
          this.loopGetDashboardInfo = false;
          // DO NOT LOGOUT HERE TO PREVENT THE RISK OF BEING LOGGED OUT, WHILE TRYING TO LOGIN AGAIN
          this.isLoading = false;
        }
      );

    setTimeout(() => {
      if (!this.cleanUpComponent && this.loopGetDashboardInfo) {
        this.getDashboardInfo();
      }
    }, POLLING_INTERVAL_DASHBOARD_SECONDS * 1000);
  }

  private syncLivestock() {
    // check current ubn only if NL
    if (this.cache.areLocationsLoaded()) {

      if (this.cache.useRvoLogic()) {
        if (this.cache.getAccessToken() === undefined) { return; }
        this.apiService.doPostRequest(API_URI_SYNC_ANIMALS, {})
          .subscribe(() => {
          });
      }

    } else {

      setTimeout(() => {
        this.syncLivestock();
      }, this.retryTimeoutSeconds * 1000);

    }

  }

  private syncEartags() {
    // check current ubn only if NL
    if (this.cache.areLocationsLoaded()) {

      if (this.cache.useRvoLogic()) {
        if (this.cache.getAccessToken() === undefined) { return; }
        this.apiService
          .doPostRequest(API_URI_SYNC_EARTAGS, {})
          .subscribe(() => {
          });
      }

    } else {

      setTimeout(() => {
        this.syncEartags();
      }, this.retryTimeoutSeconds * 1000);

    }

  }

  private navigateTo(route: string) {
    this.router.navigate([route]);
  }

  private stringAsDate(date) {
    return moment(date).format(this.settings.getViewDateFormat());
  }

  private stringAsDatetime(date) {
    return moment(date).format(this.settings.getViewDateTimeFormat());
  }
}
