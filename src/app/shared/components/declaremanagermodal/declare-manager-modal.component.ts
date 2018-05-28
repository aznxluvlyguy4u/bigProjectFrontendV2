import {Component, OnDestroy, OnInit} from '@angular/core';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {Subscription} from 'rxjs';
import {DeclareManagerItem} from '../../services/declaremanager/declare-manager-item.model';
import {DeclareManagerService} from '../../services/declaremanager/declare-manager.service';
import {CheckMarkComponent} from '../checkmark/check-mark.component';
import {SettingsService} from '../../services/settings/settings.service';
import * as moment from 'moment';

@Component({
  selector: 'app-declare-manager-modal',
  templateUrl: './declare-manager-modal.component.html',
  directives: [CheckMarkComponent]
})
export class DeclareManagerModalComponent implements OnInit, OnDestroy {
  title = 'DECLARES';
  public declareItemsShownInModal: DeclareManagerItem[];
  private modalDisplay = 'none';
  private declareItemRequestSubscription: Subscription;
  private isModalActiveSubscription: Subscription;
  private toggleModalSubscription: Subscription;

  constructor(private declareItemService: DeclareManagerService, private translate: TranslateService,
              private settings: SettingsService) {
  }


  ngOnInit() {

    this.declareItemRequestSubscription = this.declareItemService.declareItemsShownInModalChanged.subscribe(
      (declareItems: DeclareManagerItem[]) => {
        this.declareItemsShownInModal = declareItems;
        this.closeIfEmpty();
      }
    );
    this.declareItemsShownInModal = this.declareItemService.getDeclareManagerItemsShownInModal();


    this.isModalActiveSubscription = this.declareItemService.isModalActive.subscribe(
      (notifyUser: boolean) => {
        if (notifyUser) {
          this.openModal();
        } else {
          this.closeModal();
        }
      }
    );


    this.toggleModalSubscription = this.declareItemService.toggleIsModalActive.subscribe(
      (toggleModal: boolean) => {
        if (toggleModal) {
          this.toggleModal();
        }
      }
    );
  }

  closeIfEmpty() {
    if (this.declareItemsShownInModal.length === 0) {
      this.closeModal();
    }
  }

  ngOnDestroy() {
    this.declareItemRequestSubscription.unsubscribe();
    this.isModalActiveSubscription.unsubscribe();
    this.toggleModalSubscription.unsubscribe();
  }

  public openModal() {
    this.modalDisplay = 'block';
  }

  public closeModal() {
    this.modalDisplay = 'none';
  }

  public toggleModal() {
    if (this.modalDisplay === 'none') {
      this.openModal();
    } else {
      this.closeModal();
    }
  }


  getFormattedDate(dateString: string): string {
    return dateString ? moment(dateString, this.settings.getModelDateFormat()).format(this.settings.getViewDateFormat()) : '-';
  }

  getDeclareDateType(declare: DeclareManagerItem): string {
    const declareType = declare && declare.declareType ? declare.declareType : undefined;
    return this.translate.instant(DeclareManagerService.getDeclareDateType(declareType));
  }

  public resetDeclareItemsList() {
    this.declareItemService.resetDeclareItemsList();
  }

  public removeHiddenAndCompletedDeclares() {
    this.declareItemService.removeHiddenAndCompletedDeclares();
  }

  public isModalEmpty(): boolean {
    return this.declareItemService.isModalEmpty();
  }

  public hasFailedDeclares() {
    return this.declareItemService.failedDeclareItemsCount > 0;
  }

  public hasCompletedAndHiddenDeclares(): boolean {
    return this.declareItemService.completedValidDeclareItemsCount > 0 || this.declareItemService.failedDeclareItemsCount > 0;
  }
}
