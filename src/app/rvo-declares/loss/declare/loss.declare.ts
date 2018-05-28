import moment = require('moment');
import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {Datepicker} from '../../../shared/components/datepicker/datepicker.component';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {LOSS_REASON_OF_LOSS, LossRequest} from '../loss.model';
import {Settings} from '../../../shared/variables/settings';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {DateValidator, UBNValidator} from '../../../shared/validation/nsfo-validation';
import {API_URI_DECLARE_LOSS, API_URI_GET_UBN_PROCESSORS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {LivestockOverviewComponent} from '../../../shared/components/livestock/overview.component';
import {AnimalsOverviewSelection} from '../../../shared/components/livestock/animals-overview-selection.model';

@Component({
  directives: [Datepicker, LivestockOverviewComponent],
  templateUrl: './loss.declare.html',

})

export class LossDeclareComponent implements OnInit {
  private options_reason_of_loss = LOSS_REASON_OF_LOSS;
  private ubn_processors = [];

  private isSendingDeclare = false;
  private isValidForm = true;

  private view_date_format;
  private model_datetime_format;

  private errorMessage: string;

  private form: FormGroup;

  private modalDisplay: string;

  constructor(private fb: FormBuilder,
              private nsfo: NSFOService,
              private settings: Settings,
              private translate: TranslateService) {
    this.view_date_format = settings.VIEW_DATE_FORMAT;
    this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;

    this.form = fb.group({
      loss_date: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat])),
      ubn_processor: new FormControl('2486574', Validators.compose(
        [Validators.required, UBNValidator.validateWithSevenTest])),
      reason_loss: new FormControl('')
    });
  }

  ngOnInit() {
    this.getUBNProcessors();
  }

  private getUBNProcessors() {
    this.nsfo.doGetRequest(API_URI_GET_UBN_PROCESSORS)
      .subscribe(
        res => {
          this.ubn_processors = res.result;
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
        }
      );
  }

  private declareLoss(event: AnimalsOverviewSelection) {
    const animals = event.animals;
    const selectionList = event.selectionList;

    if (this.form.valid) {
      this.isValidForm = true;

      for (const animal of animals) {
        animal.sending = true;

        const loss: LossRequest = new LossRequest();

        const date_of_death_moment = moment(this.form.get('loss_date').value, this.settings.VIEW_DATE_FORMAT);
        loss.date_of_death = date_of_death_moment.format(this.settings.MODEL_DATETIME_FORMAT);

        loss.reason_of_loss = this.form.get('reason_loss').value;
        loss.ubn_processor = this.form.get('ubn_processor').value;
        loss.animal.uln_country_code = animal.uln_country_code;
        loss.animal.uln_number = animal.uln_number;

        this.nsfo
          .doPostRequest(API_URI_DECLARE_LOSS, loss)
          .subscribe(
            res => {
              animal.successful = true;
              animal.selected = false;
              const index = selectionList.indexOf(animal);
              if (index !== -1) {
                selectionList.splice(index, 1);
              }
            },
            err => {
              const error = err.json();
              this.errorMessage = error.message;

              if (!this.errorMessage) {
                this.errorMessage = 'SOMETHING WENT WRONG! TRY AGAIN AT LATER TIME!';
              }
              this.openModal();
              animal.successful = false;
              animal.sending = false;
            }
          );
      }
    } else {
      this.isValidForm = false;
    }
  }

  private openModal() {
    this.modalDisplay = 'block';
  }

  private closeModal() {
    this.modalDisplay = 'none';
  }
}
