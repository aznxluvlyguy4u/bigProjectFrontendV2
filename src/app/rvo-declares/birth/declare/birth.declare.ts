import * as _ from 'lodash';
import moment = require('moment');
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

import {BirthDeclareRowComponent} from './birth.declare.row';
import {Datepicker} from '../../../shared/components/datepicker/datepicker.component';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Constants} from '../../../shared/variables/constants';
import {Settings} from '../../../shared/variables/settings';
import {API_URI_DECLARE_BIRTH, API_URI_GET_COUNTRY_CODES, API_URI_GET_EARTAGS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {DateValidator, LitterValidator} from '../../../shared/validation/nsfo-validation';
import {SelectorComponent} from '../../../shared/components/selector/selector.component';
import {UtilsService} from '../../../shared/services/utils/utils.services';
import {DeclareManagerService} from '../../../shared/services/declaremanager/declare-manager.service';
import {Subscription} from 'rxjs';
import {CountryCode} from '../../../shared/models/country.model';
import {Animal, LivestockAnimal} from '../../../shared/models/animal.model';
import {EarTag} from '../../../shared/models/rvo-declare.model';
import {User} from '../../../shared/models/person.model';

@Component({
  directives: [Datepicker, BirthDeclareRowComponent, SelectorComponent],
  templateUrl: './birth.declare.html',
  
})

export class BirthDeclareComponent implements OnInit, OnDestroy {

  private birth_list: any = [];
  private country_code_list = <CountryCode[]>[];
  private children_list: any = [];
  private suggestedCandidateFathers = <LivestockAnimal[]>[];
  private otherCandidateFathers = <LivestockAnimal[]>[];
  private suggestedCandidateMothers = <LivestockAnimal[]>[];
  private otherCandidateMothers = <LivestockAnimal[]>[];

  private candidateSurrogates = <LivestockAnimal[]>[];
  private selectedTags: Array<EarTag> = [];
  private filteredTags: Array<EarTag> = [];
  private tags: Array<EarTag> = [];

  private isValidForm = true;
  private isValidFormChildren = true;
  private isSending = false;
  private isChildListOn = false;

  private selectedMother: Animal;
  private selectedFather: Animal;
  private birth_progress_types = BIRTH_PROGRESS_TYPES;
  private view_date_format;
  private model_datetime_format;
  private errorMessage = '';
  private errorData = '';

  private form: FormGroup;
  private litter: FormGroup;

  private formChildren: FormGroup;

  private user: User = new User();

  private candidateFathersRequest = new CandidateFathersRequest();
  private candidateMothersRequest = new CandidateMothersRequest();
  private candidateSurrogatesRequest = new CandidateSurrogatesRequest();

  private datepickerActive = false;

  private isLoadingCandidateSurrogates = false;
  private isLoadingCandidateMothers = false;
  private isLoadingCandidateFathers = false;

  private declareBirthResultSubscription: Subscription;

  constructor(private fb: FormBuilder,
              private constants: Constants,
              private apiService: NSFOService,
              private settings: Settings,
              private declareManagerService: DeclareManagerService,
              private utils: UtilsService) {
    this.selectedMother = new Animal();
    this.view_date_format = settings.VIEW_DATE_FORMAT;
    this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;

    this.litter = new FormGroup({
      litter_size: new FormControl('', Validators.required),
      litter_alive: new FormControl('', Validators.required)
    });
    this.litter.validator = Validators.compose([Validators.required, LitterValidator.validateLitterSizeNotGreaterThenAlive]);


    this.form = fb.group({
      uid_type_mother: new FormControl(constants.ULN),
      // uid_country_code_mother: new FormControl('NL', Validators.compose([Validators.required])),
      uid_number_mother: new FormControl('', Validators.compose([Validators.required])),
      // uid_type_father: new FormControl(constants.ULN),
      // uid_country_code_father: new FormControl('NL'),
      uid_number_father: new FormControl(''),
      date_of_birth: new FormControl('', Validators.compose([DateValidator.validateDateFormat, DateValidator.validateDateIsNotInTheFuture])),
      aborted: new FormControl(constants.NO),
      pseudopregnancy: new FormControl(constants.NO),
      litter: this.litter
    });

    this.formChildren = fb.group({});


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
          this.litter.get('litter_size').validator = null;
          this.litter.get('litter_alive').validator = null;
        }
        if (!this.isAborted() && !this.isPseudoPregnancy()) {
          this.litter.validator = Validators.compose([
            Validators.required,
            LitterValidator.validateLitterSizeNotGreaterThenAlive,
            LitterValidator.validateLitterSizeNotGreaterThenSeven
          ]);
          this.litter.get('litter_size').validator = Validators.required;
          this.litter.get('litter_alive').validator = Validators.required;
        }

      } else {

        if (this.isAborted() || this.isPseudoPregnancy()) {
          this.litter.validator = Validators.compose([LitterValidator.validateLitterSizeNotGreaterThenAlive]);
          this.litter.get('litter_size').validator = null;
          this.litter.get('litter_alive').validator = null;
        }
        if (!this.isAborted() && !this.isPseudoPregnancy()) {
          this.litter.validator = Validators.compose([Validators.required, LitterValidator.validateLitterSizeNotGreaterThenAlive]);
          this.litter.get('litter_size').validator = Validators.required;
          this.litter.get('litter_alive').validator = Validators.required;
        }
      }


    });

    this.form.get('uid_number_mother').valueChanges.subscribe(() => {
      this.litter.updateValueAndValidity();
    });

    this.form.get('aborted').valueChanges.subscribe(() => {
      this.litter.get('litter_size').setValue('');
      this.litter.get('litter_size').setErrors(null);

      this.litter.get('litter_alive').setValue('');
      this.litter.get('litter_alive').setErrors(null);
    });
    this.form.get('pseudopregnancy').valueChanges.subscribe(() => {
      this.litter.get('litter_size').setValue('');
      this.litter.get('litter_size').setErrors(null);

      this.litter.get('litter_alive').setValue('');
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
    if (this.form.get('aborted').value === this.constants.YES) {
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
          res => {
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
            // let error = err.json();
            // this.errorMessage = error.result.message;
            // this.openModal();
            this.isLoadingCandidateMothers = false;
            reject(err);
          }
        );
    });
  }

  private getUser() {
    this.utils.getUserInfo()
      .subscribe(res => this.user = res);
  }

  private getCountryCodeList() {
    this.apiService
      .doGetRequest(API_URI_GET_COUNTRY_CODES)
      .subscribe(
        res => {
          this.country_code_list = <CountryCode[]> _.sortBy(res.result, ['code']);
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        }
      );
  }

  private getCandidateFathers() {

    this.isLoadingCandidateFathers = true;

    this.candidateFathersRequest.date_of_birth = moment(this.form.get('date_of_birth').value).format(this.settings.MODEL_DATETIME_FORMAT);

    if (!this.selectedMother.uln) {
      return;
    }

    this.apiService
      .doPostRequest(API_URI_DECLARE_BIRTH + '/' + this.selectedMother.uln + '/candidate-fathers', this.candidateFathersRequest)
      .subscribe(
        res => {

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
          // let error = err.json();
          // this.errorMessage = error.result.message;
          // this.openModal();
          this.isLoadingCandidateFathers = false;
        }
      );
  }

  private getCandidateSurrogates() {

    if (!this.selectedMother.uln) {
      return;
    }

    this.candidateSurrogatesRequest.date_of_birth = moment(this.form.get('date_of_birth').value)
      .format(this.settings.MODEL_DATETIME_FORMAT);

    this.isLoadingCandidateSurrogates = true;
    const uri = API_URI_DECLARE_BIRTH + '/' + this.selectedMother.uln + '/candidate-surrogates';
    this.apiService.doPostRequest(uri, this.candidateSurrogatesRequest)
      .subscribe(
        res => {
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

  private getEartagsList() {
    this.apiService
      .doGetRequest(API_URI_GET_EARTAGS)
      .subscribe(
        res => {
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

  private createChildList() {

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

  private destroyChildList() {
    this.isChildListOn = false;
    this.birth_list = [];
    this.children_list = [];
    this.selectedTags = [];
    this.filteredTags = _.cloneDeep(this.tags);
    this.formChildren = this.fb.group({});
  }

  private getChildData(event: Event) {
    const index = event['index'];
    this.children_list[index] = event['animal'];
  }

  private declareBirth() {

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

  private resetForms() {

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


  private removeUsedCandidateMother(usedMother: LivestockAnimal) {
    this.suggestedCandidateMothers = this.suggestedCandidateMothers.filter(mother => (
      mother.uln_country_code + mother.uln_number
    ).indexOf(usedMother.uln_country_code + usedMother.uln_number) !== -1);
  }


  private updateValidationSetsAndInputImmediatelyAfterDeclareBirth() {
    this.destroyChildList();
    this.resetForms();

    this.suggestedCandidateFathers = [];

    this.isSending = false;
  }

  private updateValidationSetsAfterSuccessResponse() {
    this.getEartagsList();
  }

  private updateValidationSetsAfterFailureResponse() {
    this.getEartagsList();
  }


  private selectMother(mother: Animal, mateSelector: any) {

    // check if the selectedMother has mates
    // If there is only one
    // fill in the father field with the given mate
    // If there are more possible mates then show a button next to the father field to indicate how many there were found.
    // Clicking on this button will show a modal from where the user can select one of the possible mates.
    // If the mate is not in this list the user can still fill in the uln of the father by hand


    // if the mother is a pedigree animal
    // make the pedigree_number field for the child required

    this.selectedMother = mother;
    this.getCandidateSurrogates();
    this.getCandidateFathers();

    this.litter.validator = LitterValidator.validateLitterSizeNotGreaterThenSeven;
    // this.form.get('uln_surrogate').validator = Validators.required;
    // this.form.get('uln_surrogate').setValue('');

    // if (this.selectedMother.pedigree_number) {
    // TODO refer to the correct fields
    // for (let pedigree of this.user.pedigrees) {
    //
    //     if (pedigree === this.selectedMother.pedigree) {
    //          this.form.get('uid_number_father').validator = Validators.required;
    //          this.form.get('uid_number_father').setValueAndValidity();
    //     }
    //
    // }
    // this.form.get('uid_number_father').validator = Validators.required;
    // this.form.get('uid_number_father').setValueAndValidity();
    // }

    this.form.get('uid_number_mother').setValue(mother.uln);
    // if(this.selectedMother.mates) {
    //     if(this.selectedMother.mates.length === 1) {
    //         let mateUln = this.selectedMother.mates[0].uln_country_code + this.selectedMother.mates[0].uln_number;
    //         this.form.get('uid_type_father').setValue(constants.ULN);
    //         this.form.get('uid_number_father').setValue(mateUln);
    //     } else if (this.selectedMother.mates.length > 1) {
    //         mateSelector.openModal()
    //     }
    // }
  }

  private selectFather(father: Animal) {
    this.selectedFather = father;
    const mateUln = this.selectedFather.uln_country_code + this.selectedFather.uln_number;
    this.form.get('uid_number_father').setValue(mateUln);
  }

  private addToSelection(event: Event) {
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
