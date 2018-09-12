import { Component, OnInit, OnDestroy } from '@angular/core';
import {LivestockAnimal, LIVESTOCK_GENDER_FILTER_OPTIONS, Animal} from '../../../shared/models/animal.model';
import {
  BirthRequest, Child, CandidateFathersRequest, CandidateSurrogatesRequest, BIRTH_PROGRESS_TYPES,
  CandidateMothersRequest
} from '../birth.model';
import { PapaParseService, PapaParseConfig } from 'ngx-papaparse';
import { Settings } from '../../../shared/variables/settings';
import {
  API_URI_DECLARE_BIRTH
} from '../../../shared/services/nsfo-api/nsfo.settings';
import { NSFOService } from '../../../shared/services/nsfo-api/nsfo.service';
import * as moment from 'moment';
import { JsonResponseModel } from '../../../shared/models/json-response.model';
import { SettingsService } from '../../../shared/services/settings/settings.service';
import {LitterValidator} from '../../../shared/validation/nsfo-validation';

interface CsvRow {
  electronicId: string;
  tag: string;
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
  motherUlnCountryCodeOnlyHasChanged = false;
  motherHasChanged = false;
}

@Component({
  selector: 'app-csv',
  templateUrl: './csv.component.html'
})
export class CsvComponent implements OnInit, OnDestroy {

  public country_code_list = [];
  private countryCodeObs;
  private suggestedCandidateFathersIsLoadings;

  private birth_progress_types = BIRTH_PROGRESS_TYPES;

  isPreLoadingCandidateFathers = false;
  isLoadingCandidateSurrogates = false;
  isLoadingCandidateMothers = false;
  isLoadingCandidateFathers = false;

  suggestedCandidateFathers = <LivestockAnimal[]>[];
  suggestedCandidateMothers = <LivestockAnimal[]>[];
  candidateSurrogates = <LivestockAnimal[]>[];

  private selectedBirthRequest: ExtendedBirthRequest;
  private selectedChild;

  private candidateFathersRequest = new CandidateFathersRequest();
  private candidateMothersRequest = new CandidateMothersRequest();
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
    this.suggestedCandidateFathersIsLoadings = [];

    this.countryCodeObs = this.settingService.getCountryList()
      .subscribe(countryCodeList => {
        this.country_code_list = countryCodeList[0];
      });
  }

  handleFileInput(files: FileList) {
    this.birthRequests = [];
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
          tag: row[1], // Tag // B
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
      birthRequest.suggestedCandidateFathersIsLoading = false;
      birthRequest.suggestedCandidateMothersIsLoading = false;

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
          // mother.uln_country_code = 'NL';
          mother.uln_number = ulnUnProcessed[0];
          // mother.uln = mother.uln_country_code + mother.uln_number;
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

        this.addStillborn(birthRequest);

        this.birthRequests.push(birthRequest);

        this.setCandidateFathers(birthRequest);

      }
      index++;
    });

    // forkJoin(this.suggestedCandidateFathersIsLoadings).subscribe(
    //   res => {
    //     console.log('res');
    //     console.log(res);
    //   }
    // );
  }

  selectMother(mother: Animal) {
    this.selectedBirthRequest.mother = mother;
    this.selectedBirthRequest.motherHasChanged = true;
  }

  selectFather(father) {
    this.selectedBirthRequest.father = father;
  }

  addStillborn(birthRequest) {
    birthRequest.stillBorns = [];
    if (birthRequest.stillborn_count > 0) {
      for (let i = 0; i < birthRequest.stillborn_count; i++ ) {
        const stillBorn = new Child();
        stillBorn.is_alive = false;
        birthRequest.stillBorns.push(stillBorn);
      }
    }
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

        // only fill in weight if it is available
        if (tmpCsvRow.birth_weight !== '') {
          child.birth_weight = Number(tmpCsvRow.birth_weight);
        }

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
          child.date_scanned = tmpCsvRow.date_scanned;
        }

        // uln
        const ulnUnProcessed = tmpCsvRow.electronicId.split(' ');
        child.uln_country_code = this.countryNumberToCountryIdentifier(ulnUnProcessed[0]);
        child.uln_number = ulnUnProcessed[1];

        // child.lamBar = null;
        if (tmpCsvRow.hasLambar === 'Ja') {
          child.has_lambar = true;
        } else if (!tmpCsvRow.hasLambar || tmpCsvRow.hasLambar === 'Nee') {
          child.has_lambar = false;
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

  setCandidateFathers(birthRequest) {
    // let loading = of(true);

    // this.selectedBirthRequest = birthRequest;
    birthRequest.suggestedCandidateFathersIsLoading = true;

    // this.suggestedCandidateFathersIsLoadings.push(of(loading));

    this.isPreLoadingCandidateFathers = true;
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

          if (suggestedCandidateFathers.length === 1) {
            birthRequest.father = suggestedCandidateFathers[0];
          }
          birthRequest.suggestedCandidateFathersIsLoading = false;
          // loading.pipe(of(false));
          // const ssuggestedCandidateFathers = suggestedCandidateFathers.concat(otherCandidateFathers);
          // this.isLoadingCandidateFathers = false;
          // birthRequest.suggestedCandidateFathers = ssuggestedCandidateFathers;
        },
        err => {
          birthRequest.suggestedCandidateFathersIsLoading = false;
          // let error = err;
          // this.errorMessage = error.result.message;
          // this.openModal();
          // this.isLoadingCandidateFathers = false;
        }
      );
  }

  getCandidateMothers(birthRequest: ExtendedBirthRequest) {
    this.selectedBirthRequest = birthRequest;
    this.isLoadingCandidateMothers = true;
    this.candidateMothersRequest.date_of_birth = moment(birthRequest.date_of_birth).format(this.settings.MODEL_DATETIME_FORMAT);
    if (!this.candidateMothersRequest.date_of_birth) {
      return;
    }
    this.suggestedCandidateMothers = [];

    return new Promise((resolve, reject) => {
      this.apiService
        .doPostRequest(API_URI_DECLARE_BIRTH + '/candidate-mothers', this.candidateMothersRequest)
        .toPromise()
        .then(
          (res: JsonResponseModel) => {
            const suggestedCandidateMothers = <LivestockAnimal[]> res.result.suggested_candidate_mothers;

            suggestedCandidateMothers.forEach(animal => {
              animal.suggested = true;
              if (animal.uln_country_code && animal.uln_number) {

                animal.uln = animal.uln_country_code + animal.uln_number;
                animal.ulnLastFive = animal.uln_number.substr(animal.uln_number.length - 5);
              }
              if (animal.pedigree_country_code && animal.pedigree_number) {
                animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
              }
            });

            // otherCandidateMothers.forEach(animal =>{
            //     if(animal.uln_country_code && animal.uln_number) {
            //         animal.uln = animal.uln_country_code + animal.uln_number;
            //         animal.ulnLastFive = animal.uln_number.substr(animal.uln_number.length - 5);
            //     }
            //     if(animal.pedigree_country_code && animal.pedigree_number) {
            //         animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
            //     }
            // });
            // this.suggestedCandidateMothers = suggestedCandidateMothers.concat(otherCandidateMothers);
            this.suggestedCandidateMothers = suggestedCandidateMothers;
            this.isLoadingCandidateMothers = false;
            resolve();
          },
          err => {
            // let error = err;
            // this.errorMessage = error.result.message;
            // this.openModal();
            this.isLoadingCandidateMothers = false;
            reject(err);
          }
        );
    });
  }


  getCandidateFathers(birthRequest: ExtendedBirthRequest) {
    this.selectedBirthRequest = birthRequest;

    this.isLoadingCandidateFathers = true;

    this.candidateFathersRequest.date_of_birth = moment(birthRequest.date_of_birth).format(this.settings.MODEL_DATETIME_FORMAT);
    this.candidateFathersRequest.date_of_birth = moment(birthRequest.date_of_birth).format(this.settings.MODEL_DATETIME_FORMAT);
    this.suggestedCandidateFathers = [];

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

  selectMotherUlnCountryCode(birthRequest: ExtendedBirthRequest, countryCode: string) {
    birthRequest.motherUlnCountryCodeOnlyHasChanged = true;
    birthRequest.mother.uln_country_code = countryCode;
    birthRequest.mother.uln = countryCode + birthRequest.mother.uln_number;
  }

  resetMotherUlnCountryCode(birthRequest: ExtendedBirthRequest) {
    birthRequest.motherUlnCountryCodeOnlyHasChanged = false;
    birthRequest.mother.uln_country_code = '';
    birthRequest.mother.uln = '';
  }

  resetMother(birthRequest: ExtendedBirthRequest) {
    const mother = {
      uln_country_code: '',
      uln_number: '',
      uln: ''
    };

    birthRequest.motherHasChanged = false;
    birthRequest.mother = mother;
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

  ngOnDestroy() {
    this.countryCodeObs.unsubscribe();
  }
}
