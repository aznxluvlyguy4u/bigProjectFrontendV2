import { Component, OnInit, OnDestroy } from '@angular/core';
import {LivestockAnimal, LIVESTOCK_GENDER_FILTER_OPTIONS, Animal} from '../../../shared/models/animal.model';
import {
  BirthRequest, Child, CandidateFathersRequest, CandidateSurrogatesRequest, BIRTH_PROGRESS_TYPES,
  CandidateMothersRequest
} from '../birth.model';
import { PapaParseService } from 'ngx-papaparse';
import { Settings } from '../../../shared/variables/settings';
import {
  API_URI_DECLARE_BIRTH,
  API_URI_GET_EWES_IN_LIVESTOCK,
  API_URI_GET_HISTORIC_EWES_IN_LIVESTOCK,
} from '../../../shared/services/nsfo-api/nsfo.settings';
import { NSFOService } from '../../../shared/services/nsfo-api/nsfo.service';
import * as moment from 'moment';
import { JsonResponseModel } from '../../../shared/models/json-response.model';
import { SettingsService } from '../../../shared/services/settings/settings.service';
import {IS_CSV_IMPORT_BIRTHS_ACTIVE} from '../../../shared/variables/feature.activation';
import {Router} from '@angular/router';

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
  tmpMother: any;
}

class ExtendedBirthRequest extends BirthRequest {
  index: number;
  suggested_candidate_fathers: LivestockAnimal[];
  suggested_other_fathers: LivestockAnimal[];
  motherUlnCountryCodeOnlyHasChanged = false;
  motherHasChanged = false;
  hasMultipleCandidateFathers = false;
  motherMissingUlnCountryCode = true;
  surrogateMotherMissingUlnCountryCode = false;
  hasWarnings = false;
}

@Component({
  selector: 'app-csv',
  templateUrl: './csv.component.html',
  styleUrls: ['./csv.component.sass']
})
export class CsvComponent implements OnInit, OnDestroy {

  public country_code_list = [];
  private countryCodeObs;

  private birth_progress_types = BIRTH_PROGRESS_TYPES;

  warningModalDisplay = 'none';
  warningModalMode = 'all';

  loadingStatesCount = 0;
  birthRequestWarningsCount = 0;
  isLoadingCandidateSurrogates = false;
  isLoadingCandidateMothers = false;
  isLoadingCandidateFathers = false;

  multipleCandidateFatherBirthRequests = <ExtendedBirthRequest[]>[];
  missingMotherBirthRequests = <ExtendedBirthRequest[]>[];
  missingSurrogateMotherBirthRequests = <ExtendedBirthRequest[]>[];

  suggestedCandidateFathers = <LivestockAnimal[]>[];
  suggestedCandidateMothers = <LivestockAnimal[]>[];
  ewesInLivestock = <LivestockAnimal[]>[];
  candidateSurrogates = <LivestockAnimal[]>[];
  parsedMothers = <LivestockAnimal[]>[];

  private selectedBirthRequest: ExtendedBirthRequest;
  private selectedChild;

  private candidateFathersRequest = new CandidateFathersRequest();
  private candidateMothersRequest = new CandidateMothersRequest();
  private candidateSurrogatesRequest = new CandidateSurrogatesRequest();

  parsedResults: any;
  parsedFile: any;

  private csvRows: CsvRow[] = [];
  birthRequests: ExtendedBirthRequest[] = [];

  constructor(
    private papa: PapaParseService,
    private settings: Settings,
    private apiService: NSFOService,
    private settingService: SettingsService,
    private router: Router
  ) { }

  ngOnInit() {
    if (!IS_CSV_IMPORT_BIRTHS_ACTIVE) {
      this.router.navigate(['/main/birth/declare']);
    }

    this.suggestedCandidateFathers = [];
    this.candidateSurrogates = [];

    this.countryCodeObs = this.settingService.getCountryList()
      .subscribe(countryCodeList => {
        this.country_code_list = countryCodeList[0];
      });

    this.getEwesInLivestock();
  }

  handleFileInput(files: FileList) {
    this.birthRequests = [];
    this.parsedMothers = [];

    this.papa.parse(files.item(0), {
      delimiter: ',',
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
          surrogate_mother: row[11], // Pleegm // L
          tmpMother: ''
        };
        this.resolveCsvRowMother(csvRow);
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

      birthRequest.index = index;
      birthRequest.is_aborted = false;
      birthRequest.is_pseudo_pregnancy = false;
      birthRequest.suggestedCandidateFathersIsLoading = false;
      birthRequest.suggestedCandidateMothersIsLoading = false;

      if ( csvRow.date_of_birth && !csvRow.birth_progress ) {
        // Set mother
        this.resolveBirthRequestMother(csvRow, birthRequest);

        // Still born count
        birthRequest.stillborn_count = csvRow.stillborn_count ? Number(csvRow.stillborn_count) : 0;

        // Set date of birth
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

        this.validateBirthRequest(birthRequest);
      }
      index++;
    });

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

  resolveCsvRowMother(csvRow) {
    if ( csvRow.date_of_birth && !csvRow.birth_progress ) {
      // Determine mother
      const ulnUnProcessed = csvRow.electronicId.split(' ');

      const mother = {
        uln_country_code: '',
        uln_number: '',
        uln: '',
        worker_number: ''
      };

      // if electronicId consists of 2 parts: 3 digits country number and 12 digits tag number
      // and there is no tag in csv or tag in csv is the same as electronicId tag
      if (
        ulnUnProcessed.length === 2
        && ulnUnProcessed[0].length === 3
        && ulnUnProcessed[1].length === 12
        && /^\d+$/.test(ulnUnProcessed[1])
        && (!csvRow.tag || csvRow.tag === ulnUnProcessed[1])
      ) {
        mother.uln_country_code = this.countryNumberToCountryIdentifier(ulnUnProcessed[0]);
        mother.uln_number = ulnUnProcessed[1];
        mother.uln = mother.uln_country_code + mother.uln_number;
        // if electronicId consists of only 1 part: 12 digits tag number and the country number is missing
        // and there is no tag in csv or tag in csv is the same as electronicId tag
      } else if (
        ulnUnProcessed.length === 1
        && ulnUnProcessed[0].length === 12
        && /^\d+$/.test(ulnUnProcessed[0])
        && (!csvRow.tag || csvRow.tag === ulnUnProcessed[0])
      ) {
        mother.uln_number = ulnUnProcessed[0];
        // if electronicId is missing but csv has tag and is 12 digits long
      } else if (
        ulnUnProcessed.length === 1
        && ulnUnProcessed[0] === ''
        && csvRow.tag.length === 12
        && /^\d+$/.test(csvRow.tag)
      ) {
        mother.uln_number = csvRow.tag;
      } else if (
        ulnUnProcessed.length === 1
        && ulnUnProcessed[0] === ''
        && csvRow.tag.length === 5
        && /^\d+$/.test(csvRow.tag)
      ) {
        mother.worker_number = csvRow.tag;
      }

      csvRow.tmpMother = mother;

      this.parsedMothers.push(csvRow.tmpMother);
    }
  }

  resolveBirthRequestMother(csvRow, birthRequest: ExtendedBirthRequest) {
    birthRequest.mother = csvRow.tmpMother;

    // if electronicId consists of 2 parts: 3 digits country number and 12 digits tag number
    // and there is no tag in csv or tag in csv is the same as electronicId tag
    if (
      birthRequest.mother.uln_country_code
      && birthRequest.mother.uln_number
      && birthRequest.mother.uln
    ) {
      birthRequest.motherMissingUlnCountryCode = false;
      // if electronicId consists of only 1 part: 12 digits tag number and the country number is missing
      // and there is no tag in csv or tag in csv is the same as electronicId tag
    } else if (
      !birthRequest.mother.uln_country_code
      && birthRequest.mother.uln_number
      && !birthRequest.mother.uln
    ) {
      birthRequest.motherMissingUlnCountryCode = true;
      // if electronicId is missing but csv has tag and is 12 digits long
    } else if (
      !birthRequest.mother.uln_country_code
      && !birthRequest.mother.uln_number
      && !birthRequest.mother.uln
      && birthRequest.mother.worker_number
    ) {
      this.setMother(birthRequest);
    }
  }

  resolveChildren(index: number, date_of_birth: string, birthRequest: ExtendedBirthRequest) {
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
          case 'Zonder': {
            child.birth_progress = BIRTH_PROGRESS_TYPES[0];
            break;
          }
          case 'Licht': {
            child.birth_progress = BIRTH_PROGRESS_TYPES[1];
            break;
          }
          case 'Zwaar': {
            child.birth_progress = BIRTH_PROGRESS_TYPES[3];
            break;
          }
          case 'Keizersn': {
            child.birth_progress = BIRTH_PROGRESS_TYPES[4];
            break;
          }
          default: {
            child.birth_progress = tmpCsvRow.birth_progress;
          }
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

        // Determine child surrogate mother
        const surrogateMother = {
          uln_country_code: '',
          uln_number: '',
          uln: '',
          worker_number: ''
        };

        if (
          tmpCsvRow.surrogate_mother.length === 12
          && /^\d+$/.test(tmpCsvRow.surrogate_mother)
          && !child.has_lambar
        ) {
          surrogateMother.uln_number = tmpCsvRow.surrogate_mother;
          child.surrogate_mother = surrogateMother;
          child.surrogateMotherMissingUlnCountryCode = true;
        } else if (
          tmpCsvRow.surrogate_mother.length === 5
          && /^\d+$/.test(tmpCsvRow.surrogate_mother)
          && !child.has_lambar
        ) {
          surrogateMother.worker_number = tmpCsvRow.surrogate_mother;
          child.surrogate_mother = surrogateMother;
          child.surrogateMotherMissingUlnCountryCode = true;

          this.setSurrogateMother(child, birthRequest);

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
            animal.suggested = true;
            if (animal.uln_country_code && animal.uln_number) {

              animal.uln = animal.uln_country_code + animal.uln_number;
              if (!animal.worker_number) {
                animal.worker_number = animal.uln_number.substr(animal.uln_number.length - 5);
              }
            }
            if (animal.pedigree_country_code && animal.pedigree_number) {
              animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
            }
          }

          for (const animal of otherCandidateFathers) {
            if (animal.uln_country_code && animal.uln_number) {

              animal.uln = animal.uln_country_code + animal.uln_number;
              if (!animal.worker_number) {
                animal.worker_number = animal.uln_number.substr(animal.uln_number.length - 5);
              }
            }
            if (animal.pedigree_country_code && animal.pedigree_number) {
              animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
            }
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
          this.validateBirthRequest(birthRequest);
          this.loadingStatesCount--;
          this.isLoadingCandidateFathers = false;
        },
        err => {
          birthRequest.suggestedCandidateFathersIsLoading = false;
          this.validateBirthRequest(birthRequest);
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
        },
        err => {
          alert(this.apiService.getErrorMessage(err));
        }
      );
  }

  setMother(birthRequest: ExtendedBirthRequest) {
    this.selectedBirthRequest = birthRequest;

    this.isLoadingCandidateMothers = true;
    this.loadingStatesCount++;

    this.suggestedCandidateMothers = this.ewesInLivestock;

    for (const animal of this.suggestedCandidateMothers) {
      animal.suggested = true;
      if (animal.uln_country_code && animal.uln_number) {
        animal.uln = animal.uln_country_code + animal.uln_number;
        if (!animal.worker_number) {
          animal.worker_number = animal.uln_number.substr(animal.uln_number.length - 5);
        }
      }

      if (animal.pedigree_country_code && animal.pedigree_number) {
        animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
      }
    }

    this.suggestedCandidateMothers = this.suggestedCandidateMothers.filter(function( ewe ) {
      return ewe.worker_number === birthRequest.mother.worker_number;
    });

    if (this.suggestedCandidateMothers.length === 1) {
      this.selectedBirthRequest.mother = {
        uln_country_code: this.suggestedCandidateMothers[0].uln_country_code,
        uln_number: this.suggestedCandidateMothers[0].uln_number,
        uln: this.suggestedCandidateMothers[0].uln,
        worker_number: this.suggestedCandidateMothers[0].worker_number
      };

      // this.selectedBirthRequest.motherHasChanged = true;
      this.selectedBirthRequest.motherMissingUlnCountryCode = false;
    }

    this.validateBirthRequest(this.selectedBirthRequest);
    this.isLoadingCandidateMothers = false;
    this.loadingStatesCount--;
  }

  getCandidateMothers(birthRequest: ExtendedBirthRequest) {
    this.selectedBirthRequest = birthRequest;
    this.isLoadingCandidateMothers = true;
    this.loadingStatesCount++;
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
              if (!animal.worker_number) {
                animal.worker_number = animal.uln_number.substr(animal.uln_number.length - 5);
              }
            }
            if (animal.pedigree_country_code && animal.pedigree_number) {
              animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
            }
          });

          this.suggestedCandidateMothers = suggestedCandidateMothers;
          this.isLoadingCandidateMothers = false;
          this.loadingStatesCount--;
          resolve();
        }).catch(
          err => {
          reject(err);
      });
    }).catch(
      error => {
        this.isLoadingCandidateMothers = false;
        this.loadingStatesCount--;
      }
    );
  }


  getCandidateFathers(birthRequest: ExtendedBirthRequest) {
    this.selectedBirthRequest = birthRequest;

    this.isLoadingCandidateFathers = true;
    this.loadingStatesCount++;

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
              if (!animal.worker_number) {
                animal.worker_number = animal.uln_number.substr(animal.uln_number.length - 5);
              }
            }
            if (animal.pedigree_country_code && animal.pedigree_number) {
              animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
            }
          }

          for (const animal of otherCandidateFathers) {
            if (animal.uln_country_code && animal.uln_number) {

              animal.uln = animal.uln_country_code + animal.uln_number;
              if (!animal.worker_number) {
                animal.worker_number = animal.uln_number.substr(animal.uln_number.length - 5);
              }
            }
            if (animal.pedigree_country_code && animal.pedigree_number) {
              animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
            }
          }

          this.suggestedCandidateFathers = suggestedCandidateFathers.concat(otherCandidateFathers);
          this.isLoadingCandidateFathers = false;
          this.loadingStatesCount--;
        },
        err => {
          this.isLoadingCandidateFathers = false;
          this.loadingStatesCount--;
        }
      );
  }

  getCandidateSurrogates(birthRequest, child) {

    this.selectedChild = child;

    if (!birthRequest.mother.uln) {
      return;
    }

    this.candidateSurrogatesRequest.date_of_birth = moment(birthRequest.date_of_birth)
      .format(this.settings.MODEL_DATETIME_FORMAT);

    this.isLoadingCandidateSurrogates = true;
    this.loadingStatesCount++;

    this.candidateSurrogates = this.ewesInLivestock;

    for (const animal of this.candidateSurrogates) {
      animal.suggested = true;
      if (animal.uln_country_code && animal.uln_number) {
        animal.uln = animal.uln_country_code + animal.uln_number;
        if (!animal.worker_number) {
          animal.worker_number = animal.uln_number.substr(animal.uln_number.length - 5);
        }
      }

      if (animal.pedigree_country_code && animal.pedigree_number) {
        animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
      }
    }

    this.isLoadingCandidateSurrogates = false;
    this.loadingStatesCount--;
    //
    // const uri = API_URI_DECLARE_BIRTH + '/' + birthRequest.mother.uln + '/candidate-surrogates';
    // this.apiService.doPostRequest(uri, this.candidateSurrogatesRequest)
    //   .subscribe(
    //       (res: JsonResponseModel) => {
    //       let candidateSurrogates = res.result.suggested_candidate_surrogates;
    //       candidateSurrogates = candidateSurrogates.concat(this.parsedMothers);
    //
    //       console.log('wtf');
    //       console.log(this.parsedMothers);
    //       console.log(candidateSurrogates);
    //
    //       for (const animal of candidateSurrogates) {
    //         animal.suggested = true;
    //         if (animal.uln_country_code && animal.uln_number) {
    //           animal.uln = animal.uln_country_code + animal.uln_number;
    //           if (!animal.worker_number) {
    //             animal.worker_number = animal.uln_number.substr(animal.uln_number.length - 5);
    //           }
    //         }
    //
    //         if (animal.pedigree_country_code && animal.pedigree_number) {
    //           animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
    //         }
    //       }
    //       this.candidateSurrogates = candidateSurrogates;
    //       console.log(this.candidateSurrogates);
    //       this.isLoadingCandidateSurrogates = false;
    //       this.loadingStatesCount--;
    //     },
    //     err => {
    //       this.isLoadingCandidateSurrogates = false;
    //       this.loadingStatesCount--;
    //     }
    //   );
  }

  setSurrogateMother(child, birthRequest) {

    this.selectedChild = child;

    if (!birthRequest.mother.uln) {
      return;
    }

    this.isLoadingCandidateSurrogates = true;
    this.loadingStatesCount++;

    this.candidateSurrogates = this.ewesInLivestock;

    for (const animal of this.candidateSurrogates) {
      animal.suggested = true;
      if (animal.uln_country_code && animal.uln_number) {
        animal.uln = animal.uln_country_code + animal.uln_number;
        if (!animal.worker_number) {
          animal.worker_number = animal.uln_number.substr(animal.uln_number.length - 5);
        }
      }

      if (animal.pedigree_country_code && animal.pedigree_number) {
        animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
      }
    }

    this.candidateSurrogates = this.candidateSurrogates.filter(function( ewe ) {
      return ewe.worker_number === child.surrogate_mother.worker_number;
    });

    if (this.candidateSurrogates.length === 1) {
      this.selectedChild.surrogate_mother = this.candidateSurrogates[0];
    }

    // this.selectedChild.surrogateMotherHasChanged = true;
    this.selectedChild.surrogateMotherMissingUlnCountryCode = false;
    this.validateBirthRequest(birthRequest);

    this.isLoadingCandidateSurrogates = false;
    this.loadingStatesCount--;
  }


  selectMother(mother: Animal) {
    this.selectedBirthRequest.mother = mother;
    this.selectedBirthRequest.motherHasChanged = true;
    this.selectedBirthRequest.motherMissingUlnCountryCode = false;
    this.validateBirthRequest(this.selectedBirthRequest);
    this.setCandidateFathers(this.selectedBirthRequest);
  }

  selectFather(father) {
    this.selectedBirthRequest.father = father;
    this.validateBirthRequest(this.selectedBirthRequest);
  }

  removeFather(birthRequest: ExtendedBirthRequest) {
    birthRequest.father = null;
    this.validateBirthRequest(birthRequest);
  }

  selectMotherUlnCountryCode(birthRequest: ExtendedBirthRequest, countryCode: string) {
    birthRequest.motherUlnCountryCodeOnlyHasChanged = true;
    birthRequest.motherMissingUlnCountryCode = false;
    birthRequest.mother.uln_country_code = countryCode;
    birthRequest.mother.uln = countryCode + birthRequest.mother.uln_number;
    this.setCandidateFathers(birthRequest);
    this.validateBirthRequest(birthRequest);
  }

  selectSurrogateMother(surrogateMother) {
    this.selectedChild.surrogate_mother = surrogateMother;
    this.selectedChild.surrogateMotherHasChanged = true;
    this.selectedChild.surrogateMotherMissingUlnCountryCode = false;
  }

  selectSurrogateMotherUlnCountryCode(child: Child, countryCode: string, birthRequest: ExtendedBirthRequest) {
    child.surrogate_mother.uln_country_code = countryCode;
    child.surrogate_mother.uln = countryCode + child.surrogate_mother.uln_number;
    child.surrogateMotherUlnCountryCodeOnlyHasChanged = true;
    child.surrogateMotherMissingUlnCountryCode = false;
    this.validateBirthRequest(birthRequest);
  }

  resetMotherUlnCountryCode(birthRequest: ExtendedBirthRequest) {
    birthRequest.motherUlnCountryCodeOnlyHasChanged = false;
    birthRequest.motherMissingUlnCountryCode = true;
    birthRequest.mother.uln_country_code = '';
    birthRequest.mother.uln = '';
    this.validateBirthRequest(birthRequest);
  }

  resetSurrogateMotherUlnCountryCode(child: Child, birthRequest: ExtendedBirthRequest) {
    child.surrogate_mother.uln_country_code = '';
    child.surrogate_mother.uln = '';
    child.surrogateMotherUlnCountryCodeOnlyHasChanged = false;
    child.surrogateMotherMissingUlnCountryCode = true;
    this.validateBirthRequest(birthRequest);
  }

  resetMother(birthRequest: ExtendedBirthRequest) {
    const mother = {
      uln_country_code: '',
      uln_number: '',
      uln: '',
      worker_number: ''
    };

    birthRequest.motherHasChanged = false;
    birthRequest.mother = mother;
    birthRequest.motherMissingUlnCountryCode = true;
    this.validateBirthRequest(birthRequest);
  }

  resetSurrogateMother(child: Child, birthRequest: ExtendedBirthRequest) {
    const surrogateMother = {
      uln_country_code: '',
      uln_number: '',
      uln: '',
      worker_number: child.surrogate_mother.worker_number
    };

    child.surrogate_mother.uln_country_code = '';
    child.surrogate_mother.uln_number = '';
    child.surrogate_mother.uln = '';

    child.surrogate_mother = surrogateMother;
    child.surrogateMotherHasChanged = false;
    this.validateBirthRequest(birthRequest);
  }

  validateBirthRequest(birthRequest: ExtendedBirthRequest) {
    // reset warnings first
    this.multipleCandidateFatherBirthRequests = this.multipleCandidateFatherBirthRequests.filter(function( obj ) {
      return obj.index !== birthRequest.index;
    });
    this.missingMotherBirthRequests = this.missingMotherBirthRequests.filter(function( obj ) {
      return obj.index !== birthRequest.index;
    });

    this.missingSurrogateMotherBirthRequests = this.missingSurrogateMotherBirthRequests.filter(function( obj ) {
      return (obj.index !== birthRequest.index);
    });

    const hadWarnings = birthRequest.hasWarnings;
    let missingSurrogateMother = false;
    birthRequest.hasWarnings = false;

    // Determine warning types
    if (birthRequest.hasMultipleCandidateFathers && !birthRequest.father) {
      this.multipleCandidateFatherBirthRequests.push(birthRequest);
      birthRequest.hasWarnings = true;
    }

    if (birthRequest.motherMissingUlnCountryCode) {
      this.missingMotherBirthRequests.push(birthRequest);
      birthRequest.hasWarnings = true;
    }

    if (birthRequest.children !== undefined) {
      for (const child of <Child[]>birthRequest.children) {
        if (child.surrogateMotherMissingUlnCountryCode) {
          birthRequest.hasWarnings = true;
          birthRequest.surrogateMotherMissingUlnCountryCode = true;
          missingSurrogateMother = true;
        }
      }
    }

    if (missingSurrogateMother) {
      this.missingSurrogateMotherBirthRequests.push(birthRequest);
    }

    if (!hadWarnings && birthRequest.hasWarnings) {
      this.birthRequestWarningsCount++;
    } else if (hadWarnings && !birthRequest.hasWarnings) {
      this.birthRequestWarningsCount--;
    }
  }

  submitBirthRequests() {
    if (this.birthRequestWarningsCount > 0) {
      this.toggleAllWarningsModal();
    } else {
      this.doSubmitBirthRequests();
    }
  }

  submitSingleBirthRequest(birthRequest: ExtendedBirthRequest) {
    this.selectedBirthRequest = birthRequest;
    if (this.selectedBirthRequest.hasWarnings) {
      this.toggleSingleWarningModal();
    } else {
      this.doSubmitSingleBirthRequest(birthRequest);
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
    this.birthRequests.forEach((birthRequest) => {
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

  doSubmitSingleBirthRequest(birthRequest: ExtendedBirthRequest) {
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
  }
}
