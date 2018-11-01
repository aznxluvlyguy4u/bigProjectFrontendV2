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
import {CacheService} from '../../../shared/services/settings/cache.service';

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
  public animal_form: FormGroup;

  constructor(private fb: FormBuilder,
              private nsfo: NSFOService,
              public constants: Constants,
              private settings: Settings,
              private cache: CacheService,
              private translate: TranslateService) {
    this.view_date_format = settings.VIEW_DATE_FORMAT;
    this.model_datetime_format = settings.MODEL_DATETIME_FORMAT;

    this.animal_form = new FormGroup({
      export_flag: new FormControl(this.constants.NO),
      ubn_new_owner: new FormControl('', UBNValidator.validateUbnAllowEmpty),
      certificate_number: new FormControl('')
    });
    this.animal_form.validator = UBNValidator.isExportAnimal;

    this.form = fb.group({
      depart_date: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat])),
      reason_depart: new FormControl('NO REASON'),
      export_animal: this.animal_form
    });
  }

  public declareDepart(event: AnimalsOverviewSelection) {
    const animals = event.animals;
    const selectionList = event.selectionList;

    if (this.form.valid) {
      this.isValidForm = true;

      if (this.animal_form.controls['export_flag'].value === this.constants.NO) {
        const ubnNewOwner = this.animal_form.controls['ubn_new_owner'].value;
        if (ubnNewOwner === this.cache.getUbn()) {
          this.errorMessage = this.translate.instant('UBN OF DEPARTURE AND ARRIVAL ARE IDENTICAL');
          this.openModal();
          return;
        }
      }

      const depart: DepartRequest = new DepartRequest();

      const depart_date_moment = moment(this.form.get('depart_date').value, this.settings.VIEW_DATE_FORMAT);
      depart.depart_date = depart_date_moment.format(this.settings.MODEL_DATETIME_FORMAT);

      if (this.animal_form.controls['export_flag'].value === this.constants.NO) {
        depart.is_export_animal = false;
        depart.ubn_new_owner = this.animal_form.controls['ubn_new_owner'].value;
        depart.reason_of_depart = this.form.get('reason_depart').value;

        if (!this.isValidUbn(depart.ubn_new_owner)) {
          alert(this.translate.instant('UBN IS INVALID') + ': ' + depart.ubn_new_owner);
          return;
        }
      }

      if (this.animal_form.controls['export_flag'].value === this.constants.YES) {
        depart.is_export_animal = true;
        depart.certificate_number = this.animal_form.controls['certificate_number'].value;
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

  private isValidUbn(ubn: string): boolean {
    if (this.cache.useRvoLogic()) {
      return UBNValidator.isValidDutchUbn(ubn);
    }
    return UBNValidator.isValidNonDutchUbn(ubn);
  }

  public openModal() {
    this.modalDisplay = 'block';
  }

  public closeModal() {
    this.modalDisplay = 'none';
  }

  public clearUBNValue() {
    if (this.animal_form.get('export_flag').value === this.constants.NO) {
      this.animal_form.get('ubn_new_owner').setValue('');
    }
  }

  public clearCertificateValue() {
    if (this.animal_form.get('export_flag').value === this.constants.YES) {
      this.animal_form.get('certificate_number').setValue('');
    }
  }
}
