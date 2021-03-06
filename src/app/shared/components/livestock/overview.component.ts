import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';

import {
  LIVESTOCK_GENDER_FILTER_OPTIONS, LIVESTOCK_PRODUCTION_FILTER_OPTIONS,
  LIVESTOCK_SORT_OPTIONS,
} from '../../models/animal.model';
import {LivestockFilterPipe} from './pipes/livestockFilter';
import {Router} from '@angular/router';

import {NSFOService} from '../../services/nsfo-api/nsfo.service';
import {Settings} from '../../variables/settings';
import {API_URI_GET_ANIMALS_LIVESTOCK, API_URI_GET_ANIMALS_HISTORIC_LIVESTOCK} from '../../services/nsfo-api/nsfo.settings';
import {UtilsService} from '../../services/utils/utils.services';
import {DownloadService} from '../../services/download/download.service';
import {Subscription} from 'rxjs';
import {Subject} from 'rxjs';
import {PaginationService} from 'ngx-pagination';
import {Mate, MateChangeResponse} from '../../models/nsfo-declare.model';
import {Animal, LivestockAnimal} from '../../models/animal.model';
import {JsonResponseModel} from '../../models/json-response.model';
import {TranslateService} from '@ngx-translate/core';
import { Inject, Injectable } from '@angular/core';
import { LOCAL_STORAGE, StorageService } from 'ngx-webstorage-service';

const fileTypeDropdownMinCount = 2;

export const LIVESTOCK_TYPE_MATE = 'LIVE_STOCK_TYPE_MATE';
export const LIVESTOCK_TYPE_WEIGHT = 'LIVE_STOCK_TYPE_WEIGHT';
export const LIVESTOCK_TYPE_TREATMENT = 'LIVE_STOCK_TYPE_TREATMENT';
export const LIVESTOCK_TYPE_EXPORT = 'LIVE_STOCK_TYPE_EXPORT';

@Component({
    selector: 'app-livestock-overview',
    providers: [PaginationService, LivestockFilterPipe],
    templateUrl: './overview.component.html',
})
export class LivestockOverviewComponent implements OnInit, OnDestroy {
    @Input() selectedFileType: string;
    @Input() file_types_list: string[] = [];
    @Input() view_mode = false;
    @Input() load_historic_animals_in_non_view_mode = false;
    @Input() reportMode = false;
    @Input() onlyFemales = false;
    @Input() disableMultipleSelection = false;
    @Input() enableTagReplace = false;
    @Input() items_per_page = 10;
    @Input() maxSelectionCount: number;
    @Output() selected = new EventEmitter();
    @Input() customType = '';
    @Input() lastMateChanged: Subject<MateChangeResponse>;
    @Input() displaySubUlnText = false;
    @Input() extraDisabledCriteria = false;
    @Input() exportDate = null;
    mateMode = false;
    weightMode = false;
    updateLastMateSubscription: Subscription;
    public livestock_list_initial = <LivestockAnimal[]>[];
    public livestock_list = <LivestockAnimal[]>[];
    public filtered_list = <LivestockAnimal[]>[];
    public historic_livestock_list = <LivestockAnimal[]>[];
    public view_date_format;
    public model_datetime_format;
    public selection_column_one = LIVESTOCK_SORT_OPTIONS[0];
    public order_column_one = this.selection_column_one;
    public selection_column_two = LIVESTOCK_SORT_OPTIONS[1];
    public order_column_two = this.selection_column_two;
    public gender_filter_options = LIVESTOCK_GENDER_FILTER_OPTIONS;
    public production_filter_options = LIVESTOCK_PRODUCTION_FILTER_OPTIONS;
    public genderFilterValue = 'ALL';
    public searchFieldFilter = '';
    @Input() public startDateFieldFilter = '';
    @Input() public endDateFieldFilter = '';
    public breedCodeFilter = null;
    public productionFilterValue = 'ALL';
    public sort_options = LIVESTOCK_SORT_OPTIONS;
    public order_column_uln_asc = true;
    public order_column_one_asc = true;
    public order_column_two_asc = true;
    public order_column_uln = 'uln';
    public selectionCount = 0;
    public selectionList = <LivestockAnimal[]>[];
    // Report options
    public concatBreedValueAndAccuracyColumns = 'YES';

    public isLoading: boolean;
    public filter_toggled = false;
    public report_options_toggled = false;
    public filterHistoric  = 'NO';

    private _export_date;

    get export_date(): any {
      return this._export_date;
    }

    @Input()
    set export_date(val) {
      this._export_date = val;
      this.getLiveStockExport();
    }

  constructor(private apiService: NSFOService,
                private router: Router,
                private settings: Settings,
                public element: ElementRef,
                private filter: LivestockFilterPipe,
                private downloadService: DownloadService,
                private translate: TranslateService,
                private utils: UtilsService,
                @Inject(LOCAL_STORAGE) private storage: StorageService) {
        this.view_date_format = settings.VIEW_DATE_FORMAT;
        this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;
    }

    ngOnInit() {
      const livestockListInStorage = this.storage.get('livestock_list');
        switch (this.customType) {
            case LIVESTOCK_TYPE_MATE:
                this.mateMode = true;
                this.getLivestockMateList();

                if (this.lastMateChanged) {
                    this.updateLastMateSubscription = this.lastMateChanged
                        .subscribe(
                            (declareResult: MateChangeResponse) => {
                                this.updateLastMateAfterDeclare(declareResult);
                            }
                        );
                }

                break;

            case LIVESTOCK_TYPE_WEIGHT:
                this.weightMode = true;
                this.getLivestockLastWeight();
                break;
            case LIVESTOCK_TYPE_EXPORT:
                setTimeout(() => {
                  this.getLiveStockExport();
                }, 3000);
                break;
          default:
                if (typeof livestockListInStorage !== 'undefined') {
                  this.livestock_list = livestockListInStorage;
                } else {
                  this.getLivestockList();
                }

                this.getListValuesFromStorageAndSetAttributes();
                this.clearListValuesFromStorage();
                break;
        }

        if (this.onlyFemales) {
            this.genderFilterValue = 'FEMALE';
        }

        if (this.view_mode || this.load_historic_animals_in_non_view_mode) {
            this.getHistoricAnimals();
        }
    }

    ngOnDestroy() {
        if (this.updateLastMateSubscription) {
            this.updateLastMateSubscription.unsubscribe();
        }
    }

    activateHistoricAnimalsFilter() {
        return this.view_mode || this.load_historic_animals_in_non_view_mode;
    }

    showOptionsBar() {
        return this.showFileTypesDropdown(); // Append with other option checks when necessary
    }

    showFileTypesDropdown() {
        if (this.file_types_list === null) {
            return false;
        }
        return this.file_types_list.length >= fileTypeDropdownMinCount;
    }

    @Input()
    updateLastMateAfterDeclare(declareResult: MateChangeResponse) {
        if (declareResult === null) {
            return;
        }

        if (declareResult.start_date) {
            declareResult.start_date = moment(declareResult.start_date).format(this.settings.VIEW_DATE_FORMAT);
        }
        if (declareResult.end_date) {
            declareResult.end_date = moment(declareResult.end_date).format(this.settings.VIEW_DATE_FORMAT);
        }

        const currentAnimal = _.find(this.livestock_list, {
            uln_country_code: declareResult.ewe.uln_country_code,
            uln_number: declareResult.ewe.uln_number
        });


        let updateLastMateValue = false;

        if (currentAnimal.last_mate === null || currentAnimal.last_mate === undefined ||
          currentAnimal.last_mate.end_date === undefined) {
            updateLastMateValue = true;
        } else {
            const newEndDateMoment = moment(declareResult.end_date, this.settings.VIEW_DATE_FORMAT);
            const currentEndDateMoment = moment(currentAnimal.last_mate.end_date, this.settings.VIEW_DATE_FORMAT);
            updateLastMateValue = newEndDateMoment.isAfter(currentEndDateMoment) || newEndDateMoment.isSame(currentEndDateMoment);
        }


        if (updateLastMateValue) {

            currentAnimal.last_mate = new Mate();
            currentAnimal.last_mate.ram = new Animal();

            currentAnimal.last_mate.start_date = declareResult.start_date;
            currentAnimal.last_mate.end_date = declareResult.end_date;
            currentAnimal.last_mate.ki = declareResult.ki;
            currentAnimal.last_mate.pmsg = declareResult.pmsg;

            let newRamUlnCountryCode = declareResult.ram_uln_country_code;
            let newRamUlnNumber = declareResult.ram_uln_number;
            if (declareResult.ram !== null && declareResult.ram.uln_country_code !== null && declareResult.ram.uln_number) {
                newRamUlnCountryCode = declareResult.ram.uln_country_code;
                newRamUlnNumber = declareResult.ram.uln_number;
            }

            currentAnimal.last_mate.ram.uln_country_code = newRamUlnCountryCode;
            currentAnimal.last_mate.ram.uln_number = newRamUlnNumber;
            currentAnimal.last_mate.ram_uln_country_code = newRamUlnCountryCode;
            currentAnimal.last_mate.ram_uln_number = newRamUlnNumber;

            currentAnimal.last_mate.request_state = declareResult.request_state;

            const currentAnimalIndex = _.findIndex(this.livestock_list, {
                uln_country_code: declareResult.ewe.uln_country_code,
                uln_number: declareResult.ewe.uln_number
            });
            this.livestock_list.splice(currentAnimalIndex, 1, currentAnimal);
        }
    }

    private getLivestockMateList() {
        this.getLivestockListBase('?type=ewes_with_last_mate');
    }

    private getLivestockLastWeight() {
      this.getLivestockListBase('?type=last_weight');
    }

    private getLiveStockExport() {
      this.getLivestockListBase('?type=export&export_date=' + moment(this.export_date).format('D-M-YYYY'));
    }

    private getLivestockList() {
        this.getLivestockListBase('');
    }

    private getLivestockListBase(queryParam: string) {
        this.isLoading = true;
        this.apiService
            .doGetRequest(API_URI_GET_ANIMALS_LIVESTOCK + queryParam)
            .subscribe(
                (res: JsonResponseModel) => {
                    // this.livestock_list = LivestockAnimal.apply(null, new Uint16Array(res));
                    this.livestock_list = <LivestockAnimal[]> res.result;
                    for (const animal of this.livestock_list) {
                        animal.date_of_birth_sort = animal.date_of_birth;
                        animal.date_of_birth = this.getNullCheckedDate(animal.date_of_birth);
                        animal.inflow_date = this.getNullCheckedDate(animal.inflow_date);

                        if (animal.last_mate) {
                            if (animal.last_mate.start_date) {
                                animal.last_mate.start_date = moment(animal.last_mate.start_date).format(this.settings.VIEW_DATE_FORMAT);
                            }
                            if (animal.last_mate.end_date) {
                                animal.last_mate.end_date = moment(animal.last_mate.end_date).format(this.settings.VIEW_DATE_FORMAT);
                            }
                        }

                        if (animal.uln_country_code && animal.uln_number) {
                            animal.uln = animal.uln_country_code + animal.uln_number;
                            animal.ulnLastFive = animal.uln_number.substr(animal.uln_number.length - 5);
                        }

                        if (animal.pedigree_country_code && animal.pedigree_number) {
                            animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
                        }
                        animal.is_public = true;
                        animal.selected = false;

                        animal.collar_number = parseInt(String(animal.collar_number), 0);
                    }

                    this.livestock_list = _.orderBy(this.livestock_list, ['ulnLastFive'], ['asc']);
                    this.filtered_list = this.livestock_list;
                    this.livestock_list_initial = this.livestock_list;
                    this.isLoading = false;
                },
                error => {
                    alert(this.apiService.getErrorMessage(error));
                    this.isLoading = false;
                }
            );
    }

    private getNullCheckedDate(dateString: string): string {
      if (dateString == null) {
        return '--';
      } else {
        return moment(dateString).format(this.settings.VIEW_DATE_FORMAT);
      }
    }

    private getHistoricAnimals() {
        this.apiService
            .doGetRequest(API_URI_GET_ANIMALS_HISTORIC_LIVESTOCK)
            .subscribe(
                (res: JsonResponseModel) => {
                    this.historic_livestock_list = <LivestockAnimal[]> res.result;
                    for (const animal of this.historic_livestock_list) {
                        animal.date_of_birth_sort = animal.date_of_birth;
                        animal.date_of_birth = this.getNullCheckedDate(animal.date_of_birth);
                        animal.inflow_date = this.getNullCheckedDate(animal.inflow_date);

                        if (animal.last_mate) {
                            if (animal.last_mate.start_date) {
                                animal.last_mate.start_date = moment(animal.last_mate.start_date).format(this.settings.VIEW_DATE_FORMAT);
                            }
                            if (animal.last_mate.end_date) {
                                animal.last_mate.end_date = moment(animal.last_mate.end_date).format(this.settings.VIEW_DATE_FORMAT);
                            }
                        }

                        if (animal.uln_country_code && animal.uln_number) {
                            animal.uln = animal.uln_country_code + animal.uln_number;
                            animal.ulnLastFive = animal.uln_number.substr(animal.uln_number.length - 5);
                        }

                        if (animal.pedigree_country_code && animal.pedigree_number) {
                            animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
                        }

                        animal.selected = false;
                    }

                    this.historic_livestock_list = _.orderBy(this.historic_livestock_list, ['ulnLastFive'], ['asc']);
                },
                error => {
                    alert(this.apiService.getErrorMessage(error));
                }
            );
    }

    private showHistoricAnimals(value: string) {

        if (value === 'YES') {
            const combined_list = this.livestock_list.concat(this.historic_livestock_list);
            this.livestock_list = combined_list; // this.historic_livestock_list;
            this.filtered_list = combined_list; // this.historic_livestock_list;
        } else {
            this.livestock_list = this.livestock_list_initial;
            this.filtered_list = this.livestock_list_initial;
        }
    }

    private generateLivestockDocument(fileType: string) {

        const concatBreedValueAndAccuracyColumns = this.concatBreedValueAndAccuracyColumns === 'YES';
        let animals: LivestockAnimal[] = null;

        if (this.isListFiltered()) {
            animals = this.getFilteredList();

            if (animals.length === 0) {
                this.utils.showAlertPopup('NO ANIMALS SELECTED');
                return;
            }
        } else {
          animals = this.livestock_list;
        }

        this.downloadService.doLivestockReportPostRequest(animals, fileType, concatBreedValueAndAccuracyColumns);
    }

    private isListFiltered() {
        return this.isUsedFilter(this.searchFieldFilter) ||
            this.isUsedFilter(this.startDateFieldFilter) ||
            this.isUsedFilter(this.endDateFieldFilter) ||
            this.isUsedFilter(this.genderFilterValue, 'ALL') ||
            this.isUsedFilter(this.breedCodeFilter) ||
            this.isUsedFilter(this.productionFilterValue)
            ;
    }

    private isUsedFilter(value: string, nullValue = '') {
        return value !== nullValue && value !== null;
    }

    private getFilteredList() {
        return this.filter.transform(this.livestock_list, [
            this.searchFieldFilter,
            this.startDateFieldFilter,
            this.endDateFieldFilter,
            this.genderFilterValue,
            this.breedCodeFilter,
            this.productionFilterValue
        ]);
    }

    private declareAnimal(animal: LivestockAnimal) {
        this.selected.emit({
            'animals': [animal],
            'selectionList': this.selectionList,
            'fileType': this.selectedFileType
        });
    }

    private declareAllAnimals() {
        this.selected.emit({
            'animals': this.selectionList,
            'selectionList': this.selectionList,
            'fileType': this.selectedFileType
        });
    }

    private viewAnimalDetails(animal: LivestockAnimal) {
        this.storeListValues();

        if (animal.id != null) {
          this.router.navigate(['/main/livestock/details', animal.id]);
        } else {
          this.router.navigate(['/main/livestock/details', animal.uln]);
        }
    }

    private selectAnimal(event: Event, animal: LivestockAnimal): boolean {
      const target = event.target as HTMLInputElement;
        if (target.checked) {

            if (this.maxSelectionCount !== null && this.maxSelectionCount !== 0) {
                if (this.selectionList.length + 1 > this.maxSelectionCount) {
                    this.utils.showAlertPopup('THE ANIMAL SELECTION CANNOT EXCEED', this.maxSelectionCount);
                    return false;
                }
            }

            animal.selected = true;
            this.selectionList.push(animal);
        }

        if (!target.checked) {
            animal.selected = false;
            const index = this.selectionList.indexOf(animal);
            this.selectionList.splice(index, 1);
        }

        return true;
    }

    private selectAllAnimals(event: Event) {
      const target = event.target as HTMLInputElement;
        if (target.checked) {

            if (this.maxSelectionCount !== null && this.maxSelectionCount !== 0) {
                if (this.selectionList.length + 1 > this.maxSelectionCount) {
                    this.utils.showAlertPopup('THE ANIMAL SELECTION CANNOT EXCEED', this.maxSelectionCount);
                    return;
                }
            }

            for (const animal of this.livestock_list) {
                if (animal.filtered) {
                    const result = this.selectAnimal(event, animal);
                    if (!result) {
                        break;
                    }
                }
            }
        }

        if (!target.checked) {
            for (const animal of this.livestock_list) {
                this.selectAnimal(event, animal);
            }
        }
    }

    public getSelectionValue(selection, animal: LivestockAnimal) {
        switch (selection) {
            case 'PEDIGREE NUMBER':
                return animal.pedigree;

            case 'DATE OF BIRTH':
                return animal.date_of_birth;

            case 'WORK NUMBER':
                return animal.worker_number;

            case 'COLLAR NUMBER':
                return animal.collar_color && animal.collar_number ?
                  this.translate.instant(animal.collar_color) + ' ' + animal.collar_number : null;

            case 'INFLOW DATE':
                return animal.inflow_date;

            case 'GENDER':
                return animal.gender;
        }
    }

    private setOrderULN() {
        this.order_column_uln_asc = !this.order_column_uln_asc;
        this.order_column_one_asc = true;
        this.order_column_two_asc = true;

        if (this.order_column_uln_asc) {
            this.livestock_list = _.orderBy(this.livestock_list, ['ulnLastFive'], ['asc']);
        } else {
            this.livestock_list = _.orderBy(this.livestock_list, ['ulnLastFive'], ['desc']);
        }
    }

    private setOrderColumnOne(direction = '') {
        this.order_column_one_asc = !this.order_column_one_asc;
        this.order_column_uln_asc = true;
        this.order_column_two_asc = true;

        let order = 'asc';
        if (!this.order_column_one_asc) {
            order = 'desc';
        }

        if (direction !== '') {
            order = direction;
            this.order_column_one_asc = true;
        }

        switch (this.selection_column_one) {
            case 'PEDIGREE NUMBER':
                this.livestock_list = _.orderBy(this.livestock_list, ['pedigree'], [order]);
                break;

            case 'DATE OF BIRTH':
                this.livestock_list = _.orderBy(this.livestock_list, ['date_of_birth_sort'], [order]);
                break;

            case 'WORK NUMBER':
                this.livestock_list = _.orderBy(this.livestock_list, ['work_number'], [order]);
                break;

            case 'COLLAR NUMBER':
                this.livestock_list = _.orderBy(this.livestock_list, ['collar_color', 'collar_number'], [order, order]);
                break;

            case 'INFLOW DATE':
                this.livestock_list = _.orderBy(this.livestock_list, ['inflow_date'], [order]);
                break;

            case 'GENDER':
                this.livestock_list = _.orderBy(this.livestock_list, ['gender'], [order]);
                break;
        }
    }

    public getSubUlnText(animal: LivestockAnimal): string {
        const productionValue = animal.production != null ? animal.production : '-';
        const breedCodeValue = animal.breed_code != null ? animal.breed_code : '-';

        return this.translate.instant('PRODUCTION') + ': ' + productionValue + ', ' +
          this.translate.instant('BREED CODE') + ': ' + breedCodeValue;
    }

    private setOrderColumnTwo(direction = '') {
        this.order_column_two_asc = !this.order_column_two_asc;
        this.order_column_uln_asc = true;
        this.order_column_one_asc = true;

        let order = 'asc';
        if (!this.order_column_two_asc) {
            order = 'desc';
        }

        if (direction !== '') {
          order = direction;
          this.order_column_two_asc = true;
        }

        switch (this.selection_column_two) {
            case 'PEDIGREE NUMBER':
                this.livestock_list = _.orderBy(this.livestock_list, ['pedigree'], [order]);
                break;

            case 'DATE OF BIRTH':
                this.livestock_list = _.orderBy(this.livestock_list, ['date_of_birth_sort'], [order]);
                break;

            case 'WORK NUMBER':
                this.livestock_list = _.orderBy(this.livestock_list, ['work_number'], [order]);
                break;

            case 'COLLAR NUMBER':
                this.livestock_list = _.orderBy(this.livestock_list, ['collar_color', 'collar_number'], [order, order]);
                break;

            case 'INFLOW DATE':
                this.livestock_list = _.orderBy(this.livestock_list, ['inflow_date'], [order]);
                break;

            case 'GENDER':
                this.livestock_list = _.orderBy(this.livestock_list, ['gender'], [order]);
                break;
        }
    }

    private storeListValues() {
      this.storage.set('livestock_list', this.livestock_list);
      this.storage.set('selection_column_one', this.selection_column_one);
      this.storage.set('selection_column_two', this.selection_column_two);
      this.storage.set('order_column_one_asc', this.order_column_one_asc);
      this.storage.set('order_column_two_asc', this.order_column_two_asc);
      this.storage.set('startDateFieldFilter', this.startDateFieldFilter);
      this.storage.set('endDateFieldFilter', this.endDateFieldFilter);
      this.storage.set('genderFilterValue', this.genderFilterValue);
      this.storage.set('filter_toggled', this.filter_toggled);
      this.storage.set('filterHistoric', this.filterHistoric);
      this.storage.set('breedCodeFilter', this.breedCodeFilter);
      this.storage.set('productionFilterValue', this.productionFilterValue);
      this.storage.set('searchFieldFilter', this.searchFieldFilter);
  }

  private getListValuesFromStorageAndSetAttributes() {
    const selectionColOne = this.storage.get('selection_column_one');
    const selectionColTwo = this.storage.get('selection_column_two');
    const orderColOneAsc = this.storage.get('order_column_one_asc');
    const orderColTwoAsc = this.storage.get('order_column_two_asc');

    const startDateFieldFilter = this.storage.get('startDateFieldFilter');
    const endDateFieldFilter = this.storage.get('endDateFieldFilter');
    const genderFilterValue = this.storage.get('genderFilterValue');
    const filter_toggled = this.storage.get('filter_toggled');
    const filterHistoric = this.storage.get('filterHistoric');
    const breedCodeFilter = this.storage.get('breedCodeFilter');
    const productionFilterValue = this.storage.get('productionFilterValue');
    const searchFieldFilter = this.storage.get('searchFieldFilter');

    this.selection_column_one = (typeof selectionColOne !== 'undefined' ? selectionColOne : this.selection_column_one);
    this.selection_column_two = (typeof selectionColTwo !== 'undefined' ? selectionColTwo : this.selection_column_two);
    this.order_column_one_asc = (typeof orderColOneAsc !== 'undefined' ? orderColOneAsc : this.order_column_one_asc);
    this.order_column_two_asc = (typeof orderColTwoAsc !== 'undefined' ? orderColTwoAsc : this.order_column_two_asc);

    this.startDateFieldFilter = (
      typeof startDateFieldFilter !== 'undefined' ? startDateFieldFilter : ''
    );
    this.endDateFieldFilter = (typeof endDateFieldFilter !== 'undefined' ? endDateFieldFilter : '');
    this.genderFilterValue = (typeof genderFilterValue !== 'undefined' ? genderFilterValue : 'ALL');
    this.filter_toggled = (typeof filter_toggled !== 'undefined' ? filter_toggled : this.filter_toggled);
    this.filterHistoric = (typeof filterHistoric !== 'undefined' ? filterHistoric : this.filterHistoric);
    this.breedCodeFilter = (typeof breedCodeFilter !== 'undefined' ? breedCodeFilter : this.breedCodeFilter);
    this.productionFilterValue = (typeof productionFilterValue !== 'undefined' ? productionFilterValue : this.productionFilterValue);
    this.searchFieldFilter = (typeof searchFieldFilter !== 'undefined' ? searchFieldFilter : this.searchFieldFilter);
  }

  private clearListValuesFromStorage() {
    this.storage.remove('livestock_list');
    this.storage.remove('selection_column_one');
    this.storage.remove('selection_column_two');
    this.storage.remove('order_column_one_asc');
    this.storage.remove('order_column_two_asc');
    this.storage.remove('startDateFieldFilter');
    this.storage.remove('endDateFieldFilter');
    this.storage.remove('genderFilterValue');
    this.storage.remove('filter_toggled');
    this.storage.remove('filterHistoric');
    this.storage.remove('breedCodeFilter');
    this.storage.remove('productionFilterValue');
    this.storage.remove('searchFieldFilter');
  }
}
