import { Component, OnInit } from '@angular/core';
import { LivestockAnimal, LIVESTOCK_GENDER_FILTER_OPTIONS } from '../../../shared/models/animal.model';
import { BirthRequest, Child, CandidateFathersRequest, CandidateSurrogatesRequest, BIRTH_PROGRESS_TYPES } from '../birth.model';
import { PapaParseService, PapaParseConfig } from 'ngx-papaparse';
import { Settings } from '../../../shared/variables/settings';
import {
  API_URI_DECLARE_BIRTH
} from '../../../shared/services/nsfo-api/nsfo.settings';
import { NSFOService } from '../../../shared/services/nsfo-api/nsfo.service';
import * as moment from 'moment';
import { JsonResponseModel } from '../../../shared/models/json-response.model';
import { SettingsService } from '../../../shared/services/settings/settings.service';

interface CsvRow {
  electronicId: string;
  mother: string;
  currentAdg: string;
  note: string;
  date_scanned: string;
  stillborn_count: string;
  birth_weight: string;
  date_of_birth: string;
  birth_progress: string;
  hasLambar: string;
  gender: string;
  surrogate_mother: string; // uln
}

class ExtendedBirthRequest extends BirthRequest {
  suggested_candidate_fathers: LivestockAnimal[];
  suggested_other_fathers: LivestockAnimal[];
}

@Component({
  selector: 'app-csv',
  templateUrl: './csv.component.html'
})
export class CsvComponent implements OnInit {

  private birth_progress_types = BIRTH_PROGRESS_TYPES;

  isLoadingCandidateSurrogates = false;
  isLoadingCandidateMothers = false;
  isLoadingCandidateFathers = false;

  suggestedCandidateFathers = <LivestockAnimal[]>[];
  candidateSurrogates = <LivestockAnimal[]>[];

  private selectedBirthRequest: ExtendedBirthRequest;
  private selectedChild;

  private candidateFathersRequest = new CandidateFathersRequest();
  private candidateSurrogatesRequest = new CandidateSurrogatesRequest();

  parsedResults: any;
  parsedFile: any;

  private csvRows: CsvRow[] = [];
  birthRequests: BirthRequest[] = [];

  constructor(
    private papa: PapaParseService,
    private settings: Settings,
    private apiService: NSFOService,
    private settingService: SettingsService
  ) { }

  ngOnInit() {
    this.suggestedCandidateFathers = [];
    this.candidateSurrogates = [];
  }

  handleFileInput(files: FileList) {
    const config: PapaParseConfig = {};
    config.delimiter = ',';

    this.papa.parse(files.item(0), {
      complete: (results, file) => {
        this.parsedResults = results;
        this.parsedFile = file;
        const rows = this.toRows(this.parsedResults.data);
        this.toBirthRequest(rows);
      }
    });
  }


  toRows(rows: any) {
    rows.shift();

    this.csvRows = [];
    rows.forEach((row: any) => {
      // if (row.length > 1) {
        const csvRow: CsvRow = {
          electronicId: row[0], // Electronic ID // A
          mother: row[1], // Tag // B
          currentAdg: row[2], // Current ADG // C
          note: row[3], // Note // D
          date_scanned: row[4], // Scanned Date // E
          stillborn_count: row[5], // Aant Dood // F
          birth_weight: row[6], // Gebgew // G
          date_of_birth: row[7], // Gebdat // H
          birth_progress: row[8], // Gebverloop // I
          hasLambar: row[9], // Lambar // J
          gender: row[10], // O/R // K
          surrogate_mother: row[11] // Pleegm // L
        };
        this.csvRows.push(csvRow);
      // }
    });

    return this.csvRows;
  }

  countryNumberToCountryIdentifier(iso: string) {
    // TODO: Implement logic to return actual country identifier.
    return this.settingService.getCountryCodeByIso(iso);
  }

  toBirthRequest(data: any) {

    let index = 0;
    this.csvRows.forEach((csvRow) => {

      // instantiate a new BirthRequest
      const birthRequest = new ExtendedBirthRequest();

      birthRequest.is_aborted = false;
      birthRequest.is_pseudo_pregnancy = false;

      if ( csvRow.date_of_birth && !csvRow.birth_progress ) {
        // we have a mother.
        const ulnUnProcessed = csvRow.electronicId.split(' ');
        const mother = {
          uln_country_code: '',
          uln_number: '',
          uln: ''
        };

        if (ulnUnProcessed !== undefined && ulnUnProcessed.length === 2) {
          const ulnNumber = ulnUnProcessed[1];
          mother.uln_country_code = this.countryNumberToCountryIdentifier(ulnUnProcessed[0]),
          mother.uln_number = ulnUnProcessed[1];
          mother.uln = mother.uln_country_code + mother.uln_number;
        } else {
          mother.uln_country_code = 'NL';
          mother.uln_number = ulnUnProcessed[0];
          mother.uln = mother.uln_country_code + mother.uln_number;
        }

        // Still born count
        birthRequest.stillborn_count = csvRow.stillborn_count ? Number(csvRow.stillborn_count) : 0;

        // Set mother
        birthRequest.mother = mother;

        birthRequest.date_of_birth = csvRow.date_of_birth;

        // Resolve children
        birthRequest.children = this.resolveChildren(index, csvRow.date_of_birth, birthRequest);

        // Litter size
        birthRequest.litter_size = birthRequest.children.length + birthRequest.stillborn_count;

        // Born alive count
        birthRequest.born_alive_count = birthRequest.children ? birthRequest.children.length : 0;

        this.birthRequests.push(birthRequest);
      }
      index++;
    });
  }

  selectFather(father) {
    this.selectedBirthRequest.father = father;
  }


  resolveChildren(index: number, date_of_birth: string, birthRequest: BirthRequest) {
    let nextMother = false;
    const children: Child[] = [];

    // create a shallow copy of the csvRows array
    const tmpCsvRows: CsvRow[] = this.csvRows.slice(index + 1);

    tmpCsvRows.forEach((tmpCsvRow) => {
      if (tmpCsvRow.date_of_birth) {
        nextMother = true;
      }

      if (tmpCsvRow.electronicId) {
        const child = new Child();

        switch (tmpCsvRow.birth_progress) {
           case 'Anders': {
            child.birth_progress = BIRTH_PROGRESS_TYPES[0];
            break;
          }
          case 'Minder': {
            child.birth_progress = BIRTH_PROGRESS_TYPES[1];
            break;
          }
          case 'Normaal': {
            child.birth_progress = BIRTH_PROGRESS_TYPES[2];
            break;
          }

          // case 'Zonder hulp': {
          //   child.birth_progress = BIRTH_PROGRESS_TYPES[0];
          //   break;
          // }
          // case 'Licht met hulp': {
          //   child.birth_progress = BIRTH_PROGRESS_TYPES[1];
          //   break;
          // }
          // case 'Normaal met hulp': {
          //   child.birth_progress = BIRTH_PROGRESS_TYPES[2];
          //   break;
          // }
          // case 'Zwaar met hulp': {
          //   child.birth_progress = BIRTH_PROGRESS_TYPES[3];
          //   break;
          // }
          // case 'Keizersnede (lam te groot)': {
          //   child.birth_progress = BIRTH_PROGRESS_TYPES[4];
          //   break;
          // }
          // case 'Keizersnede (onvoldoende ontsluiting)': {
          //   child.birth_progress = BIRTH_PROGRESS_TYPES[5];
          //   break;
          // }
          // default: {
          //   child.birth_progress = tmpCsvRow.birth_progress;
          // }
        }

        child.birth_weight = Number(tmpCsvRow.birth_weight);

        switch (tmpCsvRow.gender) {

          case 'Ram': {
            child.gender = LIVESTOCK_GENDER_FILTER_OPTIONS[1];
            break;
          }
          case 'Ooi': {
            child.gender = LIVESTOCK_GENDER_FILTER_OPTIONS[2];
            break;
          }
        }

        child.is_alive = true;

        // Use scan date if date of birth is empty
        if (date_of_birth) {
          child.date_of_birth = date_of_birth;
          child.date_of_birth = tmpCsvRow.date_scanned;
        }

        // uln
        const ulnUnProcessed = tmpCsvRow.electronicId.split(' ');
        child.uln_country_code = this.countryNumberToCountryIdentifier(ulnUnProcessed[0]);
        child.uln_number = ulnUnProcessed[1];

        if (tmpCsvRow.hasLambar) {
          child.has_lambar = true;
        }

        // only push the child if we have not encountered another mother
        if (nextMother === false) {
          children.push(child);
        }
      }
    });

    nextMother = false;
    return children;
  }

  getCandidateFathers(birthRequest: ExtendedBirthRequest) {

    this.selectedBirthRequest = birthRequest;

    this.isLoadingCandidateFathers = true;

    this.candidateFathersRequest.date_of_birth = moment(birthRequest.date_of_birth).format(this.settings.MODEL_DATETIME_FORMAT);
    this.candidateFathersRequest.date_of_birth = moment(birthRequest.date_of_birth).format(this.settings.MODEL_DATETIME_FORMAT);

    this.apiService
      .doPostRequest(API_URI_DECLARE_BIRTH + '/' + birthRequest.mother.uln + '/candidate-fathers', this.candidateFathersRequest)
      .subscribe(
          (res: JsonResponseModel) => {

          const suggestedCandidateFathers = <LivestockAnimal[]> res.result.suggested_candidate_fathers;
          const otherCandidateFathers = <LivestockAnimal[]> res.result.other_candidate_fathers;

          for (const animal of suggestedCandidateFathers) {
            animal.suggested = true;
            if (animal.uln_country_code && animal.uln_number) {

              animal.uln = animal.uln_country_code + animal.uln_number;
              animal.ulnLastFive = animal.uln_number.substr(animal.uln_number.length - 5);
            }
            if (animal.pedigree_country_code && animal.pedigree_number) {
              animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
            }
          }

          for (const animal of otherCandidateFathers) {
            if (animal.uln_country_code && animal.uln_number) {

              animal.uln = animal.uln_country_code + animal.uln_number;
              animal.ulnLastFive = animal.uln_number.substr(animal.uln_number.length - 5);
            }
            if (animal.pedigree_country_code && animal.pedigree_number) {
              animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
            }
          }

          this.suggestedCandidateFathers = suggestedCandidateFathers.concat(otherCandidateFathers);
          this.isLoadingCandidateFathers = false;
        },
        err => {
          // let error = err;
          // this.errorMessage = error.result.message;
          // this.openModal();
          this.isLoadingCandidateFathers = false;
        }
      );
  }

  selectSurrogateMother(surrogateMother) {
    this.selectedChild.surrogate_mother = surrogateMother;
  }

  getCandidateSurrogates(birthRequest, child) {

    this.selectedChild = child;

    if (!birthRequest.mother.uln) {
      return;
    }

    this.candidateSurrogatesRequest.date_of_birth = moment(birthRequest.date_of_birth)
      .format(this.settings.MODEL_DATETIME_FORMAT);

    this.isLoadingCandidateSurrogates = true;
    const uri = API_URI_DECLARE_BIRTH + '/' + birthRequest.mother.uln + '/candidate-surrogates';
    this.apiService.doPostRequest(uri, this.candidateSurrogatesRequest)
      .subscribe(
          (res: JsonResponseModel) => {
          const candidateSurrogates = <LivestockAnimal[]> res.result.suggested_candidate_surrogates;

          for (const animal of candidateSurrogates) {
            animal.suggested = true;
            if (animal.uln_country_code && animal.uln_number) {
              animal.uln = animal.uln_country_code + animal.uln_number;
              animal.ulnLastFive = animal.uln_number.substr(animal.uln_number.length - 5);
            }

            if (animal.pedigree_country_code && animal.pedigree_number) {
              animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
            }
          }
          this.candidateSurrogates = candidateSurrogates;
          this.isLoadingCandidateSurrogates = false;
        }
      );
  }

  submitBirthRequests() {
    this.birthRequests.forEach((birthRequest) => {
      if (birthRequest.declareStatus !== true) {
        birthRequest.isSubmitting = true;
        this.apiService.doPostRequest(API_URI_DECLARE_BIRTH, birthRequest)
        .subscribe(
          res => {
            birthRequest.isSubmitting = false;
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
  preventKeyPress(event) {
    event.cancelBubble = true;
    event.preventDefault();
    return false;
  }
}
