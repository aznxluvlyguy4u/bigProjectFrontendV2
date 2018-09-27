import * as _ from 'lodash';
import * as moment from 'moment';
import {AfterContentChecked, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../shared/services/settings/settings.service';
import {
    API_URI_GET_COUNTRY_CODES,
    API_URI_GET_MESSAGES,
} from '../../shared/services/nsfo-api/nsfo.settings';
import {UtilsService} from '../../shared/services/utils/utils.services';
import { DownloadService } from '../../shared/services/download/download.service';
import { DeclareManagerService } from '../../shared/services/declaremanager/declare-manager.service';
import {Message} from '../../shared/models/message.model';
import {User} from '../../shared/models/person.model';
import {JsonResponseModel} from '../../shared/models/json-response.model';
import {CacheService} from '../../shared/services/settings/cache.service';
import {ReportService} from '../../shared/services/report/report.service';

@Component({
  templateUrl: './home.component.html'
})

export class HomeComponent implements OnInit, OnDestroy, AfterContentChecked {
  public isActiveSideMenu = false;
  public isActiveMessageMenu = false;
  public isActiveDownloadModal = false;
  public isActiveReportModal = false;
  public isActiveDeclareItemsModal = false;
  public isActiveUserMenu = false;
  public messageList = <Message[]> [];
  public menuMessages = <Message[]> [];
  public messages = <Message[]> [];
  public is_logged_in = false;
  // public ubnList: string[] = [];
  public locationList: any = [];
  public currentUser: User = new User();
  public currentUBNValue: string;
  public currentLocation: any;
  public userInfo$;
  public currentUBN$;
  public isAdmin = false;
  public recheckMessages = true;

  constructor(private router: Router, private location: Location, private apiService: NSFOService,
              private cache: CacheService, private settings: SettingsService,
              private utils: UtilsService, private zone: NgZone,
              private downloadService: DownloadService,
              private reportService: ReportService,
              private declareManagerService: DeclareManagerService
  ) {}

  ngOnInit() {
    const request = {
      'env': 'USER'
    };
    this.apiService.doPostRequest('/v1/auth/validate-token', request)
      .subscribe(
        res => {
          this.is_logged_in = true;
          this.getUserInfo();
          this.getCountryCodeList();
          this.utils.initUserInfo();
          this.getMessages();
          this.isAdmin = this.settings.isAdmin();
          },
        err => {
          this.is_logged_in = false;
          this.navigateTo('/login');
        }
      );
  }

  ngAfterContentChecked() {
    this.selectUBN();
  }

  ngOnDestroy() {
    this.userInfo$.unsubscribe();
    this.recheckMessages = false;
  }

  private getUserInfo() {
    this.userInfo$ = this.utils.getUserInfo()
      .subscribe(
        res => {
          this.currentUser.first_name_letter = res.first_name.charAt(0);
          this.currentUser.first_name = res.first_name;
          this.currentUser.last_name = res.last_name;

          this.locationList = res.locations;

          if (!!this.cache.getLocation()) {
            this.currentUBNValue = this.locationList[0].ubn;
            this.currentLocation = this.locationList[0];
            const savedUBN = this.cache.getLocation().ubn;

            for (const location of this.locationList) {
              if (location.ubn === savedUBN) {
                this.currentUBNValue = savedUBN;
                this.currentLocation = location;
              }
            }
          } else {
            this.currentUBNValue = this.locationList[0].ubn;
            this.currentLocation = this.locationList[0];
          }
        });
  }

  private getCountryCodeList() {
    this.apiService
      .doGetRequest(API_URI_GET_COUNTRY_CODES)
      .subscribe(
          (res: SettingsService) => {
          const countryCodeList = _.sortBy(res, ['code']);
          this.settings.setCountryList(countryCodeList);
        },
        error => {
          const errorMessage = this.apiService.getErrorMessage(error);
          if (NSFOService.displayErrorMessage(errorMessage)) {
            alert(errorMessage);
          }
        }
      );
  }

  private getMessages() {
    this.apiService
      .doGetRequest(API_URI_GET_MESSAGES)
      .subscribe(
          (res: JsonResponseModel) => {
          this.utils.setMenuMessages([]);
          this.menuMessages = [];
          this.messages = res.result;
          this.messages = _.orderBy(this.messages, ['creation_date'], ['desc']);

          for (const message of this.messages) {
            if (message.type === 'DECLARE_ARRIVAL') {
              message.subject = 'AUTOMATIC DEPART DECLARATION CREATED';
              message.sender = 'NSFO';
            }

            if (message.type === 'DECLARE_DEPART') {
              message.subject = 'AUTOMATIC ARRIVAL DECLARATION CREATED';
              message.sender = 'NSFO';
            }
            if (message.type === 'NEW_INVOICE') {
              message.sender = 'NSFO';
            }
            if (!message.is_read) {
              this.menuMessages.push(message);
            }
          }
          this.utils.setMessages(this.messages);
        },
        error => {
          this.recheckMessages = false;
        }
      );

    setTimeout(() => {
      if (this.recheckMessages) {
        this.getMessages();
      }
    }, 30 * 1000);
  }

  private removeMenuMessage(message) {
    const index = this.menuMessages.indexOf(message);
    this.menuMessages.splice(index, 1);
  }

  public selectUBN() {
    if (this.currentLocation !== undefined) {
      this.utils.setCurrentLocation(this.currentLocation);
    }
  }

  private stringAsViewDateTime(date) {
    return moment(date).format(this.settings.getViewDateTimeFormat());
  }

  public reloadApp() {
    window.location.reload();
  }

  public navigateTo(route: string) {
    if (
      this.location.path() !== route + '/declare' &&
      this.location.path() !== route + '/history' &&
      this.location.path() !== route + '/errors' &&
      this.location.path() !== route + '/overview' &&
      this.location.path() !== route + '/company' &&
      this.location.path() !== route + '/login'
    ) {
      this.router.navigate([route]);
    }
  }

  public isActiveRoute(route: string) {
    return this.router.serializeUrl(this.router.createUrlTree([])) === this.router.serializeUrl((this.router.createUrlTree([route])));
  }

  public logout() {
    this.cache.deleteTokens();
    this.navigateTo('/login');
  }

  toggleActiveMessageMenu() {
    this.isActiveMessageMenu = !this.isActiveMessageMenu;
    this.isActiveUserMenu = false;
    this.isActiveSideMenu = false;
    this.isActiveDeclareItemsModal = false;
    this.downloadService.closeDownloadModal();
  }

  toggleActiveUserMenu() {
    this.isActiveUserMenu = !this.isActiveUserMenu;
    this.isActiveMessageMenu = false;
    this.isActiveSideMenu = false;
    this.isActiveDeclareItemsModal = false;
    this.downloadService.closeDownloadModal();
  }

  toggleDownloadModal() {
    this.downloadService.toggleDownloadModal();
    this.isActiveMessageMenu = false;
    this.isActiveUserMenu = false;
    this.isActiveSideMenu = false;
    this.isActiveDeclareItemsModal = false;
  }

  toggleReportModal() {
    this.reportService.toggleReportModal();
      this.isActiveMessageMenu = false;
      this.isActiveUserMenu = false;
      this.isActiveSideMenu = false;
      this.isActiveDeclareItemsModal = false;
  }

  toggleDeclareItemsModal() {
    this.declareManagerService.toggleDeclareItemsModal();
    this.isActiveMessageMenu = false;
    this.isActiveUserMenu = false;
    this.isActiveSideMenu = false;
    this.isActiveDownloadModal = false;
  }

  downloadCount(): number {
    return this.downloadService.getDownloadsInModalCount();
  }

  reportCount(): number {
    return this.reportService.getReportsInModalCount();
  }

  isDownloadModalEmpty(): boolean {
    return this.downloadService.isModalEmpty();
  }

  isReportModalEmpty(): boolean {
      return this.reportService.isModalEmpty();
  }

  declareItemsCount(): number {
    return this.declareManagerService.getDeclaresInModalCount();
  }

  isDeclareModalEmpty(): boolean {
    return this.declareManagerService.isModalEmpty();
  }
}
