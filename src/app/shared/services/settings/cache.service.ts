import {Injectable} from '@angular/core';
import {ACCESS_TOKEN_NAMESPACE, GHOST_TOKEN_NAMESPACE, UBN_TOKEN_NAMESPACE, UBN_LOCATION_NAMESPACE} from '../nsfo-api/nsfo.settings';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable()
export class CacheService {
  private accessToken: string;
  private ghostToken: string;
  private ubn: string;
  private location: any;
  private initialLocation: any;
  public constructor() {
    this.initialLocation = { ubn: '', country_code: '', use_rvo_logic: null};
  }

  public getAccessToken(): string {
    const localToken = localStorage.getItem(ACCESS_TOKEN_NAMESPACE);
    if (localToken) {
        this.setAccessToken(localToken);
    }
    return this.accessToken;
  }

  public setAccessToken(accessToken: string) {
    this.accessToken = accessToken;
     localStorage.setItem(ACCESS_TOKEN_NAMESPACE, accessToken);
  }

  deleteAccessToken() {
    this.accessToken = undefined;
     localStorage.removeItem(ACCESS_TOKEN_NAMESPACE);
  }

  public getGhostToken(): string {
      const localToken = sessionStorage.getItem(GHOST_TOKEN_NAMESPACE);
      if (localToken) {
          this.setGhostToken(localToken);
      }
    return this.ghostToken;
  }

  public setGhostToken(ghostToken: string) {
    this.ghostToken = ghostToken;
    sessionStorage.setItem(GHOST_TOKEN_NAMESPACE, ghostToken);
  }

  deleteGhostToken() {
    this.ghostToken = undefined;
    sessionStorage.removeItem(GHOST_TOKEN_NAMESPACE);
  }

  public getUbn(): string {
      const location = this.getLocation();
      return location && location.ubn ? location.ubn : undefined;
  }

  deleteUbn() {
    this.ubn = undefined;
    localStorage.removeItem(UBN_TOKEN_NAMESPACE);
  }

  public setLocation(location: any) {
    this.location = location;
    const stringified = JSON.stringify(location);
    sessionStorage.setItem(UBN_LOCATION_NAMESPACE, stringified);
  }

  public getLocation() {
    const localLocation = JSON.parse(sessionStorage.getItem(UBN_LOCATION_NAMESPACE));
    if (localLocation) {
      this.setLocation(localLocation);
    }
    return this.location;
  }

  public useRvoLogic(): boolean {
    if (!this.getLocation()) {
      return false;
    }
    return this.getLocation().use_rvo_logic !== undefined && this.getLocation().use_rvo_logic;
  }

  public areLocationsLoaded(): boolean {
    return (this.getLocation() !== null && this.getLocation() !== undefined)
      && (this.getLocation().use_rvo_logic !== null && this.getLocation().use_rvo_logic !== undefined);
  }

  public deleteLocation() {
    this.location = this.initialLocation;
    sessionStorage.removeItem(UBN_LOCATION_NAMESPACE);
  }

  deleteTokens() {
    this.deleteAccessToken();
    this.deleteGhostToken();
    this.deleteUbn();
    this.deleteLocation();
  }

}
