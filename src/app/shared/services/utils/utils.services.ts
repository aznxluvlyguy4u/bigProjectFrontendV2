import {Injectable} from '@angular/core';
import {ReplaySubject} from 'rxjs';
import {NSFOService} from '../nsfo-api/nsfo.service';
import {API_URI_GET_USER_INFO, UBN_TOKEN_NAMESPACE} from '../nsfo-api/nsfo.settings';
import {ScalarObservable} from 'rxjs/observable';
import {TranslateService} from '@ngx-translate/core';
import {Message} from '../../models/message.model';

@Injectable()
export class UtilsService {
  private userInfo: ReplaySubject<any> = new ReplaySubject();
  private currentUBN: ReplaySubject<any> = new ReplaySubject();
  private messages: ReplaySubject<any> = new ReplaySubject();
  private menuMessages: Message[] = [];

  constructor(private api: NSFOService, private translate: TranslateService) {
    this.initUserInfo();
  }

  public static getBooleanAsString(bool: boolean) {
    return bool ? 'true' : 'false';
  }

  public initUserInfo() {
    this.api.doGetRequest(API_URI_GET_USER_INFO)
      .subscribe(
        res => {
          this.setUserInfo(res.json().result);
        },
        error => {
          alert(this.api.getErrorMessage(error));
        });
  }

  public setUserInfo(userInfo) {
    this.userInfo.next(userInfo);
  }

  public getUserInfo() {
    return this.userInfo.asObservable();
  }

  public setCurrentUBN(currentUBN) {
    localStorage.setItem(UBN_TOKEN_NAMESPACE, currentUBN);
    this.currentUBN.next(currentUBN);
  }

  public getCurrentUBN() {
    return this.currentUBN.asObservable();
  }

  public setMessages(messages) {
    this.messages.next(messages);
  }

  public getMessages() {
    return this.messages.asObservable();
  }

  public setMenuMessages(messages: Message[]) {
    this.menuMessages = messages;
  }

  public getMenuMessages() {
    return this.menuMessages;
  }

  public addMenuMessage(message: Message) {
    this.menuMessages.push(message);
  }

  public removeMenuMessage(message: Message) {
    const index = this.menuMessages.indexOf(message);
    this.menuMessages.splice(index, 1);
  }

  public showAlertPopup(alertText: string, number ?: number) {
    const translatedText = (<ScalarObservable>this.translate.get(alertText)).value;

    let suffix = '';
    if (number !== null) {
      suffix = ' ' + number.toString();
    }

    alert(translatedText + suffix);
  }
}
