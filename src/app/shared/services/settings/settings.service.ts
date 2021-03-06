import * as moment from 'moment';
import {Injectable} from '@angular/core';
import {ReplaySubject, Subject} from 'rxjs';
import {API_URI_GET_COMPANY_LOGIN, GHOST_TOKEN_NAMESPACE} from '../nsfo-api/nsfo.settings';
import {DEVELOPER, SUPER_ADMIN} from '../../variables/access-levels';
import {NSFOService} from '../nsfo-api/nsfo.service';
import {User} from '../../models/person.model';
import {JsonResponseModel} from '../../models/json-response.model';

@Injectable()
export class SettingsService {
  public currentUserChanged = new Subject<User>();
  private currentUser: User;
  private locale = 'nl';
  private countryList: ReplaySubject<any> = new ReplaySubject<any>();
  private viewDateFormat = 'DD-MM-YYYY';
  private viewDateFormatInComponent = 'dd-MM-yyyy';
  private viewDateTimeFormat = 'DD-MM-YYYY HH:mm';
  private modelDateTimeFormat = 'YYYY-MM-DDThh:mm:ssZ';
  private modelDateFormat = 'YYYY-MM-DD';

  constructor(private apiService: NSFOService) {
    this.getCurrentUser();
  }

  public static getDateString_YYYY_MM_DD_fromDate(date: Date = new Date()) {
    return date.getFullYear() + '-' + (date.getMonth() + 1) + '-' + date.getDate();
  }

  public getCurrentUser(): User {
    if (!this.currentUser) {
      this.apiService.doGetRequest(API_URI_GET_COMPANY_LOGIN)
        .subscribe(
            (res: JsonResponseModel) => {
            this.setCurrentUser(res.result.nsfo.logged_in_user);
          },
          error => {
            alert(this.apiService.getErrorMessage(error));
          }
        );
    }
    return this.currentUser;
  }

  public setCurrentUser(currentUser: User) {
    this.currentUser = currentUser;
    this.notifyCurrentUserChanged();
  }

  public notifyCurrentUserChanged() {
    this.currentUserChanged.next(this.currentUser);
  }

  public getCountryList() {
    return this.countryList.asObservable();
  }

  public setCountryList(countryList) {
    this.countryList.next(countryList);
  }

  public convertToViewDate(date) {
    return moment(date).format(this.getViewDateFormat());
  }

  public getViewDateFormat() {
    return this.viewDateFormat;
  }

  public getViewDateFormatInComponent() {
    return this.viewDateFormatInComponent;
  }

  public stringAsViewDateTime(date) {
    return moment(date).format(this.getViewDateTimeFormat());
  }

  public setViewDateFormat(viewDateFormat) {
    this.viewDateFormat = viewDateFormat;
  }

  public getViewDateTimeFormat() {
    return this.viewDateTimeFormat;
  }

  public setViewDateTimeFormat(viewDateTimeFormat) {
    this.viewDateTimeFormat = viewDateTimeFormat;
  }

  public getModelDateTimeFormat() {
    return this.modelDateTimeFormat;
  }

  public setModelDateTimeFormat(modelDateTimeFormat) {
    this.modelDateTimeFormat = modelDateTimeFormat;
  }

  public getModelDateFormat() {
    return this.modelDateFormat;
  }

  public setModelDateFormat(modelDateFormat) {
    this.modelDateFormat = modelDateFormat;
  }

  public isAdmin() {
    return !!sessionStorage[GHOST_TOKEN_NAMESPACE];
  }

  public isAtLeastSuperAdmin(user: User): boolean {
    if (user !== null && user !== undefined) {
      return user.access_level === SUPER_ADMIN || user.access_level === DEVELOPER;
    }

    return false;
  }

  public setLocale(locale: string) {
    this.locale = locale;
  }

  public getLocale() {
    return this.locale;
  }

  getCountryCodeByIso(iso) {
    const countrycodes = {
      '056' : 'BE',
      '100' : 'BG',
      '196' : 'CY',
      '208' : 'DK',
      '276' : 'DE',
      '233' : 'EE',
      '246' : 'FI',
      '250' : 'FR',
      '300' : 'GR',
      '348' : 'HU',
      '372' : 'IE',
      '380' : 'IT',
      '428' : 'LV',
      '442' : 'LU',
      '528' : 'NL',
      '040' : 'AT',
      '616' : 'PL',
      '620' : 'PT',
      '642' : 'RO',
      '705' : 'SI',
      '703' : 'SK',
      '724' : 'ES',
      '203' : 'CZ',
      '752' : 'SE'
    };

    return countrycodes[iso];
  }
}

