import {Component, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';
import {Animal, Ewe, Rearing} from '../../models/animal.model';
import {TranslateService} from '@ngx-translate/core';
import {NSFOService} from '../../services/nsfo-api/nsfo.service';
import {API_URI_GET_ANIMAL_DETAILS} from '../../services/nsfo-api/nsfo.settings';
import {ResponseResultModel} from '../../models/response-result.model';
import * as _ from 'lodash';
import {SettingsService} from '../../services/settings/settings.service';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-rearing-selector-modal',
  templateUrl: 'rearing-selector.component.html'
})
export class RearingSelectorComponent implements OnInit, OnDestroy {

  public country_code_list = [];
  public countryCodeObs;

  @Output() rearingChange = new EventEmitter<Rearing>();

  @Input()
  public disabled: boolean;
  @Input()
  public isLoading: boolean;

  @Input()
  public rearing: Rearing;
  initialRearingDisplayLabel: string;
  rearingDisplayLabel: string;

  @Input()
  motherUln: string;
  @Input()
  childUln: string;

  initialRearing: Rearing;

  foundSurrogate: Ewe;
  isSearchingSurrogate: boolean;
  isSurrogateFound: boolean;

  previouslyFoundSurrogate: Ewe;

  displayModal;
  searchUlnCountryCode: string;
  searchUlnNumber: string;

  public rearingTypes = ['LAMBAR', 'SURROGATE', 'NONE'];
  public selectedRearingType: string;

  constructor(
    private apiService: NSFOService,
    private settings: SettingsService,
    private translate: TranslateService,
    public snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.displayModal = 'none';

    this.getCountryCodeList();

    this.initialRearing = _.cloneDeep(this.rearing);
    this.previouslyFoundSurrogate = _.cloneDeep(this.rearing.surrogate);
    this.setInitialRearingDisplayLabel();
    this.setRearingDisplayLabel();

    this.disabled = false;
    this.isSearchingSurrogate = false;
    this.isSurrogateFound = false;
    this.searchUlnCountryCode = this.ulnCountryCodeSurrogate();
    this.searchUlnNumber = this.ulnNumberSurrogate();

    this.refreshSelectionByRearing();
  }

  ngOnDestroy() {
    this.countryCodeObs.unsubscribe();
  }

  private getCountryCodeList() {
    this.countryCodeObs = this.settings.getCountryList()
      .subscribe(countryCodeList => {
        this.country_code_list = countryCodeList[0];
      });
  }

  public openAnimalWasFoundSnackBar() {
    const message = this.translate.instant('ANIMAL') + ' ' + this.translate.instant('WAS FOUND') + '!';
    this.snackBar.open(message);
  }

  public refreshSelectionByRearing() {
    if (this.rearing.lambar === true) {
      this.selectedRearingType = 'LAMBAR';
    } else if (this.hasSurrogate()) {
      this.selectedRearingType = 'SURROGATE';
    } else {
      this.selectedRearingType = 'NONE';
    }
  }

  public refreshRearingBySelection() {
    switch (this.selectedRearingType) {
      case 'LAMBAR': this.setLambarAsNewRearing(); break;
      case 'SURROGATE':
        if (this.rearing.surrogate) {
          this.setNewRearingUsingSurrogate(this.rearing.surrogate);
        } else if(this.previouslyFoundSurrogate) {
          this.setNewRearingUsingSurrogate(this.previouslyFoundSurrogate);
        }
        break;
      default: this.setNonAsNewRearing(); break;
    }
  }

  public openSurrogateSelection(): boolean {
    return this.selectedRearingType === 'SURROGATE';
  }

  public hasInitialSurrogate(): boolean {
    return this.initialRearing.surrogate != null && this.initialRearing.surrogate.id != null
      && this.initialRearing.surrogate.uln_country_code != null
      && this.initialRearing.surrogate.uln_number != null;
  }

  public hasSurrogate(): boolean {
    return this.rearing.surrogate != null && this.rearing.surrogate.id != null
      && this.rearing.surrogate.uln_country_code != null
      && this.rearing.surrogate.uln_number != null;
  }

  public ulnCountryCodeSurrogate() {
    return this.hasSurrogate() ? this.rearing.surrogate.uln_country_code : null;
  }

  public ulnNumberSurrogate() {
    return this.hasSurrogate() ? this.rearing.surrogate.uln_number : null;
  }

  public hasValidUlnSearchInput() {
    return this.searchUlnCountryCode != null &&
      this.searchUlnCountryCode !== '' &&
      this.searchUlnNumber != null &&
      this.searchUlnNumber !== '';
  }

  public searchUln(): string {
    return (this.searchUlnCountryCode == null ? '' : this.searchUlnCountryCode) +
      (this.searchUlnNumber == null ? '' : this.searchUlnNumber);
  }

  public setNonAsNewRearing() {
    this.rearing = new Rearing();
    this.rearing.lambar = false;
    this.rearing.surrogate = null;
    this.rearing.label = null;
    this.setRearingDisplayLabel();
  }

  public setLambarAsNewRearing() {
    this.rearing = new Rearing();
    this.rearing.lambar = true;
    this.rearing.surrogate = null;
    this.rearing.label = 'LAMBAR';
    this.setRearingDisplayLabel();
  }

  public searchSurrogate() {

    this.isSurrogateFound = false;

    if (!this.isSearchingSurrogate) {

      if (this.searchUln() === '') {
        alert(this.translate.instant('ULN CANNOT BE EMPTY'));

      } else {

        if (this.hasMotherUln() && this.motherUln === this.searchUln()) {
          alert(this.translate.instant('GIVEN ULN IS IDENTICAL TO ULN OF MOTHER'));
          return;
        }

        if (this.childUln === this.searchUln()) {
          alert(this.translate.instant('GIVEN ULN IS IDENTICAL TO OWN ULN'));
          return;
        }

        this.isSearchingSurrogate = true;

        if (this.searchWasEqualToPreviousSurrogate()) {
          this.foundSurrogate = _.cloneDeep(this.previouslyFoundSurrogate);
          this.setNewRearingUsingSurrogate(this.previouslyFoundSurrogate);
          this.isSurrogateFound = true;
          this.isSearchingSurrogate = false;
          this.openAnimalWasFoundSnackBar();
        } else {
          this.apiService.doGetRequest(API_URI_GET_ANIMAL_DETAILS + '/' + this.searchUln()
            + '?minimal_output=true')
            .subscribe(
              (res: ResponseResultModel) => {
                const surrogate: Animal = res.result;
                if (surrogate.gender === 'FEMALE') {
                  this.previouslyFoundSurrogate = _.cloneDeep(this.foundSurrogate);
                  this.foundSurrogate = _.cloneDeep(surrogate);
                  this.setNewRearingUsingSurrogate(surrogate);
                  this.isSurrogateFound = true;
                  this.setRearingDisplayLabel();
                  this.openAnimalWasFoundSnackBar();
                } else {
                  alert(this.translate.instant('FOUND ANIMAL WAS NOT AN EWE'));
                }
                this.isSearchingSurrogate = false;
              },
              error => {
                alert(this.apiService.getErrorMessage(error));
                this.isSearchingSurrogate = false;
              },
            );
        }
      }

    }
  }

  private searchWasEqualToPreviousSurrogate(): boolean {
    if (this.previouslyFoundSurrogate != null &&
      this.previouslyFoundSurrogate.uln_country_code != null &&
      this.previouslyFoundSurrogate.uln_number != null
    ) {
      return this.searchUln() === this.previouslyFoundSurrogate.uln_country_code + this.previouslyFoundSurrogate.uln_number;
    } else {
      return false;
    }
  }

  private setNewRearingUsingSurrogate(surrogate: Ewe) {
    this.rearing = new Rearing();
    this.rearing.lambar = false;
    this.rearing.surrogate = _.cloneDeep(surrogate);
    this.rearing.label = surrogate.uln_country_code + surrogate.uln_number;
    this.setRearingDisplayLabel();
  }

  private setInitialRearingDisplayLabel() {
    this.initialRearingDisplayLabel = '-';
    if (this.initialRearing != null) {
      if (this.initialRearing.lambar === true) {
        this.initialRearingDisplayLabel = this.translate.instant('LAMBAR');
      } else if (this.hasInitialSurrogate()) {
        this.initialRearingDisplayLabel = this.translate.instant('SURROGATE') +
          ': ' + this.ulnCountryCodeSurrogate() + this.ulnNumberSurrogate();
      }
    }
  }

  private setRearingDisplayLabel() {
    this.rearingDisplayLabel = '-';
    if (this.rearing != null) {
      if (this.rearing.lambar === true) {
        this.rearingDisplayLabel = this.translate.instant('LAMBAR');
      } else if (this.hasSurrogate()) {
        this.rearingDisplayLabel = this.translate.instant('SURROGATE') +
          ': ' + this.ulnCountryCodeSurrogate() + this.ulnNumberSurrogate();
      }
    }
  }

  private hasMotherUln(): boolean {
    return this.motherUln != null && this.motherUln !== '';
  }

  private useSelectedRearing() {
    this.setRearingDisplayLabel();
    this.rearingChange.emit(this.rearing);
  }

  clickOK() {
    this.useSelectedRearing();
    this.closeModal();
  }

  clickCancel() {
    this.closeModal();
  }

  openModal() {
    this.displayModal = 'block';
  }

  public closeModal() {
    this.displayModal = 'none';
    this.isSurrogateFound = false;
  }

  reset() {
    this.rearing = _.cloneDeep(this.initialRearing);
    this.setRearingDisplayLabel();
    this.searchUlnCountryCode = this.ulnCountryCodeSurrogate();
    this.searchUlnNumber = this.ulnNumberSurrogate();
    this.rearingChange.emit(this.rearing);
  }

  hasOriginalValues(): boolean {
    if (this.initialRearing == null && this.rearing == null) {
      return true;

    } else if (this.initialRearing != null && this.rearing != null) {

      const isLambarEqual = this.initialRearing.lambar === this.rearing.lambar;
      const isLabelEqual = this.initialRearing.label === this.rearing.label;

      if (this.initialRearing.surrogate != null) {
        return isLambarEqual && isLabelEqual
          && this.rearing.surrogate != null
          && this.initialRearing.surrogate.uln_country_code === this.rearing.surrogate.uln_country_code
          && this.initialRearing.surrogate.uln_number === this.rearing.surrogate.uln_number
          ;
      } else {
        return isLambarEqual && isLabelEqual
          && this.rearing.surrogate == null
          ;
      }
    }
    return false;
  }
}
