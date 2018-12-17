import * as moment from 'moment';
import {Component, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {LOSS_REASON_OF_LOSS, LossRequest} from '../loss.model';
import {Settings} from '../../../shared/variables/settings';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {DateValidator, UBNValidator} from '../../../shared/validation/nsfo-validation';
import {API_URI_DECLARE_LOSS, API_URI_GET_UBN_PROCESSORS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {AnimalsOverviewSelection} from '../../../shared/components/livestock/animals-overview-selection.model';
import {JsonResponseModel} from '../../../shared/models/json-response.model';

@Component({
  templateUrl: './loss.declare.html',
})

export class LossDeclareComponent implements OnInit {
  public options_reason_of_loss = LOSS_REASON_OF_LOSS;
  public ubn_processors = [];

  public isSendingDeclare = false;
  public isValidForm = true;

  public view_date_format;
  public model_datetime_format;

  public errorMessage: string;

  public form: FormGroup;

  public modalDisplay: string;

  constructor(private fb: FormBuilder,
              private nsfo: NSFOService,
              private settings: Settings,
              private translate: TranslateService) {
    this.view_date_format = settings.VIEW_DATE_FORMAT;
    this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;

    this.form = fb.group({
      loss_date: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat])),
      ubn_processor: new FormControl('2486574', Validators.compose(
        [Validators.required, UBNValidator.validateUbn])),
      reason_loss: new FormControl('')
    });
  }

  ngOnInit() {
    this.getUBNProcessors();
  }

  public getUBNProcessors() {
    this.nsfo.doGetRequest(API_URI_GET_UBN_PROCESSORS)
      .subscribe(
          (res: JsonResponseModel) => {
          this.ubn_processors = res.result;
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
        }
      );
  }

  public declareLoss(event: AnimalsOverviewSelection) {
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
              this.errorMessage = this.nsfo.getErrorMessage(err);
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

  public openModal() {
    this.modalDisplay = 'block';
  }

  public closeModal() {
    this.modalDisplay = 'none';
  }
}
