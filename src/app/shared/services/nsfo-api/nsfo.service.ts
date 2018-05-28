import {Injectable} from '@angular/core';
import {
  ACCESS_TOKEN_NAMESPACE,
  API_URI_VERIFY_GHOST_TOKEN,
  GHOST_TOKEN_NAMESPACE,
  UBN_TOKEN_NAMESPACE
} from './nsfo.settings';
import {TranslateService} from '@ngx-translate/core';
import {Animal} from '../../models/animal.model';
import {Router} from '@angular/router';
import pick from 'lodash/pick';
import {HttpClient, HttpHeaders, HttpResponse} from '@angular/common/http';
import {environment} from '../../../../environments/environment';
import {ResultModel} from './result.model';

@Injectable()
export class NSFOService {

  private content_type = 'Content-Type';
  private authorization = 'Authorization';
  private access_token = 'AccessToken';
  private ghost_token = 'GhostToken';
  private ubn = 'ubn';

  apiUrl = environment.nsfoApiServerUrl;

  constructor(private httpClient: HttpClient, private translate: TranslateService, private router: Router) {
  }

  static cleanAnimalsInput(animals: Animal[], variables = ['uln_country_code', 'uln_number']): Animal[] {
    return animals.map(function (object: Animal) {
      return pick(object, variables);
    });
  }

  private getDefaultHeaders(): HttpHeaders {
    const headers = new HttpHeaders();
    headers.append(this.content_type, 'application/json');
    headers.append(this.access_token, localStorage[ACCESS_TOKEN_NAMESPACE]);
    headers.append(this.ubn, localStorage[UBN_TOKEN_NAMESPACE]);

    if (sessionStorage.getItem(GHOST_TOKEN_NAMESPACE)) {
      headers.append(this.ghost_token, sessionStorage[GHOST_TOKEN_NAMESPACE]);
    }
    return headers;
  }

  private getDefaultOptions(): any {
    return {
      headers: this.getDefaultHeaders(),
      observe: 'body', // returning full response, default = body
      responseType: 'json', // response will be treated as this, default = json
    };
  }

  doLoginRequest(username: string, password: string) {
    const headers = new HttpHeaders();
    headers.append(this.content_type, 'application/json');
    headers.append(this.authorization, 'Basic ' + btoa(username + ':' + password));

    return this.httpClient.get<any>(this.apiUrl + '/v1/auth/authorize',
        {
          headers: headers,
          observe: 'body', // returning full response, default = body
          responseType: 'json', // response will be treated as this, default = json
        });
  }

  doGhostLoginVerification() {
    const headers = new HttpHeaders();
    headers.append(this.content_type, 'application/json');
    headers.append(this.access_token, localStorage[ACCESS_TOKEN_NAMESPACE]);
    headers.append(this.ghost_token, sessionStorage[GHOST_TOKEN_NAMESPACE]);

    const request = {
      'env': 'ADMIN'
    };

    return this.httpClient.put<any>(this.apiUrl + API_URI_VERIFY_GHOST_TOKEN, JSON.stringify(request),
        {
          headers: headers,
          observe: 'body', // returning full response, default = body
          responseType: 'json', // response will be treated as this, default = json
        });
  }

  doPostRequest(uri: string, data) {
    return this.httpClient.post<any>(this.apiUrl + uri, JSON.stringify(data), this.getDefaultOptions());
  }

  doGetRequest(uri: string) {
    return this.httpClient.get(this.apiUrl + uri, this.getDefaultOptions());
  }

  doPutRequest(uri: string, data) {
    return this.httpClient.put(this.apiUrl + uri, JSON.stringify(data), this.getDefaultOptions());
  }

  public logout() {
    localStorage.removeItem('access_token');
    sessionStorage.removeItem('ghost_token');
    this.navigateToLogin();
  }

  public getErrorMessage(err: HttpResponse): string {
    switch (err.status) {
      case 500:
        return this.translate.instant('SOMETHING WENT WRONG. TRY ANOTHER TIME.');
      case 524:
        return this.translate.instant('A TIMEOUT OCCURED. TRY AGAIN LATER, PERHAPS WHEN THE SERVER IS LESS BUSY OR TRY IT WITH LESS DATA.');

      case 403:
        this.logout();
        return this.translate.instant('YOU ARE UNAUTHORIZED');

      default:

        const jsonBody: ResultModel = err.body;

        if (jsonBody && jsonBody.result) {
          const result = jsonBody.result;

          if (result instanceof Array) {
            let message = '';
            for (const resultPart of result) {
              message += this.getTranslatedMessage(resultPart.message) + '. ';
            }
            return message;
          }

          const dataPart = result.data !== null ? ' (' + this.translate.instant(result.data) + ') ' : '';
          return this.getTranslatedMessage(result.message) + dataPart;
        }

        return this.translate.instant('SOMETHING WENT WRONG. TRY ANOTHER TIME.');
    }
  }

  public getTranslatedMessage(message: string): string {
    return message !== null ? this.translate.instant(message) : '';
  }

  private navigateTo(route: string) {
    this.router.navigate([route]);
  }

  private navigateToLogin() {
    this.navigateTo('/login');
  }
}
