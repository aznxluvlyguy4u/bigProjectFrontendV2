import { Component, OnInit, OnDestroy } from '@angular/core';
import {LivestockAnimal, Animal} from '../../../shared/models/animal.model';
import { PapaParseService } from 'ngx-papaparse';
import { Settings } from '../../../shared/variables/settings';
import {
  API_URI_DECLARE_ARRIVAL
} from '../../../shared/services/nsfo-api/nsfo.settings';
import { NSFOService } from '../../../shared/services/nsfo-api/nsfo.service';
import * as moment from 'moment';
import { SettingsService } from '../../../shared/services/settings/settings.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {ArrivalRequest} from '../arrival.model';
import {UBNValidator} from '../../../shared/validation/nsfo-validation';
import {CacheService} from '../../../shared/services/settings/cache.service';

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
  public batchIndex: number;
  public is_aborted: boolean;
  public scanned_date: string;
  public animalUlnCountryCodeOnlyHasChanged = false;
  public animalHasChanged = false;
  public animalMissingUlnCountryCode = true;
  public animalHasOnlyWorkerNumber = false;
  public invalidUbnPreviousOwner = false;
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
  selector: 'app-arrival-csv',
  templateUrl: './arrival.csv.html',
  styleUrls: ['./arrival.csv.sass']
})
export class ArrivalCsvComponent implements OnInit, OnDestroy {

  public country_code_list = [];
  private countryCodeObs;

  warningModalDisplay = 'none';
  warningModalMode = 'all';
  multipleUbnPreviousOwnerMode = false;

  loadingStatesCount = 0;
  arrivalRequestWarningsCount = 0;
  csvFormatError = false;

  missingAnimalArrivalRequests = <ExtendedArrivalRequest[]>[];
  invalidUbnPreviousOwnerArrivalRequests = <ExtendedArrivalRequest[]>[];
  arrivalRequests = <ExtendedArrivalRequest[]>[];
  parsedAnimals = <LivestockAnimal[]>[];
  csvRows: ArrivalCsvRow[] = [];
  parsedResults: any;
  parsedFile: any;

  public view_date_format;
  public model_datetime_format;
  private selectedArrivalRequest: ExtendedArrivalRequest;

  constructor(
    private papa: PapaParseService,
    private settings: Settings,
    private apiService: NSFOService,
    private settingService: SettingsService,
    private router: Router,
    private translate: TranslateService,
    private cache: CacheService
  ) {
    this.view_date_format = settingService.getViewDateFormat();
    this.model_datetime_format = settingService.getModelDateTimeFormat();
  }

  ngOnInit() {
    this.countryCodeObs = this.settingService.getCountryList()
      .subscribe(countryCodeList => {
        this.country_code_list = countryCodeList[0];
      });
  }

  resetPrivateVariables() {
    this.arrivalRequestWarningsCount = 0;
    this.arrivalRequests = [];
    this.parsedAnimals = [];
    this.missingAnimalArrivalRequests = [];
    this.invalidUbnPreviousOwnerArrivalRequests = [];
    this.selectedArrivalRequest = null;
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
          this.toRows(this.parsedResults.data);
          this.toArrivalRequests();
        } else {
          alert(this.translate.instant('CSV FORMAT ERROR'));
        }
      },
      error: (error) => {
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
        row.length !== 7
        || (row[4] && !moment(row[4]).isValid())
        || ((row[5] && !moment(row[5]).isValid()))
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
    let batchIndex = 0;
    let currentScannedDate = null;
    let currentDateOfArrival = null;
    let currentUBN = null;
    let currentAnimalGroup = <ArrivalCsvRow[]>[];

    this.csvRows.forEach((csvRow) => {

      const csvRowScannedDate = moment(csvRow.scanned_date).format(this.settings.MODEL_DATE_FORMAT);
      const csvRowDateOfArrival = moment(csvRow.date_of_arrival).format(this.settings.MODEL_DATE_FORMAT);

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
          arrivalRequest.arrival_date = currentDateOfArrival ? currentDateOfArrival : currentScannedDate;
          arrivalRequest.is_import_animal = false;
          arrivalRequest.ubn_previous_owner = currentUBN;
          arrivalRequest.animal = row.tmp_animal;
          arrivalRequest.scanned_date = row.scanned_date;
          arrivalRequest.batchIndex = batchIndex;

          this.validateArrivalRequest(arrivalRequest);

          this.arrivalRequests.push(arrivalRequest);
        });

        // Reset array
        currentScannedDate = null;
        currentDateOfArrival = null;
        currentUBN = null;
        currentAnimalGroup = <ArrivalCsvRow[]>[];
        batchIndex++;
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

  toggleUbnPreviousOwner(arrivalRequest: ExtendedArrivalRequest, multipleMode: boolean) {
    arrivalRequest.ubnPreviousOwnerDisabled = !arrivalRequest.ubnPreviousOwnerDisabled;
    this.multipleUbnPreviousOwnerMode =
      (this.multipleUbnPreviousOwnerMode !== multipleMode) ? multipleMode : this.multipleUbnPreviousOwnerMode;
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

    // Reset warnings first
    this.missingAnimalArrivalRequests = this.missingAnimalArrivalRequests.filter(function( obj ) {
      return obj.index !== arrivalRequest.index;
    });
    this.invalidUbnPreviousOwnerArrivalRequests = this.invalidUbnPreviousOwnerArrivalRequests.filter(function( obj ) {
      return obj.index !== arrivalRequest.index;
    });

    const hadWarnings = arrivalRequest.hasWarnings;
    arrivalRequest.hasWarnings = false;

    // Determine warning types
    // Identification number missing country code
    if (arrivalRequest.animalMissingUlnCountryCode) {
      this.missingAnimalArrivalRequests.push(arrivalRequest);
      arrivalRequest.hasWarnings = true;
    }

    // UBN validation check
    if (!this.isValidUbn(arrivalRequest.ubn_previous_owner)) {
      this.invalidUbnPreviousOwnerArrivalRequests.push(arrivalRequest);
      arrivalRequest.invalidUbnPreviousOwner = true;
      arrivalRequest.hasWarnings = true;
    } else {
      arrivalRequest.invalidUbnPreviousOwner = false;
    }

    if (!hadWarnings && arrivalRequest.hasWarnings) {
      this.arrivalRequestWarningsCount++;
    } else if (hadWarnings && !arrivalRequest.hasWarnings) {
      this.arrivalRequestWarningsCount--;
    }
  }

  private isValidUbn(ubn: string): boolean {
    if (this.cache.useRvoLogic()) {
      return UBNValidator.isValidDutchUbn(ubn);
    }
    return UBNValidator.isValidNonDutchUbn(ubn);
  }

  submitArrivalRequests() {
    if (this.arrivalRequestWarningsCount > 0) {
      this.toggleAllWarningsModal();
    } else {
      this.doSubmitArrivalRequests();
    }
  }

  submitSingleArrivalRequest(arrivalRequest: ExtendedArrivalRequest) {
    this.selectedArrivalRequest = arrivalRequest;
    if (this.selectedArrivalRequest.hasWarnings) {
      this.toggleSingleWarningModal();
    } else {
      this.doSubmitSingleArrivalRequest(arrivalRequest);
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

  toggleUpdateUbnWarningModal(arrivalRequest: ExtendedArrivalRequest) {
    this.selectedArrivalRequest = arrivalRequest;
    if (arrivalRequest.ubnPreviousOwnerDisabled) {
      this.warningModalMode = 'changeUbn';
      if (this.warningModalDisplay === 'none') {
        this.warningModalDisplay = 'block';
      } else {
        this.warningModalDisplay = 'none';
      }
    } else {
      arrivalRequest.ubnPreviousOwnerDisabled = !arrivalRequest.ubnPreviousOwnerDisabled;
    }
  }

  updateArrivalDateString(arrivalRequest: ExtendedArrivalRequest, arrivalDateString: string) {
    arrivalRequest.arrival_date = SettingsService.getDateString_YYYY_MM_DD_fromDate(new Date(arrivalDateString));
    this.validateArrivalRequest(arrivalRequest);
  }

  updateSingleUbnPreviousOwner(arrivalRequest: ExtendedArrivalRequest, UbnPreviousOwnerString: string) {
    arrivalRequest.ubn_previous_owner = UbnPreviousOwnerString;
    this.validateArrivalRequest(arrivalRequest);
  }

  updateMultipleUbnPreviousOwner(arrivalRequest: ExtendedArrivalRequest, UbnPreviousOwnerString: string) {
    const arrivalRequestsBatch = this.arrivalRequests.filter(function( obj ) {
      return obj.batchIndex === arrivalRequest.batchIndex;
    });

    arrivalRequestsBatch.forEach((batchArrivalRequest: ExtendedArrivalRequest) => {
      batchArrivalRequest.ubn_previous_owner = UbnPreviousOwnerString;
      this.validateArrivalRequest(batchArrivalRequest);
    });
  }

  doSubmitArrivalRequests() {
    this.arrivalRequests.forEach((arrivalRequest: ExtendedArrivalRequest) => {
      if (arrivalRequest.declareStatus !== true) {
        arrivalRequest.isSubmitting = true;
        this.apiService.doPostRequest(API_URI_DECLARE_ARRIVAL, arrivalRequest)
          .subscribe(
            res => {
              arrivalRequest.isSubmitting = false;
              arrivalRequest.errorMessage = null;
              arrivalRequest.declareStatus = true;
            },
            err => {
              arrivalRequest.isSubmitting = false;
              arrivalRequest.errorMessage = err.error.result.message;
              arrivalRequest.declareStatus = false;
            }
          );
      }
    });
  }

  doSubmitSingleArrivalRequest(arrivalRequest: ExtendedArrivalRequest) {
    if (arrivalRequest.declareStatus !== true) {
      arrivalRequest.isSubmitting = true;
      this.apiService.doPostRequest(API_URI_DECLARE_ARRIVAL, arrivalRequest)
        .subscribe(
          res => {
            arrivalRequest.isSubmitting = false;
            arrivalRequest.errorMessage = null;
            arrivalRequest.declareStatus = true;
          },
          err => {
            arrivalRequest.isSubmitting = false;
            arrivalRequest.errorMessage = err.error.result.message;
            arrivalRequest.declareStatus = false;
          }
        );
    }
  }
}
