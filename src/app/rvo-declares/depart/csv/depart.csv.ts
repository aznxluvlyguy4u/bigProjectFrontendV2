import { Component, OnInit, OnDestroy } from '@angular/core';
import { LivestockAnimal, Animal } from '../../../shared/models/animal.model';
import { DEPART_REASON_OF_DEPART } from '../depart.model';
import { PapaParseService } from 'ngx-papaparse';
import { Settings } from '../../../shared/variables/settings';
import {
  API_URI_DECLARE_DEPART
} from '../../../shared/services/nsfo-api/nsfo.settings';
import { NSFOService } from '../../../shared/services/nsfo-api/nsfo.service';
import * as moment from 'moment';
import { SettingsService } from '../../../shared/services/settings/settings.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {DepartRequest} from '../depart.model';
import {UBNValidator} from '../../../shared/validation/nsfo-validation';
import {CacheService} from '../../../shared/services/settings/cache.service';

interface DepartCsvRow {
  index: number;
  electronicId: string;
  tag: string;
  currentAdg: string;
  note: string;
  scanned_date: string;
  reason_of_depart: string;
  date_of_depart: string;
  ubn_new_owner: string;
  tmp_animal: LivestockAnimal;
}

class ExtendedDepartRequest extends DepartRequest {
  public index: number;
  public is_aborted: boolean;
  public scanned_date: string;
  public animalUlnCountryCodeOnlyHasChanged = false;
  public animalHasChanged = false;
  public animalMissingUlnCountryCode = true;
  public animalHasOnlyWorkerNumber = false;
  public invalidUbnNewOwner = false;
  public datePickerDisabled = true;
  public ubnNewOwnerDisabled = true;
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
  selector: 'app-depart-csv',
  templateUrl: './depart.csv.html',
  styleUrls: ['./depart.csv.sass']
})
export class DepartCsvComponent implements OnInit, OnDestroy {

  public country_code_list = [];
  public options_reason_of_depart = DEPART_REASON_OF_DEPART;
  private countryCodeObs;

  warningModalDisplay = 'none';
  warningModalMode = 'all';

  loadingStatesCount = 0;
  departRequestWarningsCount = 0;
  csvFormatError = false;

  missingAnimalDepartRequests = <ExtendedDepartRequest[]>[];
  invalidUbnNewOwnerDepartRequests = <ExtendedDepartRequest[]>[];
  departRequests: DepartRequest[] = [];
  parsedAnimals = <LivestockAnimal[]>[];
  csvRows: DepartCsvRow[] = [];
  parsedResults: any;
  parsedFile: any;

  public view_date_format;
  public model_datetime_format;
  private selectedDepartRequest: ExtendedDepartRequest;

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
    this.departRequestWarningsCount = 0;
    this.departRequests = [];
    this.parsedAnimals = [];
    this.missingAnimalDepartRequests = [];
    this.invalidUbnNewOwnerDepartRequests = [];
    this.selectedDepartRequest = null;
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
          this.toDepartRequests();
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
      const csvRow: DepartCsvRow = {
        index: null,
        electronicId: row[0], // Electronic ID // A
        tag: row[1], // Tag // B
        currentAdg: row[2], // Current ADG // C
        note: row[3], // Note // D
        scanned_date: row[4], // Scanned Date // E
        reason_of_depart: row[5], // Reason of Depart // F
        date_of_depart: row[6], // Dat aanv // G
        ubn_new_owner: row[7], // UBN // H
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
        row.length !== 8
        || (row[4] && !moment(row[4]).isValid())
        || ((row[6] && !moment(row[6]).isValid()))
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

  toDepartRequests() {
    let index = 0;
    let currentScannedDate = null;
    let currentDateOfDepart = null;
    let currentUBN = null;
    let currentAnimalGroup = <DepartCsvRow[]>[];

    this.csvRows.forEach((csvRow) => {

      const csvRowScannedDate = moment(csvRow.scanned_date).format(this.settings.MODEL_DATE_FORMAT);
      const csvRowDateOfDepart = moment(csvRow.date_of_depart).format(this.settings.MODEL_DATE_FORMAT);

      currentScannedDate = csvRowScannedDate;
      currentDateOfDepart = (csvRowDateOfDepart && csvRowDateOfDepart !== 'Invalid date') ? csvRowDateOfDepart : currentDateOfDepart;
      currentUBN = (csvRow.ubn_new_owner) ? csvRow.ubn_new_owner : currentUBN;
      csvRow.index = index;
      currentAnimalGroup.push(csvRow);

      // Check if next row is of different group
      const nextRow: DepartCsvRow = this.csvRows[index + 1];
      const nextCsvRowScannedDate = nextRow ? moment(nextRow.scanned_date).format(this.settings.MODEL_DATE_FORMAT) : null;
      const nextCsvRowDateOfDepart = nextRow ? moment(nextRow.date_of_depart).format(this.settings.MODEL_DATE_FORMAT) : null;

      if (
        nextCsvRowScannedDate !== currentScannedDate
        || (
          nextCsvRowDateOfDepart !== 'Invalid date'
          && (currentDateOfDepart && currentDateOfDepart !== 'Invalid date')
          && nextCsvRowDateOfDepart !== currentDateOfDepart
        )
      ) {
        currentAnimalGroup.forEach((row) => {
          // instantiate a new DepartRequest
          const departRequest = new ExtendedDepartRequest();
          this.resolveDepartRequestAnimal(row, departRequest);
          this.resolveDepartRequestReasonOfDepart(row, departRequest);
          departRequest.index = row.index;
          departRequest.is_aborted = false;
          departRequest.depart_date = currentDateOfDepart;
          departRequest.is_export_animal = false;
          departRequest.ubn_new_owner = currentUBN;
          departRequest.animal = row.tmp_animal;
          departRequest.scanned_date = row.scanned_date;

          this.validateDepartRequest(departRequest);

          this.departRequests.push(departRequest);
        });

        // Reset array
        currentScannedDate = null;
        currentDateOfDepart = null;
        currentUBN = null;
        currentAnimalGroup = <DepartCsvRow[]>[];
      }
      index++;
    });

    console.log(this.departRequests);
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

  resolveDepartRequestAnimal(csvRow: DepartCsvRow, departRequest: ExtendedDepartRequest) {
    departRequest.animal = csvRow.tmp_animal;

    // if electronicId consists of 2 parts: 3 digits country number and 12 digits tag number
    // and there is no tag in csv or tag in csv is the same as electronicId tag
    if (
      departRequest.animal.uln_country_code
      && departRequest.animal.uln_number
      && departRequest.animal.uln
    ) {
      departRequest.animalMissingUlnCountryCode = false;
      // if electronicId consists of only 1 part: 12 digits tag number and the country number is missing
      // and there is no tag in csv or tag in csv is the same as electronicId tag
    } else if (
      !departRequest.animal.uln_country_code
      && departRequest.animal.uln_number
      && !departRequest.animal.uln
    ) {
      departRequest.animalMissingUlnCountryCode = true;
      // if electronicId is missing but csv has tag and is 12 digits long
    } else if (
      !departRequest.animal.uln_country_code
      && !departRequest.animal.uln_number
      && !departRequest.animal.uln
      && departRequest.animal.worker_number
    ) {
      departRequest.animalHasOnlyWorkerNumber = true;
      departRequest.animal.uln_number = departRequest.animal.worker_number;
    }
  }

  resolveDepartRequestReasonOfDepart(csvRow: DepartCsvRow, departRequest: ExtendedDepartRequest) {
    // DEPART_REASON_OF_DEPART
    switch (csvRow.reason_of_depart) {
      case 'Fok': {
        departRequest.reason_of_depart = DEPART_REASON_OF_DEPART[1];
        break;
      }
      case 'Verhuur': {
        departRequest.reason_of_depart = DEPART_REASON_OF_DEPART[2];
        break;
      }
      case 'Slacht': {
        departRequest.reason_of_depart = DEPART_REASON_OF_DEPART[3];
        break;
      }
      case 'Uier': {
        departRequest.reason_of_depart = DEPART_REASON_OF_DEPART[4];
        break;
      }
      case 'Beenw': {
        departRequest.reason_of_depart = DEPART_REASON_OF_DEPART[5];
        break;
      }
      case 'Rotkr': {
        departRequest.reason_of_depart = DEPART_REASON_OF_DEPART[6];
        break;
      }
      case 'Vrchtbh': {
        departRequest.reason_of_depart = DEPART_REASON_OF_DEPART[7];
        break;
      }
      case 'Gust': {
        departRequest.reason_of_depart = DEPART_REASON_OF_DEPART[8];
        break;
      }
      case 'Gebit': {
        departRequest.reason_of_depart = DEPART_REASON_OF_DEPART[9];
        break;
      }
      case 'Overig': {
        departRequest.reason_of_depart = DEPART_REASON_OF_DEPART[10];
        break;
      }
      default: {
        departRequest.reason_of_depart = DEPART_REASON_OF_DEPART[0];
      }
    }
  }

  toggleDatePicker(departRequest: ExtendedDepartRequest) {
    departRequest.datePickerDisabled = !departRequest.datePickerDisabled;
  }

  toggleUbnNewOwner(departRequest: ExtendedDepartRequest) {
    departRequest.ubnNewOwnerDisabled = !departRequest.ubnNewOwnerDisabled;
  }

  selectAnimalUlnCountryCode(departRequest: ExtendedDepartRequest, countryCode: string) {
    departRequest.animalUlnCountryCodeOnlyHasChanged = true;
    departRequest.animalMissingUlnCountryCode = false;
    departRequest.animal.uln_country_code = countryCode;
    departRequest.animal.uln = countryCode + departRequest.animal.uln_number;
    this.validateDepartRequest(departRequest);
  }

  resetAnimalUlnCountryCode(departRequest: ExtendedDepartRequest) {
    departRequest.animalUlnCountryCodeOnlyHasChanged = false;
    departRequest.animalMissingUlnCountryCode = true;
    departRequest.animal.uln_country_code = '';
    departRequest.animal.uln = '';
    this.validateDepartRequest(departRequest);
  }

  resetAnimal(departRequest: ExtendedDepartRequest) {
    const animal = {
      uln_country_code: '',
      uln_number: '',
      uln: '',
      worker_number: ''
    };

    departRequest.animalHasChanged = false;
    departRequest.animal = <Animal>animal;
    departRequest.animalMissingUlnCountryCode = true;
    this.validateDepartRequest(departRequest);
  }

  validateDepartRequest(departRequest: ExtendedDepartRequest) {

    // Reset warnings first
    this.missingAnimalDepartRequests = this.missingAnimalDepartRequests.filter(function(obj ) {
      return obj.index !== departRequest.index;
    });
    this.invalidUbnNewOwnerDepartRequests = this.invalidUbnNewOwnerDepartRequests.filter(function(obj ) {
      return obj.index !== departRequest.index;
    });

    const hadWarnings = departRequest.hasWarnings;
    departRequest.hasWarnings = false;

    // Determine warning types
    // Identification number missing country code
    if (departRequest.animalMissingUlnCountryCode) {
      this.missingAnimalDepartRequests.push(departRequest);
      departRequest.hasWarnings = true;
    }

    // UBN validation check
    if (!this.isValidUbn(departRequest.ubn_new_owner)) {
      this.invalidUbnNewOwnerDepartRequests.push(departRequest);
      departRequest.invalidUbnNewOwner = true;
      departRequest.hasWarnings = true;
    } else {
      departRequest.invalidUbnNewOwner = false;
    }

    if (!hadWarnings && departRequest.hasWarnings) {
      this.departRequestWarningsCount++;
    } else if (hadWarnings && !departRequest.hasWarnings) {
      this.departRequestWarningsCount--;
    }
  }

  private isValidUbn(ubn: string): boolean {
    if (this.cache.useRvoLogic()) {
      return UBNValidator.isValidDutchUbn(ubn);
    }
    return UBNValidator.isValidNonDutchUbn(ubn);
  }

  submitDepartRequests() {
    if (this.departRequestWarningsCount > 0) {
      this.toggleAllWarningsModal();
    } else {
      this.doSubmitDepartRequests();
    }
  }

  submitSingleDepartRequest(departRequest: ExtendedDepartRequest) {
    this.selectedDepartRequest = departRequest;
    if (this.selectedDepartRequest.hasWarnings) {
      this.toggleSingleWarningModal();
    } else {
      this.doSubmitSingleDepartRequest(departRequest);
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

  updateDepartDateString(departRequest: ExtendedDepartRequest, departDateString: string) {
    departRequest.depart_date = SettingsService.getDateString_YYYY_MM_DD_fromDate(new Date(departDateString));
    this.validateDepartRequest(departRequest);
  }

  updateUbnNewOwner(departRequest: ExtendedDepartRequest, UbnPreviousOwnerString: string) {
    departRequest.ubn_new_owner = UbnPreviousOwnerString;
    this.validateDepartRequest(departRequest);
  }

  doSubmitDepartRequests() {
    this.departRequests.forEach((departRequest: ExtendedDepartRequest) => {
      if (departRequest.declareStatus !== true) {
        departRequest.isSubmitting = true;
        this.apiService.doPostRequest(API_URI_DECLARE_DEPART, departRequest)
          .subscribe(
            res => {
              departRequest.isSubmitting = false;
              departRequest.errorMessage = null;
              departRequest.declareStatus = true;
            },
            err => {
              departRequest.isSubmitting = false;
              departRequest.errorMessage = err.error.result.message;
              departRequest.declareStatus = false;
            }
          );
      }
    });
  }

  doSubmitSingleDepartRequest(departRequest: ExtendedDepartRequest) {
    if (departRequest.declareStatus !== true) {
      departRequest.isSubmitting = true;
      this.apiService.doPostRequest(API_URI_DECLARE_DEPART, departRequest)
        .subscribe(
          res => {
            departRequest.isSubmitting = false;
            departRequest.errorMessage = null;
            departRequest.declareStatus = true;
          },
          err => {
            departRequest.isSubmitting = false;
            departRequest.errorMessage = err.error.result.message;
            departRequest.declareStatus = false;
          }
        );
    }
  }
}
