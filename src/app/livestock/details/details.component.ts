import * as moment from 'moment';
import * as _ from 'lodash';

import {Component} from '@angular/core';
import {MatSnackBar} from '@angular/material';
import {ActivatedRoute, Router} from '@angular/router';
import {LIVESTOCK_BREED_OPTIONS, LIVESTOCK_GENDER_OPTIONS} from '../livestock.model';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {
  API_URI_ANIMAL_GENDER,
  API_URI_ANIMAL_NICKNAME,
  API_URI_CHANGE_ANIMAL_DETAILS,
  API_URI_GET_ANIMAL_DETAILS,
  API_URI_GET_COLLAR_COLORS,
  API_URI_GET_COUNTRY_CODES,
  API_URI_GET_EARTAGS, API_URI_MEASUREMENTS,
} from '../../shared/services/nsfo-api/nsfo.settings';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {DateValidator} from '../../shared/validation/nsfo-validation';
import {SettingsService} from '../../shared/services/settings/settings.service';
import {DownloadService} from '../../shared/services/download/download.service';
import {Animal, BLINDNESS_FACTOR_TYPES, Rearing} from '../../shared/models/animal.model';
import {Exterior} from '../../shared/models/measurement.model';
import {Inspector, User} from '../../shared/models/person.model';
import {DeclareLog} from './declare-log.model';
import {JsonResponseModel} from '../../shared/models/json-response.model';
import {GoogleChartConfigModel} from '../../shared/models/google.chart.config.model';
import {BreedValues} from '../../shared/models/breedvalues.model';
import {TranslateService} from '@ngx-translate/core';
import {PaginationService} from 'ngx-pagination';
import {CacheService} from '../../shared/services/settings/cache.service';
import {DatePipe} from '@angular/common';
import {StringValidation} from '../../shared/validation/string.validation';
import {ResponseResultModel} from '../../shared/models/response-result.model';
import {BIRTH_PROGRESS_TYPES} from '../../rvo-declares/birth/birth.model';
import {PREDICATE_TYPES} from '../../shared/models/predicate-details.model';
import {HttpErrorResponse} from '@angular/common/http';
import {BirthMeasurementsResponse} from '../birth-measurements-response.model';

@Component({
  templateUrl: './details.component.html',
  providers: [PaginationService],
})

export class LivestockDetailComponent {

    public breedValueData: any[];
    public breedValueConfig: GoogleChartConfigModel;
    public breedValueElementId: string;

    public weightData: any[];
    public weightConfig: GoogleChartConfigModel;
    public weightElementId: string;

  // ANIMAL DETAILS
  public form: FormGroup;
  public animal: Animal = new Animal();
  public temp_animal: Animal;
  public fatherAnimal: Animal = new Animal();
  public motherAnimal: Animal = new Animal();
  public children: Animal[] = [];
  public collar_color_list = [];
  public view_date_format: string;
  public model_datetime_format: string;
  public livestock_gender_options = LIVESTOCK_GENDER_OPTIONS;
  public livestock_breed_options = LIVESTOCK_BREED_OPTIONS;

  // EDIT MODES
  public birth_measurements_edit_mode = false;
  public blindness_factor_edit_mode = false;
  public breed_type_edit_mode = false;
  public collar_edit_mode = false;
  public gender_edit_mode = false;
  public nickname_edit_mode = false;
  public notes_edit_mode = false;
  public predicate_edit_mode = false;
  public scan_measurements_edit_mode = false;

  public changeEnabled = false;
  public in_progress = false;

  public error_message = 'AN ERROR OCCURRED WHILE SAVING';

  // WEIGHTS GRAPH
  public measurementDates: string[] = [];
  public measurementWeights: number[] = [];

  // DECLARE LOG
  public logs: DeclareLog[] = [];

  // BREED VALUES GRAPH
  public breedValues: BreedValues[] = [];

  // EXTERIOR MEASUREMENTS
  public selectedExterior: Exterior = new Exterior();
  public isAdmin = false;
  public selectedExteriorDate = '';

  public model_date_format: string;

  // LOADING PRIMARY DATA
  public isLoadingAnimalDetails: boolean;
  public isLoadingChildren: boolean;
  public hasLoadedChildren: boolean;
  public isLoadingCollarColorList: boolean;
  isLoadingPrimaryData: boolean;

  // LOADING SECONDARY DATA
  // This data can be loaded separately
  public isLoadingAnnotations: boolean;

  public displayChildren = false;
  public childrenPage = 1;

  public animalHistory: string[] = [];

  public selectedUlnOrAnimalId: string;

  private maxChildrenCountToDisplayChildDetails = 2000;

  public birth_progress_types = BIRTH_PROGRESS_TYPES;
  public blindness_factor_types = BLINDNESS_FACTOR_TYPES;
  public predicate_types = PREDICATE_TYPES;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private apiService: NSFOService,
              private cache: CacheService,
              private datePipe: DatePipe,
              public settings: SettingsService,
              private fb: FormBuilder,
              private translate: TranslateService,
              private downloadService: DownloadService,
              public snackBar: MatSnackBar
  ) {
    this.isAdmin = settings.isAdmin();
    this.view_date_format = settings.getViewDateFormat();
    this.model_datetime_format = settings.getModelDateTimeFormat();
    this.model_date_format = settings.getModelDateFormat();

    this.animal.surrogate_mother = new Animal();
    this.animal.mother = '';
    this.animal.father = '';
    this.animal.uln = '';
    this.form = fb.group({
      date_of_birth: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat])),
      pedigree_country_code: new FormControl('NL'),
      pedigree_number: new FormControl(''),
      collar_number: new FormControl('')
    });

    // Recreate component if the route is navigated to again. Usually with for a different animal
    route.params.subscribe(value => {
      if (this.selectedUlnOrAnimalId !== value.uln) {
        this.selectedUlnOrAnimalId = value.uln;
        this.loadingData();
      }
    });
  }

  private openSaveConfirmationSnackBar() {
    const message = this.translate.instant('THE ANIMAL INFO HAS BEEN SAVED') + '!';
    this.snackBar.open(message);
  }

  public updateHistory(event: string) {
      if (this.animal.id != null) {
        this.animalHistory.push(this.animal.id);
      } else {
        this.animalHistory.push(this.animal.uln);
      }
  }

  startLoading() {
    // Primary data
    this.isLoadingPrimaryData = true;
    this.isLoadingAnimalDetails = true;
    this.isLoadingCollarColorList = true;
    this.displayChildren = false;
    this.hasLoadedChildren = false;
    this.children = [];
    this.childrenPage = 1;

    // Secondary data
    this.isLoadingAnnotations = true;
  }

  updatePrimaryDataLoadingStatus() {
    this.isLoadingPrimaryData = this.isLoadingAnimalDetails || this.isLoadingCollarColorList;
  }

  public loadingData() {
    this.startLoading();

    this.breedValueElementId = 'breed-value';
    this.weightElementId = 'weight-chart';
    this.getCollarColorList();
    this.getAnimalDetails();

    this.breedValueConfig = new GoogleChartConfigModel({
      // title: this.translate.instant('BREED VALUES'),
      animation: {
        duration: 1000,
        easing: 'out'},
      bar: {
        groupWidth: '75%'
      },
      legend: {position: 'none'},
      chartArea: {
        width: '90%',
        height: '90%',
      },
      vAxis: {
        baseline: 100,
        ticks: [60, 80, 100, 120, 140],
        viewWindow: {
          min: 60,
          max: 140
        },
      }
    });
    this.weightConfig = new GoogleChartConfigModel({
      title: 'Gewichten',
      pointSize: 10,
      legend: {position: 'none'},
    });
  }

  public animalDetailHeaderExtraInfo(): string {
    let extraInfo = '';
    let prefix = '';

    if (!this.animal.is_alive) {
      if (StringValidation.isNotEmpty(this.animal.date_of_death)) {
        const formattedDateOfDeath = this.datePipe.transform(this.animal.date_of_death, this.settings.getViewDateFormatInComponent());
        extraInfo += this.translate.instant('DEAD') + ' [' + formattedDateOfDeath + ']';
      } else {
        extraInfo += this.translate.instant('DEAD');
      }
      prefix = ', ';
    }

    if (this.cache.getUbn() !== this.animal.ubn) {
      extraInfo += prefix + this.translate.instant('INACTIVE');
    }
    return extraInfo;
  }

  public genderType(gender: string): string {
    const gender_type = {
      'FEMALE': 'EWE',
      'MALE': 'RAM',
      'NEUTER': 'NEUTER'
    };

    return gender_type[gender];
  }

  public getCollarColorList() {
    this.apiService
      .doGetRequest(API_URI_GET_COLLAR_COLORS)
      .subscribe(
          (res: JsonResponseModel) => {
            this.collar_color_list = res.result;
            this.isLoadingCollarColorList = false;
            this.updatePrimaryDataLoadingStatus();
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
          this.isLoadingCollarColorList = false;
          this.updatePrimaryDataLoadingStatus();
        }
      );
  }

  public getAnimalDetails() {
    this.apiService
      .doGetRequest(API_URI_GET_ANIMAL_DETAILS + '/' + this.selectedUlnOrAnimalId)
      .subscribe((res: JsonResponseModel) => {
          this.animal = res.result;
          this.animal.uln = this.animal.uln_country_code + this.animal.uln_number;
          this.animal.date_of_birth = moment(this.animal.date_of_birth).format(this.settings.getViewDateFormat());
          this.form.get('date_of_birth').setValue(this.animal.date_of_birth);

          if (!(!!this.animal.pedigree_country_code && !!this.animal.pedigree_number)) {
            this.form.get('pedigree_country_code').setValue('NL');
          }

          this.formatRetrievedExteriors();

          // WEIGHTS CHART DATA
          this.animal.weights = _.orderBy(this.animal.weights, ['measurement_date'], ['asc']);
          this.measurementDates = [];
          this.measurementWeights = [];
          for (const weight of this.animal.weights) {
            const weightDate = this.stringAsViewDate(weight.measurement_date);
            const weightMeasurement = Number(weight.weight);
            this.measurementDates.push(weightDate);
            this.measurementWeights.push(weightMeasurement);
          }


          if (this.animal.weights.length === 1) {
            this.measurementDates.push(moment().format(this.settings.getViewDateFormat()));
            this.measurementWeights.push(null);
          }


          // LOGS
          this.logs = this.animal.declare_log.length > 0 ? this.animal.declare_log : [];

          this.changeEnabled = false;
          this.temp_animal = _.cloneDeep(this.animal);

          // this.getExteriorKinds();
          // this.getInspectors();

          this.breedValueData = [
            ['Year', 'Fokwaarde',  {role: 'annotation'}, {role: 'tooltip'}, {role: 'style'}],
          ];
          this.breedValues = [];

          this.animal.breed_values.forEach((breedValue) => {
            if (breedValue.has_data) {
              this.breedValues.push(breedValue);
              const value = breedValue.normalized_value;
              const tooltipValue = breedValue.prioritize_normalized_values_in_table ?
                breedValue.normalized_value.toString() : breedValue.value.toString();
              this.breedValueData.push(
                [
                  '',
                  value,
                  breedValue.ordinal.toString(),
                  breedValue.chart_label + ' ' + tooltipValue + ' / ' + breedValue.accuracy.toString() + '%',
                  'color: ' + breedValue.chart_color + ';'
                ]
              );
            }
          });

          this.weightData = [];
          this.weightData = [[
            this.translate.instant('YEAR'),
            this.translate.instant('WEIGHT')
          ]];

          this.animal.weights.forEach((weight) => {
            const date = moment(weight.measurement_date).format('DD-MM-YYYY');
            this.weightData.push([date, weight.weight]);
          });

          this.fatherAnimal = undefined;
          if  (res.result.parent_father) {
            this.fatherAnimal = res.result.parent_father;
            this.fatherAnimal.pedigree = res.result.parent_father.stn;
            this.fatherAnimal.dd_mm_yyyy_date_of_birth = res.result.parent_father.dd_mm_yyyy_date_of_birth;
            this.fatherAnimal.gender = 'MALE';
            this.fatherAnimal.litter_size = res.result.parent_father.n_ling;
          }
          this.motherAnimal = undefined;
          if (res.result.parent_mother) {
            this.motherAnimal = res.result.parent_mother;
            this.motherAnimal.pedigree = res.result.parent_mother.stn;
            this.motherAnimal.dd_mm_yyyy_date_of_birth = res.result.parent_mother.dd_mm_yyyy_date_of_birth;
            this.motherAnimal.gender = 'FEMALE';
            this.motherAnimal.litter_size = res.result.parent_mother.n_ling;
          }

          // window.scrollTo(0, 0);
          this.isLoadingAnimalDetails = false;

          if (this.isAdmin || (!this.isAdmin && this.animal.is_own_animal)) {
            this.changeEnabled = true;
          }

          if (typeof this.animal.inbreeding_coefficient === 'number') {
            this.animal.inbreeding_coefficient = (new Intl.NumberFormat([], {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1
            }).format(Number(this.animal.inbreeding_coefficient * 100))) + '%';
          }

          this.updatePrimaryDataLoadingStatus();
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
          this.isLoadingAnimalDetails = false;
          this.updatePrimaryDataLoadingStatus();
        }
      );
  }

  private formatRetrievedExteriors(resetSelectedExterior = true) {
    // EXTERIORS
    if (this.animal.exteriors.length > 0) {
      if (resetSelectedExterior) {
        this.selectedExterior = this.animal.exteriors[0];
      }
      if (this.selectedExterior) {
        this.selectedExteriorDate = this.selectedExterior.measurement_date;
      }

    } else {
      this.selectedExterior = new Exterior();
      this.selectedExteriorDate = '';
    }

    this.animal.exteriors.forEach((item) => {
      if (!item.hasOwnProperty('inspector')) {
        item.inspector = new Inspector();
      }
    });
  }

  public setLatestExteriors(exteriors: Exterior[]) {
    this.animal.exteriors = exteriors;
    this.formatRetrievedExteriors(false);
  }

  toggleDisplayChildren() {
    if (this.animal.child_count > this.maxChildrenCountToDisplayChildDetails) {
      alert(this.getMaxAnimalErrorMessage());
    } else {
      this.displayChildren = !this.displayChildren;
      this.getChildren();
    }
  }

  public getChildren() {
    if (!this.hasLoadedChildren && !this.isLoadingChildren) {
      this.doGetChildren();
    }
  }

  private getMaxAnimalErrorMessage(): string {
    return this.translate.instant('THIS ANIMAL HAS TOO MANY CHILDREN TO DISPLAY THE DETAILS FOR.') + ' ' +
    this.translate.instant('LIMIT') + ': ' + this.maxChildrenCountToDisplayChildDetails + ' ' +
    this.translate.instant('CHILDREN');
  }

  private doGetChildren() {
    this.isLoadingChildren = true;
    this.apiService
      .doGetRequest(API_URI_GET_ANIMAL_DETAILS + '/' + this.selectedUlnOrAnimalId + '/children')
      .subscribe(
        (res: JsonResponseModel) => {
          this.children = res.result;
          for (const child of this.children) {
            child.litter_size = child.n_ling ? child.n_ling.toString() : undefined;
          }
          this.hasLoadedChildren = true;
          this.childrenPage = 1;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        },
        () => {
          this.isLoadingChildren = false;
        }
      );
  }

  animalExists(animal: Animal): boolean {
    return !!animal && (!!animal.uln || (!!animal.uln_country_code && !!animal.uln_number));
  }

  hasWeights(): boolean {
    return this.animal.weights.length > 0;
  }

  hasBreedValues(): boolean {
    return this.breedValues.length > 0;
  }

  public isAnyEditModeActive(): boolean {
    return this.birth_measurements_edit_mode ||
      this.blindness_factor_edit_mode ||
      this.breed_type_edit_mode ||
      this.collar_edit_mode ||
      this.gender_edit_mode ||
      this.nickname_edit_mode ||
      this.notes_edit_mode ||
      this.predicate_edit_mode ||
      this.scan_measurements_edit_mode
      ;
  }

  private deactivateEditModes(editModeToKeepActive: string) {
    if (editModeToKeepActive !== 'birthMeasurements') { this.birth_measurements_edit_mode = false; }
    if (editModeToKeepActive !== 'blindnessFactor')   { this.blindness_factor_edit_mode = false; }
    if (editModeToKeepActive !== 'breedType')         { this.breed_type_edit_mode = false; }
    if (editModeToKeepActive !== 'collar')            { this.collar_edit_mode = false; }
    if (editModeToKeepActive !== 'gender')            { this.gender_edit_mode = false; }
    if (editModeToKeepActive !== 'nickname')          { this.nickname_edit_mode = false; }
    if (editModeToKeepActive !== 'notes')             { this.notes_edit_mode = false; }
    if (editModeToKeepActive !== 'predicate')         { this.predicate_edit_mode = false; }
    if (editModeToKeepActive !== 'scanMeasurements')  { this.scan_measurements_edit_mode = false; }
  }

  private actionsAfterSuccessfulSave() {
    this.deactivateEditModes('none');
    this.changeEnabled = true;
    this.temp_animal = _.cloneDeep(this.animal);
    this.openSaveConfirmationSnackBar();
  }

  private actionsAfterFailedSave(err: HttpErrorResponse) {
    this.animal = _.cloneDeep(this.temp_animal);
    this.changeEnabled = true;
    const errorMessage = this.apiService.getErrorMessage(err);
    alert(errorMessage);
  }

  public sendGenderChangeRequest() {
    if (!this.animal.is_own_animal && !this.isAdmin) {
      return;
    }
    this.changeEnabled = false;
    this.gender_edit_mode = false;

    const request = {
      'gender': this.genderType(this.animal.gender),
      'uln_country_code': this.animal.uln_country_code,
      'uln_number': this.animal.uln_number
    };

    this.apiService
      .doPostRequest(API_URI_ANIMAL_GENDER, request)
      .subscribe(
        (result: Animal) => {
          this.animal.gender = result.gender;
          this.actionsAfterSuccessfulSave();
        },
        err => {
          this.actionsAfterFailedSave(err);
        }
      );
  }

  public sendNicknameChangeRequest() {
    if (!this.animal.is_own_animal && !this.isAdmin) {
      return;
    }
    this.changeEnabled = false;
    this.nickname_edit_mode = false;

    const request = {
      'nickname': this.animal.nickname,
      'id': this.animal.id
    };

    this.apiService
      .doPutRequest(API_URI_ANIMAL_NICKNAME + '/' + this.animal.id, request)
      .subscribe(
        (res: ResponseResultModel) => {
          const result: Animal = res.result;
          this.animal.nickname = result.nickname;
          this.actionsAfterSuccessfulSave();
        },
        err => {
          this.actionsAfterFailedSave(err);
        }
      );
  }

  public sendBirthMeasurementsChangeRequest() {
    if (!this.isAdmin) {
      return;
    }
    this.birth_measurements_edit_mode = false;
    this.changeEnabled = false;

    const newBirthWeight = this.animal.birth.birth_weight;
    const newTailLength = this.animal.birth.tail_length;
    const newBirthProgress = this.animal.birth.birth_progress;

    const request = {
      'birth_weight': newBirthWeight,
      'tail_length': newTailLength,
      'birth_progress': newBirthProgress,
      'reset_measurement_date_using_date_of_birth': false
    };

    if (newBirthWeight === null || newBirthWeight === undefined || newBirthWeight === 0) {
      delete request.birth_weight;
    }

    if (newTailLength === null || newTailLength === undefined || newTailLength === 0) {
      delete request.tail_length;
    }

    this.apiService
      .doPutRequest(API_URI_MEASUREMENTS + '/' + this.animal.id + '/birth-measurements', request)
      .subscribe(
        (res: ResponseResultModel) => {
          const result: BirthMeasurementsResponse = res.result;
          this.animal.birth.birth_progress = result.birth_progress;
          if (result.birth_weight != null) {
            this.animal.birth.birth_weight = result.birth_weight.weight;
          } else {
            delete this.animal.birth.birth_weight;
          }

          if (result.tail_length != null) {
            this.animal.birth.tail_length = result.tail_length.length;
          } else {
            delete this.animal.birth.tail_length;
          }

          this.actionsAfterSuccessfulSave();
        },
        err => {
          this.actionsAfterFailedSave(err);
        }
      );
  }

  public sendGeneralChangeRequest() {
    if (!this.animal.is_own_animal && !this.isAdmin) {
      return;
    }
    this.changeEnabled = false;
    this.deactivateEditModes('none');

    if (this.animal.collar.color) {
      if (this.animal.collar.number === '') {
        this.changeEnabled = true;
        return false;
      }
    }

    let request: object;

    let newRearingEditValue: any = null;
    if (this.animal.rearing.surrogate != null) {
      newRearingEditValue = this.animal.rearing.surrogate.id;
    } else if (this.animal.rearing.lambar === true) {
      newRearingEditValue = 'LAMBAR';
    }

    if (this.isAdmin) {
      request = {
        'collar': this.animal.collar,
        'predicate_details': {
          'type': this.animal.predicate_details.type,
          'score': this.animal.predicate_details.score
        },
        'blindness_factor': this.animal.blindness_factor,
        'breed_type': this.animal.breed_type,
        'rearing': newRearingEditValue
      };
    } else {
      request = {
        'collar': this.animal.collar,
        'blindness_factor': this.animal.blindness_factor,
        'breed_type': this.animal.breed_type,
        'rearing': newRearingEditValue
      };
    }

    this.apiService
      .doPutRequest(API_URI_CHANGE_ANIMAL_DETAILS + '/' + this.temp_animal.uln, request)
      .subscribe(
        (res: ResponseResultModel) => {
          this.changeEnabled = true;
          const result: Animal = res.result;

          this.animal.collar.color = result.collar.color;
          this.animal.collar.number = result.collar.number;
          this.animal.predicate_details.type = result.predicate_details.type;
          this.animal.predicate_details.score = result.predicate_details.score;
          this.animal.predicate_details.formatted = result.predicate_details.formatted;
          this.animal.blindness_factor = result.blindness_factor;
          this.animal.predicate_details.formatted = result.predicate_details.formatted;
          this.animal.predicate_details.formatted = result.predicate_details.formatted;

          this.actionsAfterSuccessfulSave();
        },
        err => {
          this.actionsAfterFailedSave(err);
        }
      );
  }


  public generateLineageProof(fileType: string) {
    this.downloadService.doLineageProofPostRequest([this.animal], fileType);
  }


  public selectTag(tag) {
    this.animal.uln = tag.uln;
    this.animal.uln_country_code = tag.uln_country_code;
    this.animal.uln_number = tag.uln_number;
    this.animal.work_number = tag.ulnLastFive;
  }

  private isAdminOrIsHolderOfAnimal(): boolean {
    return this.animal.is_own_animal || this.isAdmin;
  }

  public allowGenderEdit(): boolean {
    return this.isAdminOrIsHolderOfAnimal();
  }

  public toggleGenderEditMode() {
    if (!this.allowGenderEdit()) {
      return;
    }
    this.gender_edit_mode = !this.gender_edit_mode;

    this.animal = _.cloneDeep(this.temp_animal);

    if (this.gender_edit_mode) {
      this.deactivateEditModes('gender');
    }
  }

  public allowBirthMeasurementsEdit(): boolean {
    return this.isAdminOrIsHolderOfAnimal();
  }

  public toggleBirthMeasurementsEditMode() {
    if (!this.isAdminOrIsHolderOfAnimal()) {
      return;
    }
    this.birth_measurements_edit_mode = !this.birth_measurements_edit_mode;

    this.animal = _.cloneDeep(this.temp_animal);

    if (this.birth_measurements_edit_mode) {
      this.deactivateEditModes('birthMeasurements');
    }
  }

  public allowNickNameEdit(): boolean {
    return this.isAdminOrIsHolderOfAnimal();
  }

  public toggleNicknameEditMode() {
    if (!this.allowNickNameEdit()) {
      return;
    }
    this.nickname_edit_mode = !this.nickname_edit_mode;

    this.animal = _.cloneDeep(this.temp_animal);

    if (this.nickname_edit_mode) {
      this.deactivateEditModes('nickname');
    }
  }

  public allowCollarEdit(): boolean {
    return this.isAdminOrIsHolderOfAnimal();
  }

  public toggleCollarEditMode() {
    if (!this.allowCollarEdit()) {
      return;
    }
    this.collar_edit_mode = !this.collar_edit_mode;

    this.animal = _.cloneDeep(this.temp_animal);

    if (this.collar_edit_mode) {
      this.deactivateEditModes('collar');
    }
  }

  public allowPredicateEdit(): boolean {
    return this.isAdmin;
  }

  public togglePredicateEditMode() {
    if (!this.allowPredicateEdit()) {
      return;
    }
    this.predicate_edit_mode = !this.predicate_edit_mode;

    this.animal = _.cloneDeep(this.temp_animal);

    if (this.predicate_edit_mode) {
      this.deactivateEditModes('predicate');
    }
  }

  public allowBlindnessEdit(): boolean {
    return this.isAdmin;
  }

  public toggleBlindnessFactorEditMode() {
    if (!this.allowBlindnessEdit) {
      return;
    }
    this.blindness_factor_edit_mode = !this.blindness_factor_edit_mode;

    this.animal = _.cloneDeep(this.temp_animal);

    if (this.blindness_factor_edit_mode) {
      this.deactivateEditModes('blindnessFactor');
    }
  }

  public allowBreedTypeEdit(): boolean {
    return this.isAdmin;
  }

  public toggleBreedTypeEditMode() {
    if (!this.allowBreedTypeEdit()) {
      return;
    }
    this.breed_type_edit_mode = !this.breed_type_edit_mode;

    this.animal = _.cloneDeep(this.temp_animal);

    if (this.breed_type_edit_mode) {
      this.deactivateEditModes('breedType');
    }
  }

  public allowRearingEdit(): boolean {
    return this.isAdminOrIsHolderOfAnimal();
  }

  public updateRearing(rearing: Rearing) {
    this.animal.rearing = rearing;
    this.sendGeneralChangeRequest();
  }

  public allowNotesEdit(): boolean {
    return this.animal.is_own_animal;
  }

  public toggleScanMeasurementsEditMode() {
    if (!this.animal.is_own_animal && !this.isAdmin) {
      return;
    }
    this.scan_measurements_edit_mode = !this.scan_measurements_edit_mode;

    this.animal = _.cloneDeep(this.temp_animal);

    if (this.scan_measurements_edit_mode) {
      this.deactivateEditModes('scanMeasurements');
    }
  }

  public goBack() {
    if (this.animalHistory.length === 0) {
        this.router.navigate(['/main/livestock/overview']);
    } else {
        const animalUln = this.animalHistory.pop();
        if (this.animal.uln === animalUln) {
            this.goBack();
        }
        this.router.navigate(['/main/livestock/details/' + animalUln]);
    }
  }

  public stringAsViewDate(date) {
    return moment(date).format(this.settings.getViewDateFormat());
  }

  public stringAsViewDateTime(date) {
    return moment(date).format(this.settings.getViewDateTimeFormat());
  }

  public stringAsModelDate(date) {
    return moment(date).format(this.settings.getModelDateFormat());
  }
}
