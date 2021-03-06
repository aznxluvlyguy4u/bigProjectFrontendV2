import * as moment from 'moment';
import {Component} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {DateValidator} from '../../../shared/validation/nsfo-validation';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {API_URI_DECLARE_WEIGHT} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Animal} from '../../../shared/models/animal.model';
import {ErrorMessage} from '../../../shared/models/error-message.model';
import {AnimalsOverviewSelection} from '../../../shared/components/livestock/animals-overview-selection.model';
import {LIVESTOCK_TYPE_WEIGHT} from '../../../shared/components/livestock/overview.component';

@Component({
  templateUrl: './weight.declare.html',
})

export class WeightDeclareComponent {
  public livestockType = LIVESTOCK_TYPE_WEIGHT;
  public isSendingDeclare = false;
  public isValidForm = true;

  public modalDisplay = 'none';
  public warningModalDisplay = 'none';
  public errorMessages: ErrorMessage[] = [];

  public view_date_format;
  public model_datetime_format;

  public form: FormGroup;

  public selectedAnimal: Animal;

  request: any;

  constructor(private fb: FormBuilder,
              private nsfo: NSFOService,
              private settings: SettingsService,
              private translate: TranslateService) {
    this.view_date_format = settings.getViewDateFormat();
    this.model_datetime_format = settings.getModelDateTimeFormat();

    this.form = fb.group({
      weight_date: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat]))
    });
  }

  public declareWeight(event: AnimalsOverviewSelection) {
    this.selectedAnimal = event.animals[0];
    this.errorMessages = [];

    if (this.form.valid && this.selectedAnimal.new_weight > 0 && this.selectedAnimal.new_weight < 200) {
      if (this.isWeightInputValid(this.selectedAnimal)) {
        this.isValidForm = true;
        if (this.selectedAnimal.new_weight < this.selectedAnimal.weight) {
          this.openWarningModal();
        } else {
          this.doDeclareRequest();
        }
      } else {
        const errorMessage = {
          code: 400,
          message: 'THE ANIMAL IS YOUNGER THAN 6 MONTHS. THE NEW WEIGHT IS NOT ALLOWED TO BE LOWER THAN THE PREVIOUS WEIGHT'
        };
        this.errorMessages.push(errorMessage);
        this.openModal();
        this.isValidForm = false;
        this.selectedAnimal.sending = false;
      }
    } else {
      const errorMessage = {
        code: 400,
        message: 'THE WEIGHT HAS TO BE BETWEEN 0 AND 200 KG'
      };
      this.errorMessages.push(errorMessage);
      this.openModal();
      this.isValidForm = false;
      this.selectedAnimal.sending = false;
    }

  }


  public doDeclareRequest() {
    this.selectedAnimal.sending = true;
    this.request = {
      'measurement_date': this.form.get('weight_date').value,
      'weight': this.selectedAnimal.new_weight,
      'animal': {
        'uln_country_code': this.selectedAnimal.uln_country_code,
        'uln_number': this.selectedAnimal.uln_number,
      }
    };

    this.nsfo.doPostRequest(API_URI_DECLARE_WEIGHT, this.request)
      .subscribe(
        res => {
          this.selectedAnimal.successful = true;
          this.selectedAnimal.selected = false;
          this.selectedAnimal.weight = this.selectedAnimal.new_weight;
        },
        err => {
          const error = err;
          this.errorMessages = error.result;
          if (this.errorMessages.length === 0) {
            const errorMessage = {
              code: 403,
              message: 'SOMETHING WENT WRONG! TRY AGAIN AT LATER TIME!'
            };
            this.errorMessages.push(errorMessage);
          }
          this.openModal();
          this.selectedAnimal.successful = false;
          this.selectedAnimal.sending = false;
        }
      );
  }

  public isWeightInputValid(animal: Animal) {
    const now = moment();
    const birthDate = moment(animal.date_of_birth, this.settings.getViewDateFormat());
    const dateDifference = now.diff(birthDate, 'months');

    return !(dateDifference < 6 && animal.weight > animal.new_weight);
  }

  public openModal() {
    this.modalDisplay = 'block';
  }

  public closeModal() {
    this.modalDisplay = 'none';
  }

  public openWarningModal() {
    this.warningModalDisplay = 'block';
  }

  public closeWarningModal() {
    this.warningModalDisplay = 'none';
  }
}
