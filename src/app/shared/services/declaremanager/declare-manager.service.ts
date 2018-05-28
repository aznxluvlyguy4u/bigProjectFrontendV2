import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {NSFOService} from '../nsfo-api/nsfo.service';
import {DeclareManagerItem} from './declare-manager-item.model';
import {API_URI_DECLARE_BIRTH} from '../nsfo-api/nsfo.settings';
import {TranslateService} from '@ngx-translate/core';
import * as _ from 'lodash';
import {BirthRequest} from '../../../rvo-declares/birth/birth.model';


export const BIRTH = 'BIRTH';

@Injectable()
export class DeclareManagerService {
  isModalActive = new Subject<boolean>();
  toggleIsModalActive = new Subject<boolean>();
  declareItemsChanged = new Subject<DeclareManagerItem[]>();
  declareItemsShownInModalChanged = new Subject<DeclareManagerItem[]>();

  declareBirthResultChanged = new Subject<boolean>();
  failedDeclareItemsCount: number;
  completedValidDeclareItemsCount: number;
  private declareItems: DeclareManagerItem[];
  private declareItemsShownInModal: DeclareManagerItem[];
  private lastId: number;

  constructor(private nsfo: NSFOService, private translator: TranslateService) {
    this.resetDeclareItemsList();
  }

  static getDeclareDateType(declareType: string): string {
    switch (declareType) {
      case BIRTH:
        return 'DATE OF BIRTH';
      default:
        return 'EVENT DATE';
    }
  }

  static generateHash(declareType: string, declareDate: string, jsonBody: any): string {
    return btoa(declareType + declareDate + JSON.stringify(jsonBody));
  }

  resetDeclareItemsList() {
    this.declareItems = [];
    this.lastId = 0;
    this.notifyDeclareItemsListsChanged();
    this.failedDeclareItemsCount = 0;
    this.completedValidDeclareItemsCount = 0;
  }

  removeHiddenAndCompletedDeclares() {
    this.declareItems = _.filter(this.declareItems, function (item: DeclareManagerItem) {
      return !item.isHidden && !item.isCompleted;
    });
    this.notifyDeclareItemsListsChanged();
  }

  getNewDeclareManagerItem(declareType: string, declareDate: string, jsonBody: any): DeclareManagerItem {
    const hash = DeclareManagerService.generateHash(declareType, declareDate, jsonBody);

    if (this.isDuplicateDeclareManagerItem(hash)) {
      console.log('blocked duplicate declare');
      return null;
    }

    const item = new DeclareManagerItem();
    item.id = this.getNextId();
    item.isCompleted = false;
    item.isFailed = false;
    item.declareType = declareType;
    item.isHidden = false;
    item.logDate = new Date();
    item.declareDate = declareDate;
    item.hash = hash;
    return item;
  }

  getDeclareManagerItems(): DeclareManagerItem[] {
    return this.declareItems;
  }

  getDeclareManagerItemsShownInModal(): DeclareManagerItem[] {
    return this.declareItemsShownInModal;
  }

  getDeclaresInModalCount(): number {
    return this.declareItemsShownInModal.length;
  }

  isModalEmpty(): boolean {
    return this.getDeclaresInModalCount() === 0;
  }

  addDeclareItem(item: DeclareManagerItem) {
    this.declareItems.push(item);
    this.notifyDeclareItemsListsChanged();
  }

  failDeclareItem(item: DeclareManagerItem, error: any = null, request: any) {
    item.isFailed = true;
    item.isCompleted = true;
    if (error !== null) {
      item.errorMessage = this.nsfo.getErrorMessage(error);
    }
    this.updateDeclareItem(item);
    this.openDeclareItemsModal();
    this.emitResultNotification(request, false);
  }

  completeDeclareItemPreparation(item: DeclareManagerItem, request: any, removeSuccessfulDeclares: boolean) {
    item.isCompleted = true;
    this.updateDeclareItem(item);

    if (removeSuccessfulDeclares) {
      this.removeHiddenAndCompletedDeclares();
    } else {
      this.openDeclareItemsModal();
    }

    this.emitResultNotification(request, true);
  }

  hideDeclareItem(item: DeclareManagerItem): DeclareManagerItem {
    item.isHidden = true;
    this.updateDeclareItem(item);
    return item;
  }

  public openDeclareItemsModal() {
    this.updateModalNotificationStatus(true);
  }

  public closeDeclareItemModal() {
    this.updateModalNotificationStatus(false);
  }

  public toggleDeclareItemsModal() {
    this.toggleIsModalActive.next(true);
  }

  updateDeclareManagerItemsShownForModal() {
    this.declareItemsShownInModal = _.filter(this.declareItems, function (item: DeclareManagerItem) {
      return (!item.isHidden) || item.isFailed;
    });
  }

  updateFailedDeclareItemCount() {
    this.failedDeclareItemsCount = _.filter(this.declareItems, {isFailed: true}).length;
  }

  updateCompletedValidDeclareItemCount() {
    this.completedValidDeclareItemsCount = _.filter(this.declareItems, {isFailed: false, isCompleted: true}).length;
  }

  doDeclareBirth(birthRequest: BirthRequest) {
    const item = this.getNewDeclareManagerItem(BIRTH, birthRequest.date_of_birth, birthRequest);
    this.doDeclareItemsPostRequest(API_URI_DECLARE_BIRTH, birthRequest, item);
  }

  private getNextId(): number {
    this.lastId++;
    return this.lastId;
  }

  private updateDeclareItem(item: DeclareManagerItem) {
    const index = _.findIndex(this.declareItems, {id: item.id});
    this.declareItems[index] = item;
    this.notifyDeclareItemsListsChanged();
  }

  private isDuplicateDeclareManagerItem(hash: string): boolean {
    return _.findIndex(this.declareItems,
      {hash: hash, isCompleted: false, isFailed: false}
    ) !== -1;
  }

  private updateModalNotificationStatus(openModal: boolean) {
    this.isModalActive.next(openModal);
  }

  private notifyDeclareItemsListsChanged() {
    this.declareItemsChanged.next(this.declareItems.slice());
    this.updateDeclareManagerItemsShownForModal();
    this.updateFailedDeclareItemCount();
    this.updateCompletedValidDeclareItemCount();
    this.declareItemsShownInModalChanged.next(this.declareItemsShownInModal.slice());
  }

  private doDeclareItemsPostRequest(uri: string, request: any, item: DeclareManagerItem) {

    if (item === null) {
      return;
    }

    item.description = this.getDeclareItemDescription(request);
    this.addDeclareItem(item);

    return new Promise((resolve, reject) => {
      this.nsfo
        .doPostRequest(uri, request)
        .toPromise()
        .then(
          res => {
            this.completeDeclareItemPreparation(item, request, true);
            resolve();
          },
          error => {
            this.failDeclareItem(item, error, request);
            reject(error);
          }
        );
    });
  }

  private getDeclareItemDescription(declareNsfo: any): string {
    if (declareNsfo === null) {
      return '';
    }

    if (declareNsfo instanceof BirthRequest) {
      return this.getBirthDescription(declareNsfo);
    }
  }

  private getBirthDescription(declareNsfo: BirthRequest): string {
    let description = '';

    if (declareNsfo.mother && declareNsfo.mother.uln_country_code && declareNsfo.mother.uln_number) {
      description += this.translator.instant('FEMALE_SHEEP') + ' '
        + declareNsfo.mother.uln_country_code + declareNsfo.mother.uln_number;
    }

    if (declareNsfo.father && declareNsfo.father.uln_country_code && declareNsfo.father.uln_number) {
      description += ',' + this.translator.instant('MALE_SHEEP') + ' '
        + declareNsfo.father.uln_country_code + declareNsfo.father.uln_number;
    }

    description += ', ' + declareNsfo.litter_size + ' ' + this.translator.instant('BORN ALIVE');
    description += ', ' + declareNsfo.stillborn_count + ' ' + this.translator.instant('STILLBORN');

    return description;
  }

  private emitResultNotification(declareNsfo: any, isSuccess: boolean) {
    if (declareNsfo instanceof BirthRequest) {
      this.declareBirthResultChanged.next(isSuccess);
    }
  }
}
