import * as _ from 'lodash';
import * as moment from 'moment';
import {Component, OnDestroy, OnInit} from '@angular/core';
import {
  BIRTH_PROGRESS_TYPES,
  BirthRequest,
  CandidateFathersRequest,
  CandidateMothersRequest,
  CandidateSurrogatesRequest,
  Child,
  ParentByUln,
  StillBorn
} from '../birth.model';
import {FormGroup, FormBuilder, Validators, FormControl} from '@angular/forms';

import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Constants} from '../../../shared/variables/constants';
import {Settings} from '../../../shared/variables/settings';
import {API_URI_DECLARE_BIRTH, API_URI_GET_COUNTRY_CODES, API_URI_GET_EARTAGS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {DateValidator, LitterValidator} from '../../../shared/validation/nsfo-validation';
import {UtilsService} from '../../../shared/services/utils/utils.services';
import {DeclareManagerService} from '../../../shared/services/declaremanager/declare-manager.service';
import {Subscription} from 'rxjs';
import {CountryCode} from '../../../shared/models/country.model';
import {Animal, LivestockAnimal} from '../../../shared/models/animal.model';
import {EarTag} from '../../../shared/models/rvo-declare.model';
import {User} from '../../../shared/models/person.model';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

@Component({
  templateUrl: './birth.declare.html',
})

export class BirthDeclareComponent implements OnInit, OnDestroy {

  public birth_list: any = [];
  public country_code_list = <CountryCode[]>[];
  public children_list: any = [];
  public suggestedCandidateFathers = <LivestockAnimal[]>[];
  public otherCandidateFathers = <LivestockAnimal[]>[];
  public suggestedCandidateMothers = <LivestockAnimal[]>[];
  public otherCandidateMothers = <LivestockAnimal[]>[];

  public candidateSurrogates = <LivestockAnimal[]>[];
  public selectedTags: Array<EarTag> = [];
  public filteredTags: Array<EarTag> = [];
  public tags: Array<EarTag> = [];

  public isValidForm = true;
  public isValidFormChildren = true;
  public isSending = false;
  public isChildListOn = false;

  public selectedMother: Animal;
  public selectedFather: Animal;
  public birth_progress_types = BIRTH_PROGRESS_TYPES;
  public view_date_format;
  public model_datetime_format;
  public errorMessage = '';
  public errorData = '';

  public form: FormGroup;
  public litter: FormGroup;

  public formChildren: FormGroup;

  public user: User = new User();

  public candidateFathersRequest = new CandidateFathersRequest();
  public candidateMothersRequest = new CandidateMothersRequest();
  public candidateSurrogatesRequest = new CandidateSurrogatesRequest();

  public datepickerActive = false;

  public isLoadingCandidateSurrogates = false;
  public isLoadingCandidateMothers = false;
  public isLoadingCandidateFathers = false;

  public declareBirthResultSubscription: Subscription;

  public litterSizeInput: any = 0;
  public PseudoPregnancySelect: any = undefined;
  public abortedSelect: any = undefined;

  constructor(private fb: FormBuilder,
              public constants: Constants,
              private apiService: NSFOService,
              private settings: Settings,
              private declareManagerService: DeclareManagerService,
              private utils: UtilsService) {
    this.selectedMother = new Animal();
    this.view_date_format = settings.VIEW_DATE_FORMAT;
    this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;

    this.litter = new FormGroup({
      litter_size: new FormControl('0', Validators.required),
      litter_alive: new FormControl('0', Validators.required)
    });
    this.litter.validator = Validators.compose([Validators.required, LitterValidator.validateLitterSizeNotGreaterThenAlive]);


    this.form = new FormGroup({
      uid_type_mother: new FormControl(constants.ULN),
      // uid_country_code_mother: new FormControl('NL', Validators.compose([Validators.required])),
      uid_number_mother: new FormControl('', Validators.compose([Validators.required])),
      // uid_type_father: new FormControl(constants.ULN),
      // uid_country_code_father: new FormControl('NL'),
      uid_number_father: new FormControl(''),
      date_of_birth: new FormControl('',
        Validators.compose([DateValidator.validateDateFormat, DateValidator.validateDateIsNotInTheFuture])),
      aborted: new FormControl(constants.NO),
      pseudopregnancy: new FormControl(constants.NO),
      litter: this.litter
    });

    this.formChildren = new FormGroup({});
  }

  ngOnInit() {
    this.getUser();
    this.getCountryCodeList();
    this.getEartagsList();

    this.declareBirthResultSubscription = this.declareManagerService.declareBirthResultChanged
      .subscribe(
        result => {
          if (result) {
            this.updateValidationSetsAfterSuccessResponse();
          } else {
            this.updateValidationSetsAfterFailureResponse();
          }
        }
      );
    this.form.valueChanges.subscribe((value) => {
      if (this.isMotherSelected()) {
        if (this.isAborted() || this.isPseudoPregnancy()) {
          this.litter.validator = Validators.compose([
              LitterValidator.validateLitterSizeNotGreaterThenAlive,
              LitterValidator.validateLitterSizeNotGreaterThenSeven
            ]);
          if (this.isAborted()) {
            this.form.get('pseudopregnancy').disable({onlySelf: true, emitEvent: false});
          }
          if (this.isPseudoPregnancy()) {
            this.form.get('aborted').disable({onlySelf: true, emitEvent: false});
          }
          this.litter.get('litter_size').disable({onlySelf: true, emitEvent: false});
          this.litter.get('litter_alive').disable({onlySelf: true, emitEvent: false});
          this.litter.get('litter_size').validator = null;
          this.litter.get('litter_alive').validator = null;
        }
        if (!this.isAborted() && !this.isPseudoPregnancy()) {
          this.litter.validator = Validators.compose([
            Validators.required,
            LitterValidator.validateLitterSizeNotGreaterThenAlive,
            LitterValidator.validateLitterSizeNotGreaterThenSeven
          ]);
          this.form.get('pseudopregnancy').enable({onlySelf: true, emitEvent: false});
          this.form.get('aborted').enable({onlySelf: true, emitEvent: false});
          this.litter.get('litter_size').enable({onlySelf: true, emitEvent: false});
          this.litter.get('litter_alive').enable({onlySelf: true, emitEvent: false});
          this.litter.get('litter_size').validator = Validators.required;
          this.litter.get('litter_alive').validator = Validators.required;
          if (this.litter.get('litter_size').value > 0) {
            this.form.get('pseudopregnancy').disable({onlySelf: true, emitEvent: false});
            this.form.get('aborted').disable({onlySelf: true, emitEvent: false});
          }
          if (this.litter.get('litter_size').value <= 0) {
            this.form.get('pseudopregnancy').enable({onlySelf: true, emitEvent: false});
            this.form.get('aborted').enable({onlySelf: true, emitEvent: false});
          }
        }
      } else {
        if (this.isAborted() || this.isPseudoPregnancy()) {
          this.litter.validator = Validators.compose([LitterValidator.validateLitterSizeNotGreaterThenAlive]);
          if (this.isAborted()) {
            this.form.get('pseudopregnancy').disable({onlySelf: true, emitEvent: false});
          }
          if (this.isPseudoPregnancy()) {
            this.form.get('aborted').disable({onlySelf: true, emitEvent: false});
          }
          this.litter.get('litter_size').disable({onlySelf: true, emitEvent: false});
          this.litter.get('litter_alive').disable({onlySelf: true, emitEvent: false});
          this.litter.get('litter_size').validator = null;
          this.litter.get('litter_alive').validator = null;
        }
        if (!this.isAborted() && !this.isPseudoPregnancy()) {
          this.litter.validator = Validators.compose([Validators.required, LitterValidator.validateLitterSizeNotGreaterThenAlive]);
          this.form.get('pseudopregnancy').enable({onlySelf: true, emitEvent: false});
          this.form.get('aborted').enable({onlySelf: true, emitEvent: false});
          this.litter.get('litter_size').enable({onlySelf: true, emitEvent: false});
          this.litter.get('litter_alive').enable({onlySelf: true, emitEvent: false});
          this.litter.get('litter_size').validator = Validators.required;
          this.litter.get('litter_alive').validator = Validators.required;
          if (this.litter.get('litter_size').value > 0) {
            this.form.get('pseudopregnancy').disable({onlySelf: true, emitEvent: false});
            this.form.get('aborted').disable({onlySelf: true, emitEvent: false});
          }
          if (this.litter.get('litter_size').value <= 0) {
            this.form.get('pseudopregnancy').enable({onlySelf: true, emitEvent: false});
            this.form.get('aborted').enable({onlySelf: true, emitEvent: false});
          }
        }
      }


    });

    this.form.get('uid_number_mother').valueChanges.subscribe(() => {
      this.litter.get('litter_size').setValue('0');
      this.litter.get('litter_size').setErrors(null);

      this.litter.get('litter_alive').setValue('0');
      this.litter.get('litter_alive').setErrors(null);
    });

    this.form.get('aborted').valueChanges.subscribe(() => {
      this.litter.get('litter_size').setValue('0');
      this.litter.get('litter_size').setErrors(null);

      this.litter.get('litter_alive').setValue('0');
      this.litter.get('litter_alive').setErrors(null);
    });

    this.form.get('pseudopregnancy').valueChanges.subscribe(() => {
      this.litter.get('litter_size').setValue('0');
      this.litter.get('litter_size').setErrors(null);

      this.litter.get('litter_alive').setValue('0');
      this.litter.get('litter_alive').setErrors(null);
    });


  }

  ngOnDestroy() {
    this.declareBirthResultSubscription.unsubscribe();
  }

  preventKeyPress(event) {
    event.cancelBubble = true;
    event.preventDefault();
    return false;
  }

  isMotherSelected() {
    if (this.form.get('uid_number_mother').value !== '') {
      return true;
    }
    return false;
  }

  isAborted() {
    if (this.form.get('aborted').value === this.constants.YES) {
      return true;
    }
    return false;
  }

  isPseudoPregnancy() {
    if (this.form.get('pseudopregnancy').value === this.constants.YES) {
      return true;
    }
    return false;
  }

  getCandidateMothers() {

    this.candidateMothersRequest.date_of_birth = moment(this.form.get('date_of_birth').value).format(this.settings.MODEL_DATETIME_FORMAT);

    if (!this.candidateMothersRequest.date_of_birth) {
      return;
    }

    this.isLoadingCandidateMothers = true;

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

  public getUser() {
    this.utils.getUserInfo()
      .subscribe(res => this.user = res);
  }

  public getCountryCodeList() {
    this.apiService
      .doGetRequest(API_URI_GET_COUNTRY_CODES)
      .subscribe(
          (res: JsonResponseModel) => {
          this.country_code_list = <CountryCode[]> _.sortBy(res.result, ['code']);
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  public getCandidateFathers() {

    this.isLoadingCandidateFathers = true;

    this.candidateFathersRequest.date_of_birth = moment(this.form.get('date_of_birth').value).format(this.settings.MODEL_DATETIME_FORMAT);

    if (!this.selectedMother.uln) {
      return;
    }

    this.apiService
      .doPostRequest(API_URI_DECLARE_BIRTH + '/' + this.selectedMother.uln + '/candidate-fathers', this.candidateFathersRequest)
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
          // this.suggestedCandidateFathers = _.orderBy(this.suggestedCandidateFathers, ['ulnLastFive'], ['asc']);

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

  public getCandidateSurrogates() {

    if (!this.selectedMother.uln) {
      return;
    }

    this.candidateSurrogatesRequest.date_of_birth = moment(this.form.get('date_of_birth').value)
      .format(this.settings.MODEL_DATETIME_FORMAT);

    this.isLoadingCandidateSurrogates = true;
    const uri = API_URI_DECLARE_BIRTH + '/' + this.selectedMother.uln + '/candidate-surrogates';
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

          // for(let animal of otherSurrogates) {
          //     if(animal.uln_country_code && animal.uln_number) {
          //         animal.uln = animal.uln_country_code + animal.uln_number;
          //         animal.ulnLastFive = animal.uln_number.substr(animal.uln_number.length - 5);
          //     }
          //     if(animal.pedigree_country_code && animal.pedigree_number) {
          //         animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
          //     }
          // }

          // this.candidateSurrogates = _.orderBy(candidateSurrogates, ['ulnLastFive'], ['asc']);
          this.candidateSurrogates = candidateSurrogates;
          // this.candidateSurrogates = candidateSurrogates.concat(otherSurrogates);
          this.isLoadingCandidateSurrogates = false;
        }
      );
  }

  public getEartagsList() {
    this.apiService
      .doGetRequest(API_URI_GET_EARTAGS)
      .subscribe(
          (res: JsonResponseModel) => {
          this.tags = res.result;
          for (const tag of this.tags) {
            tag.uln = tag.uln_country_code + tag.uln_number;
            tag.ulnLastFive = tag.uln_number.substr(tag.uln_number.length - 5);
          }

          this.tags = _.orderBy(this.tags, ['ulnLastFive']);
          this.filteredTags = _.cloneDeep(this.tags);
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  public createChildList() {

    this.form.get('uid_number_mother').markAsTouched();
    this.litter.get('litter_size').markAsTouched();
    this.litter.get('litter_alive').markAsTouched();

    if (this.form.valid && this.litter.valid && this.litter.get('litter_size').value > 0) {

      this.isValidForm = true;
      this.isChildListOn = true;

      this.birth_list = [];
      const amount_alive = this.litter.get('litter_alive').value;
      const amount_dead = this.litter.get('litter_size').value - amount_alive;

      // create entry forms for the alive animals
      if (amount_alive > 0) {
        for (let i = 0; i < amount_alive; i++) {
          const child = new Child();
          child.is_alive = true;
          child.uln_country_code = 'NL';
          child.uln_number = '';
          child.nurture_type = 'NONE';
          child.gender = '';
          child.birth_progress = '';
          child.birth_weight = 0;
          child.tail_length = 0;
          this.birth_list.push(child);
        }
      }

      // create entry forms for the dead animals
      if (amount_dead > 0) {
        for (let i = 0; i < amount_dead; i++) {
          const stillborn = new StillBorn();
          stillborn.is_alive = false;
          stillborn.gender = '';
          stillborn.birth_progress = '';
          stillborn.birth_weight = 0;
          stillborn.tail_length = 0;
          this.birth_list.push(stillborn);
        }
      }
    } else {
      this.isValidForm = false;
    }
  }

  public destroyChildList() {
    this.isChildListOn = false;
    this.birth_list = [];
    this.children_list = [];
    this.selectedTags = [];
    this.filteredTags = _.cloneDeep(this.tags);
    this.formChildren = this.fb.group({});
  }

  public getChildData(event: Event) {
    const index = event['index'];
    this.children_list[index] = event['animal'];
  }

  public declareBirth() {

    this.form.get('uid_number_mother').markAsTouched();
    this.litter.get('litter_size').markAsTouched();
    this.litter.get('litter_alive').markAsTouched();

    const litter_size = this.litter.get('litter_size').value;
    const amount_alive = this.litter.get('litter_alive').value;
    const amount_dead = this.litter.get('litter_size').value - amount_alive;

    // console.log('-------------------------------------------')
    // console.log(this.form.valid);
    // console.log(this.form)
    // console.log(this.formChildren.valid);
    // console.log(this.formChildren)
    // console.log('-------------------------------------------')

    if (this.form.valid && this.formChildren.valid) {
      this.isValidFormChildren = true;
      this.isSending = true;

      const birth = new BirthRequest();
      birth.date_of_birth = this.form.get('date_of_birth').value;
      birth.is_aborted = (this.form.get('aborted').value === 'YES');
      birth.is_pseudo_pregnancy = (this.form.get('pseudopregnancy').value === 'YES');

      birth.mother = new ParentByUln();
      birth.mother.uln_country_code = this.selectedMother.uln_country_code;
      birth.mother.uln_number = this.selectedMother.uln_number;

      // it's not aborted or pseudo pregnancy so we need the fater as well.
      if (!birth.is_aborted && !birth.is_pseudo_pregnancy) {
        // if(this.form.get('uid_number_father').value !== '') {
        //     birth.father = new ParentByUln();
        //     birth.father.pedigree_country_code = this.form.get('uid_country_code_father').value;
        //     birth.father.pedigree_number = this.form.get('uid_number_father').value;
        // }

        if (this.form.get('uid_number_father').value !== '') {
          birth.father = new ParentByUln();
          birth.father.uln_country_code = this.selectedFather.uln_country_code;
          birth.father.uln_number = this.selectedFather.uln_number;
        }
      }

      if (this.form.get('uid_number_father').value === '') {
        delete birth.father;
      }

      birth.litter_size = litter_size;
      birth.stillborn_count = amount_dead;
      birth.children = this.children_list;

      birth.children.forEach((child) => {
        if (!child.tail_length) {
          child.tail_length = 0;
        }
        if (!child.birth_weight) {
          child.birth_weight = 0;
        }
      });

      this.removeUsedCandidateMother(birth.mother);

      this.declareManagerService.doDeclareBirth(birth);

      this.updateValidationSetsAndInputImmediatelyAfterDeclareBirth();

    } else {
      this.isValidFormChildren = false;
    }
  }

  public resetForms() {

    this.selectedMother = new Animal();
    this.form.get('uid_number_mother').setValue('');
    this.form.get('uid_number_mother').setErrors(null);
    this.litter.get('litter_size').setValue('');
    this.litter.get('litter_size').setErrors(null);
    this.litter.get('litter_alive').setValue('');
    this.litter.get('litter_alive').setErrors(null);
    this.form.get('aborted').setValue('NO');
    this.form.get('aborted').setErrors(null);
    this.form.get('pseudopregnancy').setValue('NO');
    this.form.get('pseudopregnancy').setErrors(null);
    // this.form.get('uid_type_father').setValue('ULN');
    // this.form.get('uid_type_father').setErrors(null);
    // this.form.get('uid_country_code_father').setValue('NL');
    // this.form.get('uid_country_code_father').setErrors(null);
    this.form.get('uid_number_father').setValue('');
    this.form.get('uid_number_father').setErrors(null);
  }


  public removeUsedCandidateMother(usedMother: LivestockAnimal) {
    this.suggestedCandidateMothers = this.suggestedCandidateMothers.filter(mother => (
      mother.uln_country_code + mother.uln_number
    ).indexOf(usedMother.uln_country_code + usedMother.uln_number) !== -1);
  }


  public updateValidationSetsAndInputImmediatelyAfterDeclareBirth() {
    this.destroyChildList();
    this.resetForms();

    this.suggestedCandidateFathers = [];

    this.isSending = false;
  }

  public updateValidationSetsAfterSuccessResponse() {
    this.getEartagsList();
  }

  public updateValidationSetsAfterFailureResponse() {
    this.getEartagsList();
  }


  public selectMother(mother: Animal) {
    this.selectedMother = mother;
    this.getCandidateSurrogates();
    this.getCandidateFathers();

    this.litter.validator = LitterValidator.validateLitterSizeNotGreaterThenSeven;

    this.form.get('uid_number_mother').setValue(mother.uln);
  }

  public selectFather(father: Animal) {
    this.selectedFather = father;
    const mateUln = this.selectedFather.uln_country_code + this.selectedFather.uln_number;
    this.form.get('uid_number_father').setValue(mateUln);
  }

  public addToSelection(event: Event) {
    const index = event[0];
    const tag = event[1];
    this.selectedTags[index] = tag;

    this.filteredTags = _.cloneDeep(this.tags);

    for (const selectedTag of this.selectedTags) {
      const foundTag = _.find(this.filteredTags, selectedTag);
      _.remove(this.filteredTags, foundTag);
    }
  }

}
