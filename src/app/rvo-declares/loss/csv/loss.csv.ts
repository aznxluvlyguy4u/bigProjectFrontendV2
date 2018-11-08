import { Component, OnInit, OnDestroy } from '@angular/core';
import { LivestockAnimal, Animal } from '../../../shared/models/animal.model';
import {LOSS_REASON_OF_LOSS, LossRequest} from '../loss.model';
import { PapaParseService } from 'ngx-papaparse';
import { Settings } from '../../../shared/variables/settings';
import {
  API_URI_DECLARE_LOSS
} from '../../../shared/services/nsfo-api/nsfo.settings';
import { NSFOService } from '../../../shared/services/nsfo-api/nsfo.service';
import * as moment from 'moment';
import { SettingsService } from '../../../shared/services/settings/settings.service';
import {Router} from '@angular/router';
import {TranslateService} from '@ngx-translate/core';
import {UBNValidator} from '../../../shared/validation/nsfo-validation';
import {CacheService} from '../../../shared/services/settings/cache.service';

interface LossCsvRow {
  index: number;
  electronicId: string;
  tag: string;
  currentAdg: string;
  note: string;
  scanned_date: string;
  reason_of_loss: string;
  ubn_processor: string;
  tmp_animal: LivestockAnimal;
}

class ExtendedLossRequest extends LossRequest {
  public index: number;
  public is_aborted: boolean;
  public scanned_date: string;
  public animalUlnCountryCodeOnlyHasChanged = false;
  public animalHasChanged = false;
  public animalMissingUlnCountryCode = true;
  public animalHasOnlyWorkerNumber = false;
  public invalidUbnProcessor = false;
  public datePickerDisabled = true;
  public ubnProcessorDisabled = true;
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
  selector: 'app-loss-csv',
  templateUrl: './loss.csv.html',
  styleUrls: ['./loss.csv.sass']
})
export class LossCsvComponent implements OnInit, OnDestroy {

  public country_code_list = [];
  public options_reason_of_loss = LOSS_REASON_OF_LOSS;
  private countryCodeObs;

  warningModalDisplay = 'none';
  warningModalMode = 'all';

  loadingStatesCount = 0;
  lossRequestWarningsCount = 0;
  csvFormatError = false;

  missingAnimalLossRequests = <ExtendedLossRequest[]>[];
  invalidUbnProcessorLossRequests = <ExtendedLossRequest[]>[];
  lossRequests: LossRequest[] = [];
  parsedAnimals = <LivestockAnimal[]>[];
  csvRows: LossCsvRow[] = [];
  parsedResults: any;
  parsedFile: any;

  public view_date_format;
  public model_datetime_format;
  private selectedLossRequest: ExtendedLossRequest;

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
    this.lossRequestWarningsCount = 0;
    this.lossRequests = [];
    this.parsedAnimals = [];
    this.missingAnimalLossRequests = [];
    this.invalidUbnProcessorLossRequests = [];
    this.selectedLossRequest = null;
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
          this.toLossRequests();
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
      const csvRow: LossCsvRow = {
        index: null,
        electronicId: row[0], // Electronic ID // A
        tag: row[1], // Tag // B
        currentAdg: row[2], // Current ADG // C
        note: row[3], // Note // D
        scanned_date: row[4], // Scanned Date // E
        reason_of_loss: row[5], // Reason of Loss // F
        ubn_processor: row[6], // UBN // H
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

  toLossRequests() {
    let index = 0;
    this.csvRows.forEach((csvRow: LossCsvRow) => {

      const csvRowScannedDate = moment(csvRow.scanned_date).format(this.settings.MODEL_DATE_FORMAT);


      // instantiate a new LossRequest
      const lossRequest = new ExtendedLossRequest();
      this.resolveLossRequestAnimal(csvRow, lossRequest);
      this.resolveLossRequestReasonOfLoss(csvRow, lossRequest);
      lossRequest.index = csvRow.index;
      lossRequest.is_aborted = false;
      lossRequest.date_of_death = csvRowScannedDate;
      lossRequest.ubn_processor = csvRow.ubn_processor;
      lossRequest.animal = csvRow.tmp_animal;
      lossRequest.scanned_date = csvRow.scanned_date;

      this.validateLossRequest(lossRequest);

      this.lossRequests.push(lossRequest);

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

  resolveLossRequestAnimal(csvRow: LossCsvRow, lossRequest: ExtendedLossRequest) {
    lossRequest.animal = csvRow.tmp_animal;

    // if electronicId consists of 2 parts: 3 digits country number and 12 digits tag number
    // and there is no tag in csv or tag in csv is the same as electronicId tag
    if (
      lossRequest.animal.uln_country_code
      && lossRequest.animal.uln_number
      && lossRequest.animal.uln
    ) {
      lossRequest.animalMissingUlnCountryCode = false;
      // if electronicId consists of only 1 part: 12 digits tag number and the country number is missing
      // and there is no tag in csv or tag in csv is the same as electronicId tag
    } else if (
      !lossRequest.animal.uln_country_code
      && lossRequest.animal.uln_number
      && !lossRequest.animal.uln
    ) {
      lossRequest.animalMissingUlnCountryCode = true;
      // if electronicId is missing but csv has tag and is 12 digits long
    } else if (
      !lossRequest.animal.uln_country_code
      && !lossRequest.animal.uln_number
      && !lossRequest.animal.uln
      && lossRequest.animal.worker_number
    ) {
      lossRequest.animalHasOnlyWorkerNumber = true;
      lossRequest.animal.uln_number = lossRequest.animal.worker_number;
    }
  }

  resolveLossRequestReasonOfLoss(csvRow: LossCsvRow, lossRequest: ExtendedLossRequest) {
    // LOSS_REASON_OF_LOSS
    switch (csvRow.reason_of_loss) {
      case 'Acuut': {
        lossRequest.reason_of_loss = LOSS_REASON_OF_LOSS[1];
        break;
      }
      case 'Ziekte': {
        lossRequest.reason_of_loss = LOSS_REASON_OF_LOSS[2];
        break;
      }
      case 'Verwent': {
        lossRequest.reason_of_loss = LOSS_REASON_OF_LOSS[3];
        break;
      }
      case 'Euth': {
        lossRequest.reason_of_loss = LOSS_REASON_OF_LOSS[4];
        break;
      }
      case 'Overig': {
        lossRequest.reason_of_loss = LOSS_REASON_OF_LOSS[5];
        break;
      }
      case 'Geen': {
        lossRequest.reason_of_loss = LOSS_REASON_OF_LOSS[0];
        break;
      }
      default: {
        lossRequest.reason_of_loss = LOSS_REASON_OF_LOSS[0];
      }
    }
  }

  toggleDatePicker(lossRequest: ExtendedLossRequest) {
    lossRequest.datePickerDisabled = !lossRequest.datePickerDisabled;
  }

  toggleUbnNewOwner(lossRequest: ExtendedLossRequest) {
    lossRequest.ubnProcessorDisabled = !lossRequest.ubnProcessorDisabled;
  }

  selectAnimalUlnCountryCode(lossRequest: ExtendedLossRequest, countryCode: string) {
    lossRequest.animalUlnCountryCodeOnlyHasChanged = true;
    lossRequest.animalMissingUlnCountryCode = false;
    lossRequest.animal.uln_country_code = countryCode;
    lossRequest.animal.uln = countryCode + lossRequest.animal.uln_number;
    this.validateLossRequest(lossRequest);
  }

  resetAnimalUlnCountryCode(lossRequest: ExtendedLossRequest) {
    lossRequest.animalUlnCountryCodeOnlyHasChanged = false;
    lossRequest.animalMissingUlnCountryCode = true;
    lossRequest.animal.uln_country_code = '';
    lossRequest.animal.uln = '';
    this.validateLossRequest(lossRequest);
  }

  resetAnimal(lossRequest: ExtendedLossRequest) {
    const animal = {
      uln_country_code: '',
      uln_number: '',
      uln: '',
      worker_number: ''
    };

    lossRequest.animalHasChanged = false;
    lossRequest.animal = <Animal>animal;
    lossRequest.animalMissingUlnCountryCode = true;
    this.validateLossRequest(lossRequest);
  }

  validateLossRequest(lossRequest: ExtendedLossRequest) {

    // Reset warnings first
    this.missingAnimalLossRequests = this.missingAnimalLossRequests.filter(function(obj ) {
      return obj.index !== lossRequest.index;
    });
    this.invalidUbnProcessorLossRequests = this.invalidUbnProcessorLossRequests.filter(function(obj ) {
      return obj.index !== lossRequest.index;
    });

    const hadWarnings = lossRequest.hasWarnings;
    lossRequest.hasWarnings = false;

    // Determine warning types
    // Identification number missing country code
    if (lossRequest.animalMissingUlnCountryCode) {
      this.missingAnimalLossRequests.push(lossRequest);
      lossRequest.hasWarnings = true;
    }

    // UBN validation check
    if (!this.isValidUbn(lossRequest.ubn_processor)) {
      this.invalidUbnProcessorLossRequests.push(lossRequest);
      lossRequest.invalidUbnProcessor = true;
      lossRequest.hasWarnings = true;
    } else {
      lossRequest.invalidUbnProcessor = false;
    }

    if (!hadWarnings && lossRequest.hasWarnings) {
      this.lossRequestWarningsCount++;
    } else if (hadWarnings && !lossRequest.hasWarnings) {
      this.lossRequestWarningsCount--;
    }
  }

  private isValidUbn(ubn: string): boolean {
    if (this.cache.useRvoLogic()) {
      return UBNValidator.isValidDutchUbn(ubn);
    }
    return UBNValidator.isValidNonDutchUbn(ubn);
  }

  submitLossRequests() {
    if (this.lossRequestWarningsCount > 0) {
      this.toggleAllWarningsModal();
    } else {
      this.doSubmitLossRequests();
    }
  }

  submitSingleLossRequest(lossRequest: ExtendedLossRequest) {
    this.selectedLossRequest = lossRequest;
    if (this.selectedLossRequest.hasWarnings) {
      this.toggleSingleWarningModal();
    } else {
      this.doSubmitSingleLossRequest(lossRequest);
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

  updateLossDateString(lossRequest: ExtendedLossRequest, lossDateString: string) {
    lossRequest.date_of_death = SettingsService.getDateString_YYYY_MM_DD_fromDate(new Date(lossDateString));
    this.validateLossRequest(lossRequest);
  }

  updateUbnProcessor(lossRequest: ExtendedLossRequest, UbnProcessorString: string) {
    lossRequest.ubn_processor = UbnProcessorString;
    this.validateLossRequest(lossRequest);
  }

  doSubmitLossRequests() {
    this.lossRequests.forEach((lossRequest: ExtendedLossRequest) => {
      if (lossRequest.declareStatus !== true) {
        lossRequest.isSubmitting = true;
        this.apiService.doPostRequest(API_URI_DECLARE_LOSS, lossRequest)
          .subscribe(
            res => {
              lossRequest.isSubmitting = false;
              lossRequest.errorMessage = null;
              lossRequest.declareStatus = true;
            },
            err => {
              lossRequest.isSubmitting = false;
              lossRequest.errorMessage = err.error.result.message;
              lossRequest.declareStatus = false;
            }
          );
      }
    });
  }

  doSubmitSingleLossRequest(lossRequest: ExtendedLossRequest) {
    if (lossRequest.declareStatus !== true) {
      lossRequest.isSubmitting = true;
      this.apiService.doPostRequest(API_URI_DECLARE_LOSS, lossRequest)
        .subscribe(
          res => {
            lossRequest.isSubmitting = false;
            lossRequest.errorMessage = null;
            lossRequest.declareStatus = true;
          },
          err => {
            lossRequest.isSubmitting = false;
            lossRequest.errorMessage = err.error.result.message;
            lossRequest.declareStatus = false;
          }
        );
    }
  }
}
