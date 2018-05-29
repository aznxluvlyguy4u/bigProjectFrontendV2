import {AfterContentChecked, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import * as moment from 'moment';
import {Message} from './shared/models/message.model';
import {User} from './shared/models/person.model';
import {Router} from '@angular/router';
import {SettingsService} from './shared/services/settings/settings.service';
import {DownloadService} from './shared/services/download/download.service';
import {DeclareManagerService} from './shared/services/declaremanager/declare-manager.service';
import {UtilsService} from './shared/services/utils/utils.services';
import {NSFOService} from './shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_COUNTRY_CODES, API_URI_GET_MESSAGES, UBN_TOKEN_NAMESPACE} from './shared/services/nsfo-api/nsfo.settings';
import {JsonResponseModel} from './shared/models/json-response.model';
import { sortBy, orderBy } from 'lodash';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, AfterContentChecked, OnDestroy {
  title = 'nsfo online';

  private isActiveSideMenu = false;
  private isActiveMessageMenu = false;
  private isActiveDownloadModal = false;
  private isActiveDeclareItemsModal = false;
  private isActiveUserMenu = false;
  private messageList = <Message[]> [];
  private menuMessages = <Message[]> [];
  private messages = <Message[]> [];
  private is_logged_in = false;
  private ubnList: string[] = [];
  private currentUser: User = new User();
  private currentUBNValue: string;
  private userInfo$;
  private currentUBN$;
  private isAdmin = false;
  private recheckMessages = true;

  constructor(private router: Router, private apiService: NSFOService,
              private settings: SettingsService, private utils: UtilsService, private zone: NgZone,
              private downloadService: DownloadService,
              private declareManagerService: DeclareManagerService) {
  }

  ngOnInit() {
    this.validateToken();
    this.getUserInfo();
    this.getCountryCodeList();
    this.utils.initUserInfo();
    this.getMessages();
    this.isAdmin = this.settings.isAdmin();
  }

  ngAfterContentChecked() {
    this.selectUBN();
  }

  ngOnDestroy() {
    this.userInfo$.unsubscribe();
    this.recheckMessages = false;
  }

  private validateToken() {
    const request = {
      'env': 'USER'
    };

    this.apiService.doPostRequest('/v1/auth/validate-token', request)
      .subscribe(
        res => {
          this.is_logged_in = true;
        },
        err => {
          this.is_logged_in = false;
          this.navigateTo('/login');
        }
      );
  }

  private getUserInfo() {
    this.userInfo$ = this.utils.getUserInfo()
      .subscribe(
        res => {
          this.currentUser.first_name_letter = res.first_name.charAt(0);
          this.currentUser.first_name = res.first_name;
          this.currentUser.last_name = res.last_name;

          this.ubnList = res.ubns;
          if (!!localStorage.getItem(UBN_TOKEN_NAMESPACE)) {
            this.currentUBNValue = this.ubnList[0];
            const savedUBN = localStorage.getItem(UBN_TOKEN_NAMESPACE);

            for (const ubn of this.ubnList) {
              if (ubn === savedUBN) {
                this.currentUBNValue = savedUBN;
              }
            }
          } else {
            this.currentUBNValue = this.ubnList[0];
          }
        });
  }

  private getCountryCodeList() {
    this.apiService
      .doGetRequest(API_URI_GET_COUNTRY_CODES)
      .subscribe(
          (res: JsonResponseModel) => {
          const countryCodeList = sortBy(res.result, ['code']);
          this.settings.setCountryList(countryCodeList);
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
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
          this.messages = orderBy(this.messages, ['creation_date'], ['desc']);

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
    if (this.currentUBNValue !== undefined) {
      this.utils.setCurrentUBN(this.currentUBNValue);
    }
  }

  private stringAsViewDateTime(date) {
    return moment(date).format(this.settings.getViewDateTimeFormat());
  }

  public reloadApp() {
    window.location.reload();
  }

  private navigateTo(route: string) {
    if (
      location.pathname !== route + '/history' &&
      location.pathname !== route + '/errors' &&
      location.pathname !== route + '/overview' &&
      location.pathname !== route + '/company' &&
      location.pathname !== route + '/login'
    ) {
      this.router.navigate([route]);
    }
  }

  private isActiveRoute(route: string) {
    return this.router.serializeUrl(this.router.createUrlTree([])) === this.router.serializeUrl((this.router.createUrlTree([route])));
  }

  private logout() {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('ghost_token');
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

  isDownloadModalEmpty(): boolean {
    return this.downloadService.isModalEmpty();
  }

  declareItemsCount(): number {
    return this.declareManagerService.getDeclaresInModalCount();
  }

  isDeclareModalEmpty(): boolean {
    return this.declareManagerService.isModalEmpty();
  }
}
