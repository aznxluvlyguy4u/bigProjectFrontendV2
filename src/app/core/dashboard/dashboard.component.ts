import * as moment from 'moment';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {DashboardInfo} from './dashboard.model';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_DASHBOARD_INFO, API_URI_SYNC_ANIMALS, API_URI_SYNC_EARTAGS} from '../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../shared/services/settings/settings.service';
import {JsonResponseModel} from '../../shared/models/json-response.model';

@Component({
  templateUrl: './dashboard.component.html'
})

export class DashboardComponent implements OnInit, OnDestroy {
  public showUsedEartagsCount = false;
  private dashboard_info: DashboardInfo = new DashboardInfo;
  private cleanUpComponent = false;
  private loopGetDashboardInfo = true;

  constructor(private apiService: NSFOService, private settings: SettingsService, private router: Router) {
  }

  ngOnInit() {
    this.getDashboardInfo();
    this.syncLivestock();
    this.syncEartags();
  }

  ngOnDestroy() {
    this.cleanUpComponent = true;
  }

  private getDashboardInfo() {
    this.apiService.doGetRequest(API_URI_GET_DASHBOARD_INFO)
      .subscribe(
          (res: JsonResponseModel) => {
          this.dashboard_info = res.result;
        },
        error => {
          this.loopGetDashboardInfo = false;
          // DO NOT LOGOUT HERE TO PREVENT THE RISK OF BEING LOGGED OUT, WHILE TRYING TO LOGIN AGAIN
        }
      );

    setTimeout(() => {
      if (!this.cleanUpComponent && this.loopGetDashboardInfo) {
        this.getDashboardInfo();
      }
    }, 10 * 1000);
  }

  private syncLivestock() {
    this.apiService.doPostRequest(API_URI_SYNC_ANIMALS, {})
      .subscribe(() => {
      });
  }

  private syncEartags() {
    this.apiService
      .doPostRequest(API_URI_SYNC_EARTAGS, {})
      .subscribe(() => {
      });
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
