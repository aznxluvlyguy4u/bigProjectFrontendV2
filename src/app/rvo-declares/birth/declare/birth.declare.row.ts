import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';
import {BIRTH_PROGRESS_TYPES, LAMBAR_SURROGATE_OPTIONS, SurrogateMotherByUln} from '../birth.model';
import {Constants} from '../../../shared/variables/constants';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {TailValidator, WeightValidator} from '../../../shared/validation/nsfo-validation';
import {FormControl, FormGroup, Validators} from '@angular/forms';
import {CountryCode} from '../../../shared/models/country.model';
import {EarTag} from '../../../shared/models/rvo-declare.model';
import {Animal, LivestockAnimal} from '../../../shared/models/animal.model';

@Component({
  selector: '[app-birth-declare-row]',
  templateUrl: './birth.declare.row.html',
})

export class BirthDeclareRowComponent implements OnInit {
  @Input() country_code_list = <CountryCode[]> [];
  @Input() candidateSurrogates: Array<LivestockAnimal> = [];
  @Input() tags: Array<EarTag> = [];
  @Input() animal: Animal;
  @Input() index: number;
  @Input() parent_form: any;
  @Input() form_valid: boolean;
  @Input() isDisabled: boolean;
  @Output() birthRowEvent = new EventEmitter();
  @Output() selectedTag = new EventEmitter();
  private form: FormGroup;
  private ulnSurrogateEnabled = false;
  private birth_progress_types = BIRTH_PROGRESS_TYPES;
  private options_lambar_surrogate = LAMBAR_SURROGATE_OPTIONS;

  constructor(private constants: Constants,
              private apiService: NSFOService) {
    this.form = new FormGroup({

      birth_progress: new FormControl(''),
      tail_length: new FormControl('0'),
      lambar: new FormControl(''),
      uln_surrogate: new FormControl('')
    });

    this.form.valueChanges.subscribe(
      () => {

        if (this.animal.nurture_type !== 'SURROGATE') {
          if (!this.form.get('uln_surrogate').disabled) {
            this.form.get('uln_surrogate').disable({onlySelf: true , emitEvent: false});
            this.form.get('uln_surrogate').setErrors(null);
          }
          this.ulnSurrogateEnabled = false;
        } else {
          if (!this.form.get('uln_surrogate').enabled) {
            this.form.get('uln_surrogate').enable({onlySelf: true , emitEvent: false});
            this.form.get('uln_surrogate').setErrors(null);
          }
          this.ulnSurrogateEnabled = true;
        }

        this.birthRowEvent.emit({
          'index': this.index,
          'animal': this.animal
        });
      }
    );
  }

  private _selectedMother: Animal;

  @Input()
  set selectedMother(mother: Animal) {
    this._selectedMother = mother;
    if (this._selectedMother.breed_code && this._selectedMother.breed_code === this.constants.CLUN_FOREST) {
      this.form.get('tail_length').validator = TailValidator.TailLengthNotGreaterThen29point9;
      this.form.get('tail_length').updateValueAndValidity();
      this.form.get('tail_length').setErrors(null);
    } else {
      this.form.get('tail_length').validator = null;
      this.form.get('tail_length').updateValueAndValidity();
      this.form.get('tail_length').setErrors(null);
    }

    this.parent_form.updateValueAndValidity();
    this.parent_form.setErrors(null);
  }

  ngOnInit() {

    if (this.animal.is_alive) {
      this.form.addControl('uln_number', new FormControl('', Validators.required));
      this.form.addControl('gender', new FormControl('', Validators.required));
      this.form.addControl('weight', new FormControl('', Validators.compose([WeightValidator.WeightNotGreaterThen9point9])));
    } else {
      this.form.addControl('uln_number', new FormControl(''));
      this.form.addControl('gender', new FormControl(''));
      this.form.addControl('weight', new FormControl(''));
    }

    this.parent_form.addControl(this.index, this.form);

    this.birthRowEvent.emit({
      'index': this.index,
      'animal': this.animal
    });
  }

  preventKeyPress(event) {
    event.cancelBubble = true;
    event.preventDefault();
    return false;
  }

  private selectSurrogate(event: Animal) {
    this.form.get('uln_surrogate').setValue(event.uln_country_code + event.uln_number);
    this.animal.surrogate_mother = new SurrogateMotherByUln();
    this.animal.surrogate_mother.uln_country_code = event.uln_country_code;
    this.animal.surrogate_mother.uln_number = event.uln_number;
  }

  private enableSurrogate(event: Event) {
    const target = event.target;
    if (target.valueOf() === 'SURROGATE') {
      this.form.get('uln_surrogate').validator = Validators.required;
      this.form.get('uln_surrogate').setValue('');
    }

    if (target.valueOf() !== 'SURROGATE') {
      this.form.get('uln_surrogate').validator = null;
      this.form.get('uln_surrogate').setValue('');
    }
  }

  private selectTag(event: EarTag) {
    this.selectedTag.emit([this.index, event]);
    this.animal.uln = event.uln;
    this.animal.uln_country_code = event.uln_country_code;
    this.animal.uln_number = event.uln_number;
  }
}
