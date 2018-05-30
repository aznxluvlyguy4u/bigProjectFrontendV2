import {Injectable} from '@angular/core';

@Injectable()
export class CacheService {
  private accessToken: string;
  private ghostToken: string;
  private ubn: string;

  public constructor() {}

  public getAccessToken(): string {
    return this.accessToken;
  }

  public setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
    // localStorage.setItem(ACCESS_TOKEN_NAMESPACE, accessToken);
  }

  deleteAccessToken() {
    this.accessToken = undefined;
    // localStorage.removeItem(ACCESS_TOKEN_NAMESPACE);
  }

  public getGhostToken(): string {
    return this.ghostToken;
  }

  public setGhostToken(ghostToken: string) {
    this.ghostToken = ghostToken;
    // sessionStorage.setItem(GHOST_TOKEN_NAMESPACE, ghostToken);
  }

  deleteGhostToken() {
    this.ghostToken = undefined;
    // sessionStorage.removeItem(GHOST_TOKEN_NAMESPACE);
  }

  public getUbn(): string {
    return this.ubn;
  }

  public setUbn(ubn: string) {
    this.ubn = ubn;
    // sessionStorage.setItem(UBN_TOKEN_NAMESPACE, ubn);
  }

  deleteUbn() {
    this.ubn = undefined;
    // localStorage.removeItem(UBN_TOKEN_NAMESPACE);
  }

  deleteTokens() {
    this.deleteAccessToken();
    this.deleteGhostToken();
    this.deleteUbn();
  }

}
