import * as moment from 'moment';
import * as _ from 'lodash';
import {Component, ElementRef, EventEmitter, Input, OnDestroy, OnInit, Output} from '@angular/core';

import {
    LIVESTOCK_GENDER_FILTER_OPTIONS,
    LIVESTOCK_SORT_OPTIONS,
} from '../../models/animal.model';
import {LivestockFilterPipe} from './pipes/livestockFilter';
import {Router} from '@angular/router';

import {NSFOService} from '../../services/nsfo-api/nsfo.service';
import {Settings} from '../../variables/settings';
import {API_URI_GET_ANIMALS, API_URI_GET_HISTORIC_ANIMALS} from '../../services/nsfo-api/nsfo.settings';
import {UtilsService} from '../../services/utils/utils.services';
import {DownloadService} from '../../services/download/download.service';
import {Subscription} from 'rxjs';
import {Subject} from 'rxjs';
import {NgxPaginationModule} from 'ngx-pagination';
import {Mate, MateChangeResponse} from '../../models/nsfo-declare.model';
import {Animal, LivestockAnimal} from '../../models/animal.model';
import {JsonResponseModel} from '../../models/json-response.model';

const fileTypeDropdownMinCount = 2;

export const LIVESTOCK_TYPE_MATE = 'LIVE_STOCK_TYPE_MATE';

@Component({
    selector: 'app-livestock-overview',
    providers: [NgxPaginationModule, LivestockFilterPipe],
    templateUrl: './overview.component.html',
})
export class LivestockOverviewComponent implements OnInit, OnDestroy {
    @Input() selectedFileType: string;
    @Input() file_types_list: string[] = [];
    @Input() view_mode = false;
    @Input() load_historic_animals_in_non_view_mode = false;
    @Input() weightMode = false;
    @Input() reportMode = false;
    @Input() onlyFemales = false;
    @Input() disableMultipleSelection = false;
    @Input() enableTagReplace = false;
    @Input() items_per_page = 10;
    @Input() maxSelectionCount: number;
    @Output() selected = new EventEmitter();
    @Input() customType = '';
    mateMode = false;
    updateLastMateSubscription: Subscription;
    @Input() lastMateChanged: Subject<MateChangeResponse>;
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
    public genderFilterValue = 'ALL';
    public searchFieldFilter = '';
    @Input() public startDateFieldFilter = '';
    @Input() public endDateFieldFilter = '';
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

    constructor(private apiService: NSFOService,
                private router: Router,
                private settings: Settings,
                public element: ElementRef,
                private filter: LivestockFilterPipe,
                private downloadService: DownloadService,
                private utils: UtilsService) {
        this.view_date_format = settings.VIEW_DATE_FORMAT;
        this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;
    }

    ngOnInit() {

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
            default:
                this.getLivestockList();
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
        this.getLivestockListBase('?is_ewes_with_last_mate=true');
    }

    private getLivestockList() {
        this.getLivestockListBase('');
    }

    private getLivestockListBase(queryParam: string) {
        this.isLoading = true;
        this.apiService
            .doGetRequest(API_URI_GET_ANIMALS + queryParam)
            .subscribe(
                (res: JsonResponseModel) => {
                    // this.livestock_list = LivestockAnimal.apply(null, new Uint16Array(res));
                    this.livestock_list = <LivestockAnimal[]> res.result;
                    for (const animal of this.livestock_list) {
                        animal.date_of_birth_sort = animal.date_of_birth;
                        animal.date_of_birth = moment(animal.date_of_birth).format(this.settings.VIEW_DATE_FORMAT);
                        animal.inflow_date = moment(animal.inflow_date).format(this.settings.VIEW_DATE_FORMAT);

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

    private getHistoricAnimals() {
        this.apiService
            .doGetRequest(API_URI_GET_HISTORIC_ANIMALS)
            .subscribe(
                (res: JsonResponseModel) => {
                    this.historic_livestock_list = <LivestockAnimal[]> res.result;
                    for (const animal of this.historic_livestock_list) {
                        animal.date_of_birth_sort = animal.date_of_birth;
                        animal.date_of_birth = moment(animal.date_of_birth).format(this.settings.VIEW_DATE_FORMAT);
                        animal.inflow_date = moment(animal.inflow_date).format(this.settings.VIEW_DATE_FORMAT);

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
        }

        this.downloadService.doLivestockReportPostRequest(animals, fileType, concatBreedValueAndAccuracyColumns);
    }

    private isListFiltered() {
        return this.isUsedFilter(this.searchFieldFilter) ||
            this.isUsedFilter(this.startDateFieldFilter) ||
            this.isUsedFilter(this.endDateFieldFilter) ||
            this.isUsedFilter(this.genderFilterValue, 'ALL')
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
        this.router.navigate(['/main/livestock/details', animal.uln]);
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

    private getSelectionValue(selection, animal: LivestockAnimal) {
        switch (selection) {
            case 'PEDIGREE NUMBER':
                return animal.pedigree;

            case 'DATE OF BIRTH':
                return animal.date_of_birth;

            case 'WORK NUMBER':
                return animal.work_number;

            case 'COLLAR NUMBER':
                return animal.collar_number;

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

    private setOrderColumnOne() {
        this.order_column_one_asc = !this.order_column_one_asc;
        this.order_column_uln_asc = true;
        this.order_column_two_asc = true;

        let order = 'asc';
        if (!this.order_column_one_asc) {
            order = 'desc';
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
                this.livestock_list = _.orderBy(this.livestock_list, ['collar_number'], [order]);
                break;

            case 'INFLOW DATE':
                this.livestock_list = _.orderBy(this.livestock_list, ['inflow_date'], [order]);
                break;

            case 'GENDER':
                this.livestock_list = _.orderBy(this.livestock_list, ['gender'], [order]);
                break;
        }
    }

    private setOrderColumnTwo() {
        this.order_column_two_asc = !this.order_column_two_asc;
        this.order_column_uln_asc = true;
        this.order_column_one_asc = true;

        let order = 'asc';
        if (!this.order_column_two_asc) {
            order = 'desc';
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
                this.livestock_list = _.orderBy(this.livestock_list, ['collar_number'], [order]);
                break;

            case 'INFLOW DATE':
                this.livestock_list = _.orderBy(this.livestock_list, ['inflow_date'], [order]);
                break;

            case 'GENDER':
                this.livestock_list = _.orderBy(this.livestock_list, ['gender'], [order]);
                break;
        }
    }

}
