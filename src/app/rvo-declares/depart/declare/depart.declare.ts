import * as moment from 'moment';
import {Component} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {DEPART_REASON_OF_DEPART, DepartRequest} from '../depart.model';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Constants} from '../../../shared/variables/constants';
import {Settings} from '../../../shared/variables/settings';
import {DateValidator, UBNValidator} from '../../../shared/validation/nsfo-validation';
import {API_URI_DECLARE_DEPART} from '../../../shared/services/nsfo-api/nsfo.settings';
import {AnimalsOverviewSelection} from '../../../shared/components/livestock/animals-overview-selection.model';

@Component({
  templateUrl: './depart.declare.html',
})

export class DepartDeclareComponent {
  public options_reason_of_depart = DEPART_REASON_OF_DEPART;
  public isSendingDeclare = false;
  public isValidForm = true;

  public modalDisplay = 'none';
  public errorMessage = '';

  public view_date_format;
  public model_datetime_format;

  public form: FormGroup;
  public export_animal: FormGroup;

  constructor(private fb: FormBuilder,
              private nsfo: NSFOService,
              public constants: Constants,
              private settings: Settings,
              private translate: TranslateService) {
    this.view_date_format = settings.VIEW_DATE_FORMAT;
    this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;

    this.export_animal = new FormGroup({
      export_flag: new FormControl(this.constants.NO),
      ubn_new_owner: new FormControl('', UBNValidator.validateUbn),
      certificate_number: new FormControl('')
    });
    this.export_animal.validator = UBNValidator.isExportAnimal;

    this.form = fb.group({
      depart_date: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat])),
      reason_depart: new FormControl('NO REASON'),
      export_animal: this.export_animal
    });
  }

  public declareDepart(event: AnimalsOverviewSelection) {
    const animals = event.animals;
    const selectionList = event.selectionList;

    if (this.form.valid) {
      this.isValidForm = true;

      const depart: DepartRequest = new DepartRequest();

      const depart_date_moment = moment(this.form.get('depart_date').value, this.settings.VIEW_DATE_FORMAT);
      depart.depart_date = depart_date_moment.format(this.settings.MODEL_DATETIME_FORMAT);

      if (this.export_animal.controls['export_flag'].value === this.constants.NO) {
        depart.is_export_animal = false;
        depart.ubn_new_owner = this.export_animal.controls['ubn_new_owner'].value;
        depart.reason_of_depart = this.form.get('reason_depart').value;
      }

      if (this.export_animal.controls['export_flag'].value === this.constants.YES) {
        depart.is_export_animal = true;
        depart.certificate_number = this.export_animal.controls['certificate_number'].value;
        depart.reason_of_depart = 'EXPORT';
      }

      for (const animal of animals) {
        animal.sending = true;
        depart.animal.uln_country_code = animal.uln_country_code;
        depart.animal.uln_number = animal.uln_number;
        depart.animal.pedigree_country_code = animal.pedigree_country_code;
        depart.animal.pedigree_number = animal.pedigree_number;

        this.nsfo.doPostRequest(API_URI_DECLARE_DEPART, depart)
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
              const error = err.error.result;
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

  public openModal() {
    this.modalDisplay = 'block';
  }

  public closeModal() {
    this.modalDisplay = 'none';
  }

  public clearUBNValue() {
    if (this.export_animal.get('export_flag').value === this.constants.NO) {
      this.export_animal.get('ubn_new_owner').setValue('');
    }
  }

  public clearCertificateValue() {
    if (this.export_animal.get('export_flag').value === this.constants.YES) {
      this.export_animal.get('certificate_number').setValue('');
    }
  }
}
