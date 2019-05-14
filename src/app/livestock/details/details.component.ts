import * as moment from 'moment';
import * as _ from 'lodash';

import {Component, OnInit} from '@angular/core';
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
import {Animal} from '../../shared/models/animal.model';
import {Exterior} from '../../shared/models/measurement.model';
import {Inspector, User} from '../../shared/models/person.model';
import {DeclareLog} from './declare-log.model';
import {JsonResponseModel} from '../../shared/models/json-response.model';
import {GoogleChartConfigModel} from '../../shared/models/google.chart.config.model';
import {BreedValues} from '../../shared/models/breedvalues.model';
import {TranslateService} from '@ngx-translate/core';
import {PaginationService} from 'ngx-pagination';

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
  public edit_mode = false;
  public gender_edit_mode = false;
  public nickname_edit_mode = false;
  public birth_measurements_edit_mode = false;
  public changeEnabled = false;
  public changed_animal_info = false;
  public changed_animal_info_error = false;
  public gender_changed_animal_info_error = false;
  public nickname_changed_animal_info_error = false;
  public birth_measurements_changed_animal_info_error = false;
  public in_progress = false;
  public sub: any;
  public error_message = 'AN ERROR OCCURRED WHILE SAVING';
  public gender_change_error = '';
  public nickname_change_error = '';
  public birth_measurements_change_error = '';
  public measurementDates: string[] = [];
  public measurementWeights: number[] = [];
  public logs: DeclareLog[] = [];
  public breedValues: BreedValues[] = [];
  // EXTERIOR MEASUREMENTS
  public exteriorForm: FormGroup;
  public isValidExteriorForm = true;
  public isRequestingExterior = false;
  public hasServerError = false;

  public isExteriorEditMode = false;
  public inspectors: User[] = [];
  public kinds: string[] = [];
  public selectedExterior: Exterior = new Exterior();
  public isAdmin = false;
  public tempExterior: Exterior = new Exterior();
  public displayExteriorModal = 'none';
  public selectedExteriorDate = '';

  public invalidMeasurementDate = false;
  public model_date_format: string;

  public isLoadingAnimalDetails: boolean;
  public isLoadingChildren: boolean;
  public hasLoadedChildren: boolean;
  public isLoadingCollarColorList: boolean;
  isLoading: boolean;

  public displayChildren = false;
  public childrenPage = 1;

  public animalHistory: string[] = [];

  private selectedUln: string;

  private maxChildrenCountToDisplayChildDetails = 2000;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private apiService: NSFOService,
              public settings: SettingsService,
              private fb: FormBuilder,
              private translate: TranslateService,
              private downloadService: DownloadService) {
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
      if (this.selectedUln !== value.uln) {
        this.selectedUln = value.uln;
        this.loadingData();
      }
    });
  }

  public updateHistory(event: string) {
      this.animalHistory.push(this.animal.uln);
  }

  startLoading() {
    this.isLoading = true;
    this.isLoadingAnimalDetails = true;
    this.isLoadingCollarColorList = true;
    this.displayChildren = false;
    this.hasLoadedChildren = false;
    this.children = [];
    this.childrenPage = 1;
  }

  updateLoadingStatus() {
    this.isLoading = this.isLoadingAnimalDetails || this.isLoadingCollarColorList;
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
            this.updateLoadingStatus();
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
          this.isLoadingCollarColorList = false;
          this.updateLoadingStatus();
        }
      );
  }

  public getAnimalDetails() {
    this.apiService
      .doGetRequest(API_URI_GET_ANIMAL_DETAILS + '/' + this.selectedUln)
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
          this.temp_animal = _.clone(this.animal);

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

          this.updateLoadingStatus();
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
          this.isLoadingAnimalDetails = false;
          this.updateLoadingStatus();
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
      .doGetRequest(API_URI_GET_ANIMAL_DETAILS + '/' + this.selectedUln + '/children')
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

  public sendGenderChangeRequest() {
    if (!this.animal.is_own_animal && !this.isAdmin) {
      return;
    }
    this.changeEnabled = false;
    this.gender_edit_mode = false;
    this.changed_animal_info = false;
    this.changed_animal_info_error = false;

    const request = {
      'gender': this.genderType(this.animal.gender),
      'uln_country_code': this.animal.uln_country_code,
      'uln_number': this.animal.uln_number
    };

    this.apiService
      .doPostRequest(API_URI_ANIMAL_GENDER, request)
      .subscribe(
        res => {
          this.changed_animal_info = true;
          this.changeEnabled = true;
        },
        err => {
          this.gender_changed_animal_info_error = true;
          this.changeEnabled = true;
          this.gender_change_error = err.error.result.message;
          this.animal.gender = this.temp_animal.gender;
        }
      );
  }

  public sendNicknameChangeRequest() {
    if (!this.animal.is_own_animal && !this.isAdmin) {
      return;
    }
    this.changeEnabled = false;
    this.nickname_edit_mode = false;
    this.changed_animal_info = false;
    this.changed_animal_info_error = false;

    const request = {
      'nickname': this.animal.nickname,
      'id': this.animal.id
    };

    this.apiService
      .doPutRequest(API_URI_ANIMAL_NICKNAME + '/' + this.animal.id, request)
      .subscribe(
        res => {
          this.changed_animal_info = true;
          this.changeEnabled = true;
        },
        err => {
          this.nickname_changed_animal_info_error = true;
          this.changeEnabled = true;
          this.nickname_change_error = this.apiService.getErrorMessage(err);
          this.animal.nickname = this.temp_animal.nickname;
          alert(this.nickname_change_error);
        }
      );
  }

  public sendBirthMeasurementsChangeRequest() {
    if (!this.isAdmin) {
      return;
    }
    this.birth_measurements_edit_mode = false;
    this.birth_measurements_changed_animal_info_error = false;
    this.birth_measurements_change_error = '';
    this.changeEnabled = false;
    this.changed_animal_info = false;
    this.changed_animal_info_error = false;

    const newBirthWeight = this.animal.measurement.birth_weight;
    const newTailLength = this.animal.measurement.tail_length;

    const request = {
      'birth_weight': newBirthWeight,
      'tail_length': newTailLength,
      'reset_measurement_date_using_date_of_birth': false
    };

    if (newBirthWeight === null || newBirthWeight === undefined || newBirthWeight === '') {
      delete request.birth_weight;
    }

    if (newTailLength === null || newTailLength === undefined || newTailLength === '') {
      delete request.tail_length;
    }

    this.apiService
      .doPutRequest(API_URI_MEASUREMENTS + '/' + this.animal.id + '/birth-measurements', request)
      .subscribe(
        res => {
          this.changed_animal_info = true;
          this.changeEnabled = true;
        },
        err => {
          this.birth_measurements_changed_animal_info_error = true;
          this.changeEnabled = true;
          this.birth_measurements_change_error = this.apiService.getErrorMessage(err);
          this.animal.measurement.birth_weight = this.temp_animal.measurement.birth_weight;
          this.animal.measurement.tail_length = this.temp_animal.measurement.tail_length;
          alert(this.birth_measurements_change_error);
        }
      );
  }

  public sendChangeRequest() {
    if (!this.animal.is_own_animal && !this.isAdmin) {
      return;
    }
    this.changeEnabled = false;
    this.edit_mode = false;
    this.changed_animal_info = false;
    this.changed_animal_info_error = false;

    if (this.animal.collar.color) {
      if (this.animal.collar.number === '') {
        this.changed_animal_info = false;
        this.changeEnabled = true;
        return false;
      }
    }

    const request = {
      'collar': this.animal.collar
    };

    this.apiService
      .doPutRequest(API_URI_CHANGE_ANIMAL_DETAILS + '/' + this.temp_animal.uln, request)
      .subscribe(
        res => {
          this.changed_animal_info = true;
          this.changeEnabled = true;

        },
        err => {
          this.changed_animal_info_error = true;
          this.changeEnabled = true;
          this.animal.collar = this.temp_animal.collar;

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


  public toggleGenderEditMode() {
    if (!this.animal.is_own_animal && !this.isAdmin) {
      return;
    }
    this.gender_edit_mode = !this.gender_edit_mode;

    if (!this.gender_edit_mode) {
      this.animal = _.clone(this.temp_animal);
    }
  }

  public toggleBirthMeasurementsEditMode() {
    if (!this.isAdmin) {
      return;
    }
    this.birth_measurements_edit_mode = !this.birth_measurements_edit_mode;

    if (!this.birth_measurements_edit_mode) {
      this.animal = _.clone(this.temp_animal);
    }
  }

  public toggleNicknameEditMode() {
    if (!this.animal.is_own_animal && !this.isAdmin) {
      return;
    }
    this.nickname_edit_mode = !this.nickname_edit_mode;

    if (!this.nickname_edit_mode) {
      this.animal = _.clone(this.temp_animal);
    }
  }

  public toggleEditMode() {
    if (!this.animal.is_own_animal && !this.isAdmin) {
      return;
    }
    this.edit_mode = !this.edit_mode;

    if (!this.edit_mode) {
      this.animal = _.clone(this.temp_animal);
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
