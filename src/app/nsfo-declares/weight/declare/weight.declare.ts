import moment = require('moment');
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

@Component({
  templateUrl: './weight.declare.html',
})

export class WeightDeclareComponent {
  private isSendingDeclare = false;
  private isValidForm = true;

  private modalDisplay = 'none';
  private warningModalDisplay = 'none';
  private errorMessages: ErrorMessage[] = [];

  private view_date_format;
  private model_datetime_format;

  private form: FormGroup;

  private selectedAnimal: Animal;

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

  private declareWeight(event: AnimalsOverviewSelection) {
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


  private doDeclareRequest() {
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
          const error = err.json();
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

  private isWeightInputValid(animal: Animal) {
    const now = moment();
    const birthDate = moment(animal.date_of_birth, this.settings.getViewDateFormat());
    const dateDifference = now.diff(birthDate, 'months');

    return !(dateDifference < 6 && animal.weight > animal.new_weight);
  }

  private openModal() {
    this.modalDisplay = 'block';
  }

  private closeModal() {
    this.modalDisplay = 'none';
  }

  private openWarningModal() {
    this.warningModalDisplay = 'block';
  }

  private closeWarningModal() {
    this.warningModalDisplay = 'none';
  }
}
