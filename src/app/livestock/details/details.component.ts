import * as moment from 'moment';
import * as _ from 'lodash';

import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {LIVESTOCK_BREED_OPTIONS, LIVESTOCK_GENDER_OPTIONS} from '../livestock.model';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {
  API_URI_ANIMAL_GENDER,
  API_URI_CHANGE_ANIMAL_DETAILS,
  API_URI_GET_ANIMAL_DETAILS,
  API_URI_GET_COLLAR_COLORS,
  API_URI_GET_COUNTRY_CODES,
  API_URI_GET_EARTAGS,
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

@Component({
  templateUrl: './details.component.html',
})

export class LivestockDetailComponent implements OnInit {

    private breedValueData: any[];
    private breedValueConfig: GoogleChartConfigModel;
    private breedValueElementId: string;

    private weightData: any[];
    private weightConfig: GoogleChartConfigModel;
    private weightElementId: string;

  // ANIMAL DETAILS
  private form: FormGroup;
  private animal: Animal = new Animal();
  private temp_animal: Animal;
  private country_code_list = [];
  private collar_color_list = [];
  private tags = [];
  private view_date_format: string;
  private model_datetime_format: string;
  private livestock_gender_options = LIVESTOCK_GENDER_OPTIONS;
  private livestock_breed_options = LIVESTOCK_BREED_OPTIONS;
  private edit_mode = false;
  private gender_edit_mode = false;
  private changeEnabled = false;
  private changed_animal_info = false;
  private changed_animal_info_error = false;
  private gender_changed_animal_info_error = false;
  private in_progress = false;
  private sub: any;
  private error_message = 'AN ERROR OCCURRED WHILE SAVING';
  private gender_change_error = '';
  private measurementDates: string[] = [];
  private measurementWeights: number[] = [];
  private logs: DeclareLog[] = [];
  private breedValues: BreedValues[] = [];
  // EXTERIOR MEASUREMENTS
  private exteriorForm: FormGroup;
  private isValidExteriorForm = true;
  private isRequestingExterior = false;
  private hasServerError = false;

  private isExteriorEditMode = false;
  private inspectors: User[] = [];
  private kinds: string[] = [];
  private selectedExterior: Exterior = new Exterior();
  private isAdmin = false;
  private tempExterior: Exterior = new Exterior();
  private displayExteriorModal = 'none';
  private selectedExteriorDate = '';

  private invalidMeasurementDate = false;
  private model_date_format: string;

  constructor(private route: ActivatedRoute,
              private router: Router,
              private apiService: NSFOService,
              private settings: SettingsService,
              private fb: FormBuilder,
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


  }

  ngOnInit() {
    this.breedValueElementId = 'breed-value';
    this.weightElementId = 'weight-chart';
    this.getCountryCodeList();
    this.getCollarColorList();
    this.getEartagsList();
    this.getAnimalDetails();

      this.breedValueConfig = new GoogleChartConfigModel({ title: 'Fokwaarden',
          animation: {
          duration: 1000,
          easing: 'out'},
          bar: {
                  groupWidth: '75%'
              },
          legend: {position: 'none'},
          hAxis: {
              viewWindow: {
                  min: 60,
                  max: 140
              },
          }
      });
      this.weightConfig = new GoogleChartConfigModel({
          title: 'Gewichten',
      });
  }

  private genderType(gender: string): string {
    const gender_type = {
      'FEMALE': 'EWE',
      'MALE': 'RAM',
      'NEUTER': 'NEUTER'
    };

    return gender_type[gender];
  }

  private getCountryCodeList() {
    this.apiService
      .doGetRequest(API_URI_GET_COUNTRY_CODES)
      .subscribe(
          (res: JsonResponseModel) => {
          this.country_code_list = _.sortBy(res.result, ['code']);
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  private getCollarColorList() {
    this.apiService
      .doGetRequest(API_URI_GET_COLLAR_COLORS)
      .subscribe(
          (res: JsonResponseModel) => {
          this.collar_color_list = res.result;
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  private getEartagsList() {
    this.apiService
      .doGetRequest(API_URI_GET_EARTAGS)
      .subscribe((res: JsonResponseModel) => {
          this.tags = res.result;
          for (const tag of this.tags) {
            tag.uln = tag.uln_country_code + tag.uln_number;
            tag.ulnLastFive = tag.uln_number.substr(tag.uln_number.length - 5);
          }
          this.tags = _.orderBy(this.tags, ['ulnLastFive']);
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        });
  }

  private getAnimalDetails() {
    this.route.params
      .subscribe(params => {
        this.apiService
          .doGetRequest(API_URI_GET_ANIMAL_DETAILS + '/' + params.uln)
          .subscribe((res: JsonResponseModel) => {
              this.animal = res.result;
              this.animal.uln = this.animal.uln_country_code + this.animal.uln_number;
              this.animal.date_of_birth = moment(this.animal.date_of_birth).format(this.settings.getViewDateFormat());
              this.form.get('date_of_birth').setValue(this.animal.date_of_birth);

              if (!(!!this.animal.pedigree_country_code && !!this.animal.pedigree_number)) {
                this.form.get('pedigree_country_code').setValue('NL');
              }

              // EXTERIORS
              if (this.animal.exteriors.length > 0) {
                this.selectedExterior = this.animal.exteriors[0];
                this.selectedExteriorDate = this.animal.exteriors[0].measurement_date;
              }

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

              this.animal.exteriors.forEach((item) => {
                if (!item.hasOwnProperty('inspector')) {
                  item.inspector = new Inspector();
                }
              });


              if (this.animal.weights.length === 1) {
                this.measurementDates.push(moment().format(this.settings.getViewDateFormat()));
                this.measurementWeights.push(null);
              }

              // TODO BREED VALUES CHART DATA

              // LOGS
              if (this.animal.declare_log.length > 0) {
                this.logs = this.animal.declare_log;
              }


              this.changeEnabled = true;
              this.temp_animal = _.clone(this.animal);

              this.initBreedingValueChart();
              this.initWeightChart();

              // this.getExteriorKinds();
              // this.getInspectors();

              this.breedValueData = [
                  ['Year', 'Fokwaarde',  {role: 'annotation'}, {role: 'tooltip'}, {role: 'style'}],
              ];

              this.animal.breed_values.forEach((breedValue) => {
                  if (breedValue.has_data) {
                      this.breedValues.push(breedValue);
                      const value = breedValue.normalized_value;
                      this.breedValueData.push(
                          [
                              '',
                              value,
                              value.toString(),
                              breedValue.chart_label + ' ' + breedValue.value.toString() + ' / ' + breedValue.accuracy.toString() + '%',
                              'color: ' + breedValue.chart_color + ';'
                          ]
                      );
                  }
              });
              this.weightData = [['Year', 'Weight']];
              this.animal.weights.forEach((weight) => {
                  const date = moment(weight.measurement_date).format('DD-MM-YYYY');
                 this.weightData.push([date, weight.weight]);
              });
            },
            error => {
              alert(this.apiService.getErrorMessage(error));
            }
          );
      });
  }

  private sendGenderChangeRequest() {
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
          const body = JSON.parse(err._body);
          this.gender_change_error = body.result.message;
          this.animal.gender = this.temp_animal.gender;
        }
      );
  }

  private sendChangeRequest() {
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

  private generateLineageProof(fileType: string) {
    this.downloadService.doLineageProofPostRequest([this.animal], fileType);
  }


  private selectTag(tag) {
    this.animal.uln = tag.uln;
    this.animal.uln_country_code = tag.uln_country_code;
    this.animal.uln_number = tag.uln_number;
    this.animal.work_number = tag.ulnLastFive;
  }

  private initBreedingValueChart() {
    // TODO replace with new google chart version
  }

  private initWeightChart() {
    // TODO replace with new google chart version
  }


  private toggleGenderEditMode() {
    this.gender_edit_mode = !this.gender_edit_mode;

    if (!this.gender_edit_mode) {
      this.animal = _.clone(this.temp_animal);
    }
  }

  private toggleEditMode() {
    this.edit_mode = !this.edit_mode;

    if (!this.edit_mode) {

      this.animal = _.clone(this.temp_animal);

    }
  }

  private goBack() {
    this.router.navigate(['/main/livestock/overview']);
  }

  private stringAsViewDate(date) {
    return moment(date).format(this.settings.getViewDateFormat());
  }

  private stringAsViewDateTime(date) {
    return moment(date).format(this.settings.getViewDateTimeFormat());
  }

  private stringAsModelDate(date) {
    return moment(date).format(this.settings.getModelDateFormat());
  }
}
