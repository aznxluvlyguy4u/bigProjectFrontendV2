import { Component, OnInit, OnDestroy } from '@angular/core';
import {LivestockAnimal, LIVESTOCK_GENDER_FILTER_OPTIONS, Animal} from '../../../shared/models/animal.model';
import {
  Child, CandidateFathersRequest, CandidateSurrogatesRequest, BIRTH_PROGRESS_TYPES,
  CandidateMothersRequest
} from '../../birth/birth.model';
import {Animal} from '../../../shared/models/animal.model';
import { PapaParseService } from 'ngx-papaparse';
import { Settings } from '../../../shared/variables/settings';
import {
  API_URI_DECLARE_ARRIVAL,
  API_URI_DECLARE_BIRTH,
  API_URI_GET_EWES_IN_LIVESTOCK,
  API_URI_GET_HISTORIC_EWES_IN_LIVESTOCK,
} from '../../../shared/services/nsfo-api/nsfo.settings';
import { NSFOService } from '../../../shared/services/nsfo-api/nsfo.service';
import * as moment from 'moment';
import { JsonResponseModel } from '../../../shared/models/json-response.model';
import { SettingsService } from '../../../shared/services/settings/settings.service';
import {Router} from '@angular/router';
import {SortOrder, SortService} from '../../../shared/services/utils/sort.service';
import {TranslateService} from '@ngx-translate/core';
import {ArrivalRequest} from '../arrival.model';

interface ArrivalCsvRow {
  index: number;
  electronicId: string;
  tag: string;
  currentAdg: string;
  note: string;
  scanned_date: string;
  date_of_arrival: string;
  ubn_previous_owner: string;
  tmp_animal: LivestockAnimal;
}

class ExtendedArrivalRequest extends ArrivalRequest {
  public index: number;
  public is_aborted: boolean;
  public scanned_date: string;
  public animalUlnCountryCodeOnlyHasChanged = false;
  public animalHasChanged = false;
  // public hasMultipleCandidateFathers = false;
  public animalMissingUlnCountryCode = true;
  public animalHasOnlyWorkerNumber = false;
  // surrogateMotherMissingUlnCountryCode = false;
  public datePickerDisabled = true;
  public ubnPreviousOwnerDisabled = true;
  public hasWarnings = false;
  public declareStatus: boolean;
  public isSubmitting: boolean;
  public errorMessage: string;
  constructor() {
    super();
    this.declareStatus = null;
  }
}

@Component({
  selector: 'app-csv',
  templateUrl: './arrival.csv.html',
  styleUrls: ['./arrival.csv.sass']
})
export class ArrivalCsvComponent implements OnInit, OnDestroy {

  public country_code_list = [];
  private countryCodeObs;
  private birth_progress_types = BIRTH_PROGRESS_TYPES;

  warningModalDisplay = 'none';
  warningModalMode = 'all';

  loadingStatesCount = 0;
  arrivalRequestWarningsCount = 0;
  csvFormatError = false;
  // isLoadingCandidateSurrogates = false;
  // isLoadingCandidateMothers = false;
  // isLoadingCandidateFathers = false;
  ewesLoaded = false;
  historicEwesLoaded = false;

  multipleCandidateFatherBirthRequests = <ExtendedArrivalRequest[]>[];
  missingAnimalArrivalRequests = <ExtendedArrivalRequest[]>[];
  missingSurrogateMotherBirthRequests = <ExtendedArrivalRequest[]>[];
  arrivalRequests: ArrivalRequest[] = [];

  suggestedCandidateFathers = <LivestockAnimal[]>[];
  suggestedCandidateMothers = <LivestockAnimal[]>[];
  candidateSurrogates = <LivestockAnimal[]>[];
  parsedAnimals = <LivestockAnimal[]>[];
  ewesInLivestock = <LivestockAnimal[]>[];

  csvRows: ArrivalCsvRow[] = [];
  parsedResults: any;
  parsedFile: any;
  public view_date_format;
  public model_datetime_format;

  private selectedArrivalRequest: ExtendedArrivalRequest;
  private selectedChild;

  private candidateFathersRequest = new CandidateFathersRequest();
  private candidateMothersRequest = new CandidateMothersRequest();
  private candidateSurrogatesRequest = new CandidateSurrogatesRequest();

  constructor(
    private papa: PapaParseService,
    private settings: Settings,
    private apiService: NSFOService,
    private settingService: SettingsService,
    private router: Router,
    private sort: SortService,
    private translate: TranslateService
  ) {
    this.view_date_format = settingService.getViewDateFormat();
    this.model_datetime_format = settingService.getModelDateTimeFormat();
  }

  ngOnInit() {
    this.countryCodeObs = this.settingService.getCountryList()
      .subscribe(countryCodeList => {
        this.country_code_list = countryCodeList[0];
      });

    // this.getEwesInLivestock();
  }

  resetPrivateVariables() {
    this.arrivalRequestWarningsCount = 0;
    // this.birthRequests = [];
    this.parsedAnimals = [];
    // this.multipleCandidateFatherBirthRequests = [];
    // this.missingMotherBirthRequests = [];
    // this.missingSurrogateMotherBirthRequests = [];
    this.suggestedCandidateFathers = [];
    this.suggestedCandidateMothers = [];
    this.candidateSurrogates = [];
    // this.selectedBirthRequest = null;
    this.csvRows = [];
    this.parsedResults = null;
    this.parsedFile = null;
  }

  handleFileInput(files: FileList) {
    this.resetPrivateVariables();
    this.papa.parse(files.item(0), {
      skipEmptyLines: true,
      complete: (results, file) => {
        if (this.isValidCsv(results)) {
          this.parsedResults = results;
          this.parsedFile = file;
          const rows = this.toRows(this.parsedResults.data);
          this.toArrivalRequests();
        } else {
          alert(this.translate.instant('CSV FORMAT ERROR'));
        }
      },
      error: (error, file) => {
        alert(error);
      }
    });
  }

  toRows(rows: any) {
    rows.shift();

    this.csvRows = [];
    rows.forEach((row: any) => {
      const csvRow: ArrivalCsvRow = {
        index: null,
        electronicId: row[0], // Electronic ID // A
        tag: row[1], // Tag // B
        currentAdg: row[2], // Current ADG // C
        note: row[3], // Note // D
        scanned_date: row[4], // Scanned Date // E
        date_of_arrival: row[5], // Dat aanv // F
        ubn_previous_owner: row[6], // UBN // G
        tmp_animal: new LivestockAnimal(),
      };
      this.resolveCsvRowAnimal(csvRow);
      this.csvRows.push(csvRow);
    });

    return this.csvRows;
  }

  isValidCsv(csvResults) {
    this.csvFormatError = csvResults.meta.delimiter !== ',';

    // make a deep clone of the result array
    const tmpCsvResults = JSON.parse(JSON.stringify(csvResults.data));
    tmpCsvResults.shift();
    tmpCsvResults.forEach((row: any) => {
      if (
        row.length === 7
        && (row[4] && !moment(row[4]).isValid())
        && ((row[5] && !moment(row[5]).isValid()) || !row[5])
      ) {
        this.csvFormatError = true;
      }
    });

    return !this.csvFormatError;
  }

  countryNumberToCountryIdentifier(iso: string) {
    // TODO: Implement logic to return actual country identifier.
    return this.settingService.getCountryCodeByIso(iso);
  }

  toArrivalRequests() {
    let index = 0;
    let currentScannedDate = null;
    let currentDateOfArrival = null;
    let currentUBN = null;
    let currentAnimalGroup = <ArrivalCsvRow[]>[];

    this.csvRows.forEach((csvRow) => {

      const csvRowScannedDate = moment(csvRow.scanned_date).format(this.settings.MODEL_DATE_FORMAT);
      const csvRowDateOfArrival = moment(csvRow.date_of_arrival).format(this.settings.MODEL_DATE_FORMAT);

      // if (
      //   csvRowScannedDate !== currentScannedDate
      //   || (
      //     csvRowDateOfArrival !== 'Invalid date'
      //     && (currentDateOfArrival && currentDateOfArrival !== 'Invalid date')
      //     && csvRowDateOfArrival !== currentDateOfArrival
      //   )
      // ) {
      //   nextGroup = true;
      //   currentAnimalGroup = <ArrivalCsvRow[]>[];
      //   // console.log(csvRow);
      // }

      currentScannedDate = csvRowScannedDate;
      currentDateOfArrival = (csvRowDateOfArrival && csvRowDateOfArrival !== 'Invalid date') ? csvRowDateOfArrival : currentDateOfArrival;
      currentUBN = (csvRow.ubn_previous_owner) ? csvRow.ubn_previous_owner : currentUBN;
      csvRow.index = index;
      currentAnimalGroup.push(csvRow);

      // Check if next row is of different group
      const nextRow: ArrivalCsvRow = this.csvRows[index + 1];
      const nextCsvRowScannedDate = nextRow ? moment(nextRow.scanned_date).format(this.settings.MODEL_DATE_FORMAT) : null;
      const nextCsvRowDateOfArrival = nextRow ? moment(nextRow.date_of_arrival).format(this.settings.MODEL_DATE_FORMAT) : null;

      if (
        nextCsvRowScannedDate !== currentScannedDate
        || (
          nextCsvRowDateOfArrival !== 'Invalid date'
          && (currentDateOfArrival && currentDateOfArrival !== 'Invalid date')
          && nextCsvRowDateOfArrival !== currentDateOfArrival
        )
      ) {
        currentAnimalGroup.forEach((row) => {
          // instantiate a new ArrivalRequest
          const arrivalRequest = new ExtendedArrivalRequest();
          this.resolveArrivalRequestAnimal(row, arrivalRequest);
          arrivalRequest.index = row.index;
          arrivalRequest.is_aborted = false;
          arrivalRequest.arrival_date = currentDateOfArrival;
          arrivalRequest.is_import_animal = false;
          arrivalRequest.ubn_previous_owner = currentUBN;
          arrivalRequest.animal = row.tmp_animal;
          arrivalRequest.scanned_date = row.scanned_date;

          this.validateArrivalRequest(arrivalRequest);

          this.arrivalRequests.push(arrivalRequest);
        });

        // Reset array
        currentAnimalGroup = <ArrivalCsvRow[]>[];
      }
      index++;
    });

  }

  resolveCsvRowAnimal(csvRow) {
    // Determine animal
    const ulnUnProcessed = csvRow.electronicId.split(' ');
    const animal = new LivestockAnimal();

    // if electronicId consists of 2 parts: 3 digits country number and 12 digits tag number
    // and there is no tag in csv or tag in csv is the same as electronicId tag
    if (
      ulnUnProcessed.length === 2
      && ulnUnProcessed[0].length === 3
      && ulnUnProcessed[1].length === 12
      && /^\d+$/.test(ulnUnProcessed[1])
      && (!csvRow.tag || csvRow.tag === ulnUnProcessed[1])
    ) {
      animal.uln_country_code = this.countryNumberToCountryIdentifier(ulnUnProcessed[0]);
      animal.uln_number = ulnUnProcessed[1];
      animal.uln = animal.uln_country_code + animal.uln_number;
      // if electronicId consists of only 1 part: 12 digits tag number and the country number is missing
      // and there is no tag in csv or tag in csv is the same as electronicId tag
    } else if (
      ulnUnProcessed.length === 1
      && ulnUnProcessed[0].length === 12
      && /^\d+$/.test(ulnUnProcessed[0])
      && (!csvRow.tag || csvRow.tag === ulnUnProcessed[0])
    ) {
      animal.uln_number = ulnUnProcessed[0];
      // if electronicId is missing but csv has tag and is 12 digits long
    } else if (
      ulnUnProcessed.length === 1
      && ulnUnProcessed[0] === ''
      && csvRow.tag
      && csvRow.tag.length === 12
      && /^\d+$/.test(csvRow.tag)
    ) {
      animal.uln_number = csvRow.tag;
    } else if (
      // if electronicId is missing but csv has tag and is 5 digits long
      ulnUnProcessed.length === 1
      && ulnUnProcessed[0] === ''
      && csvRow.tag.length === 5
      && /^\d+$/.test(csvRow.tag)
    ) {
      animal.worker_number = csvRow.tag;
    }

    csvRow.tmp_animal = animal;

    this.parsedAnimals.push(csvRow.tmp_animal);
  }

  resolveArrivalRequestAnimal(csvRow: ArrivalCsvRow, arrivalRequest: ExtendedArrivalRequest) {
    arrivalRequest.animal = csvRow.tmp_animal;

    // if electronicId consists of 2 parts: 3 digits country number and 12 digits tag number
    // and there is no tag in csv or tag in csv is the same as electronicId tag
    if (
      arrivalRequest.animal.uln_country_code
      && arrivalRequest.animal.uln_number
      && arrivalRequest.animal.uln
    ) {
      arrivalRequest.animalMissingUlnCountryCode = false;
      // if electronicId consists of only 1 part: 12 digits tag number and the country number is missing
      // and there is no tag in csv or tag in csv is the same as electronicId tag
    } else if (
      !arrivalRequest.animal.uln_country_code
      && arrivalRequest.animal.uln_number
      && !arrivalRequest.animal.uln
    ) {
      arrivalRequest.animalMissingUlnCountryCode = true;
      // if electronicId is missing but csv has tag and is 12 digits long
    } else if (
      !arrivalRequest.animal.uln_country_code
      && !arrivalRequest.animal.uln_number
      && !arrivalRequest.animal.uln
      && arrivalRequest.animal.worker_number
    ) {
      arrivalRequest.animalHasOnlyWorkerNumber = true;
      arrivalRequest.animal.uln_number = arrivalRequest.animal.worker_number;
    }
  }

  toggleDatePicker(arrivalRequest: ExtendedArrivalRequest) {
    arrivalRequest.datePickerDisabled = !arrivalRequest.datePickerDisabled;
  }

  toggleUbnPreviousOwner(arrivalRequest: ExtendedArrivalRequest) {
    arrivalRequest.ubnPreviousOwnerDisabled = !arrivalRequest.ubnPreviousOwnerDisabled;
  }

  setCandidateFathers(birthRequest) {

    if (!birthRequest.mother.uln) {
      return;
    }

    birthRequest.suggestedCandidateFathersIsLoading = true;
    this.loadingStatesCount++;

    this.isLoadingCandidateFathers = true;

    this.candidateFathersRequest.date_of_birth = moment(birthRequest.date_of_birth).format(this.settings.MODEL_DATETIME_FORMAT);
    this.candidateFathersRequest.date_of_birth = moment(birthRequest.date_of_birth).format(this.settings.MODEL_DATETIME_FORMAT);

    this.apiService
      .doPostRequest(API_URI_DECLARE_BIRTH + '/' + birthRequest.mother.uln + '/candidate-fathers', this.candidateFathersRequest)
      .subscribe(
          (res: JsonResponseModel) => {

          const suggestedCandidateFathers = <LivestockAnimal[]> res.result.suggested_candidate_fathers;
          const otherCandidateFathers = <LivestockAnimal[]> res.result.other_candidate_fathers;

          // Prepare father data
          for (const animal of suggestedCandidateFathers) {
            this.prepareAnimal(animal, true);
          }

          for (const animal of otherCandidateFathers) {
            this.prepareAnimal(animal);
          }

          // Set birthRequest father data
          if (suggestedCandidateFathers.length === 1) {
            birthRequest.father = suggestedCandidateFathers[0];
          }
          birthRequest.suggested_candidate_fathers = suggestedCandidateFathers;

          if (birthRequest.suggested_candidate_fathers
          && birthRequest.suggested_candidate_fathers.length > 1
          && !birthRequest.father) {
            birthRequest.hasMultipleCandidateFathers = true;
          }

          // Trigger loading states
          birthRequest.suggestedCandidateFathersIsLoading = false;
          this.validateArrivalRequest(birthRequest);
          this.loadingStatesCount--;
          this.isLoadingCandidateFathers = false;
        },
        err => {
          birthRequest.suggestedCandidateFathersIsLoading = false;
          this.validateArrivalRequest(birthRequest);
          this.loadingStatesCount--;
          this.isLoadingCandidateFathers = false;
        }
      );
  }

  getEwesInLivestock() {
    this.apiService
      .doGetRequest(API_URI_GET_EWES_IN_LIVESTOCK)
      .subscribe(
        (res: JsonResponseModel) => {
          this.ewesInLivestock = this.ewesInLivestock.concat(<LivestockAnimal[]>res.result);
          this.ewesLoaded = true;
          this.sortEwes();
        },
        err => {
          alert(this.apiService.getErrorMessage(err));
        }
      );

    this.apiService
      .doGetRequest(API_URI_GET_HISTORIC_EWES_IN_LIVESTOCK)
      .subscribe(
        (res: JsonResponseModel) => {
          this.ewesInLivestock = this.ewesInLivestock.concat(<LivestockAnimal[]>res.result);
          this.historicEwesLoaded = true;
          this.sortEwes();
        },
        err => {
          alert(this.apiService.getErrorMessage(err));
        }
      );
  }

  sortEwes() {
    if (this.ewesLoaded && this.historicEwesLoaded) {
      const sortOrder: SortOrder = {
        variableName: 'worker_number',
        ascending: true,
        isDate: false // it is date string, not a date
      };
      this.ewesInLivestock = this.sort.sort(this.ewesInLivestock, [sortOrder]);
    }
  }

  selectMother(mother: Animal) {
    this.selectedArrivalRequest.mother = mother;
    this.selectedArrivalRequest.motherHasChanged = true;
    this.selectedArrivalRequest.motherMissingUlnCountryCode = false;
    this.validateArrivalRequest(this.selectedArrivalRequest);
    this.setCandidateFathers(this.selectedArrivalRequest);
  }

  selectFather(father) {
    this.selectedArrivalRequest.father = father;
    this.validateArrivalRequest(this.selectedArrivalRequest);
  }

  removeFather(birthRequest: ExtendedBirthRequest) {
    birthRequest.father = null;
    this.validateArrivalRequest(birthRequest);
  }

  selectAnimalUlnCountryCode(arrivalRequest: ExtendedArrivalRequest, countryCode: string) {
    arrivalRequest.animalUlnCountryCodeOnlyHasChanged = true;
    arrivalRequest.animalMissingUlnCountryCode = false;
    arrivalRequest.animal.uln_country_code = countryCode;
    arrivalRequest.animal.uln = countryCode + arrivalRequest.animal.uln_number;
    this.validateArrivalRequest(arrivalRequest);
  }

  resetAnimalUlnCountryCode(arrivalRequest: ExtendedArrivalRequest) {
    arrivalRequest.animalUlnCountryCodeOnlyHasChanged = false;
    arrivalRequest.animalMissingUlnCountryCode = true;
    arrivalRequest.animal.uln_country_code = '';
    arrivalRequest.animal.uln = '';
    this.validateArrivalRequest(arrivalRequest);
  }

  resetAnimal(arrivalRequest: ExtendedArrivalRequest) {
    const animal = {
      uln_country_code: '',
      uln_number: '',
      uln: '',
      worker_number: ''
    };

    arrivalRequest.animalHasChanged = false;
    arrivalRequest.animal = <Animal>animal;
    arrivalRequest.animalMissingUlnCountryCode = true;
    this.validateArrivalRequest(arrivalRequest);
  }

  validateArrivalRequest(arrivalRequest: ExtendedArrivalRequest) {
    // reset warnings first
    // this.multipleCandidateFatherBirthRequests = this.multipleCandidateFatherBirthRequests.filter(function( obj ) {
    //   return obj.index !== birthRequest.index;
    // });
    // this.missingMotherBirthRequests = this.missingMotherBirthRequests.filter(function( obj ) {
    //   return obj.index !== birthRequest.index;
    // });
    //
    // this.missingSurrogateMotherBirthRequests = this.missingSurrogateMotherBirthRequests.filter(function( obj ) {
    //   return (obj.index !== birthRequest.index);
    // });

    const hadWarnings = arrivalRequest.hasWarnings;
    arrivalRequest.hasWarnings = false;

    // Determine warning types
    if (arrivalRequest.animalMissingUlnCountryCode) {
      this.missingAnimalArrivalRequests.push(arrivalRequest);
      arrivalRequest.hasWarnings = true;
    }

    if (!hadWarnings && arrivalRequest.hasWarnings) {
      this.arrivalRequestWarningsCount++;
    } else if (hadWarnings && !arrivalRequest.hasWarnings) {
      this.arrivalRequestWarningsCount--;
    }
  }

  submitArrivalRequests() {
    if (this.arrivalRequestWarningsCount > 0) {
      this.toggleAllWarningsModal();
    } else {
      this.doSubmitBirthRequests();
    }
  }

  submitSingleArrivalRequest(arrivalRequest: ExtendedArrivalRequest) {
    this.selectedArrivalRequest = arrivalRequest;
    if (this.selectedArrivalRequest.hasWarnings) {
      this.toggleSingleWarningModal();
    } else {
      this.doSubmitSingleBirthRequest(arrivalRequest);
    }
  }

  preventKeyPress(event) {
    event.cancelBubble = true;
    event.preventDefault();
    return false;
  }

  ngOnDestroy() {
    this.countryCodeObs.unsubscribe();
  }

  toggleAllWarningsModal() {
    this.warningModalMode = 'all';
    if (this.warningModalDisplay === 'none') {
      this.warningModalDisplay = 'block';
    } else {
      this.warningModalDisplay = 'none';
    }
  }

  toggleSingleWarningModal() {
    this.warningModalMode = 'single';
    if (this.warningModalDisplay === 'none') {
      this.warningModalDisplay = 'block';
    } else {
      this.warningModalDisplay = 'none';
    }
  }

  doSubmitBirthRequests() {
    this.arrivalRequests.forEach((birthRequest) => {
      if (birthRequest.declareStatus !== true) {
        birthRequest.isSubmitting = true;
        this.apiService.doPostRequest(API_URI_DECLARE_BIRTH, birthRequest)
          .subscribe(
            res => {
              birthRequest.isSubmitting = false;
              birthRequest.errorMessage = null;
              birthRequest.declareStatus = true;
            },
            err => {
              birthRequest.isSubmitting = false;
              birthRequest.errorMessage = err.error.result.message;
              birthRequest.declareStatus = false;
            }
          );
      }
    });
  }

  doSubmitSingleBirthRequest(arrivalRequest: ExtendedArrivalRequest) {
    if (arrivalRequest.declareStatus !== true) {
      arrivalRequest.isSubmitting = true;
      console.log(arrivalRequest);
      this.apiService.doPostRequest(API_URI_DECLARE_ARRIVAL, arrivalRequest)
        .subscribe(
          res => {
            arrivalRequest.isSubmitting = false;
            arrivalRequest.errorMessage = null;
            arrivalRequest.declareStatus = true;
            console.log(res);
          },
          err => {
            arrivalRequest.isSubmitting = false;
            arrivalRequest.errorMessage = err.error.result.message;
            arrivalRequest.declareStatus = false;
            console.log(err);
          }
        );
    }
  }
}
