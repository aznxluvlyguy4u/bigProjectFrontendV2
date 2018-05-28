import * as _ from 'lodash';
import moment = require('moment');
import {AfterContentChecked, Component, NgZone, OnDestroy, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../shared/services/settings/settings.service';
import {
  UBN_TOKEN_NAMESPACE,
  API_URI_GET_COUNTRY_CODES,
  API_URI_GET_MESSAGES
} from '../../shared/services/nsfo-api/nsfo.settings';
import {UtilsService} from '../../shared/services/utils/utils.services';
import { DownloadModalComponent } from '../../shared/components/downloadmodal/download-modal.component';
import { DownloadService } from '../../shared/services/download/download.service';
import { DeclareManagerService } from '../../shared/services/declaremanager/declare-manager.service';
import { DeclareManagerModalComponent } from '../../shared/components/declaremanagermodal/declare-manager-modal.component';
import {Message} from '../../shared/models/message.model';
import {User} from '../../shared/models/person.model';

@Component({
  directives: [DownloadModalComponent, DeclareManagerModalComponent],
  templateUrl: './home.component.html'
})

export class MainComponent implements OnInit, OnDestroy, AfterContentChecked {
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

  constructor(private router: Router, private location: Location, private apiService: NSFOService,
              private settings: SettingsService, private utils: UtilsService, private zone: NgZone,
              private downloadService: DownloadService,
              private declareManagerService: DeclareManagerService
  ) {}

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
        res => {this.is_logged_in = true; },
        err => {this.is_logged_in = false; this.navigateTo('/login'); }
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
        res => {
          const countryCodeList = _.sortBy(res.result, ['code']);
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
        res => {
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
