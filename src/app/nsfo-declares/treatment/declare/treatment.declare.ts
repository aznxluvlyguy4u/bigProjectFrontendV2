import * as _ from 'lodash';
import {Component, OnDestroy, OnInit, AfterViewChecked} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Constants} from '../../../shared/variables/constants';
import {LIVESTOCK_TYPE_TREATMENT} from '../../../shared/components/livestock/overview.component';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {API_URI_GET_ANIMALS_LIVESTOCK, API_URI_GET_TREATMENT_TEMPLATES} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Router} from '@angular/router';
import {Settings} from '../../../shared/variables/settings';
import {Subject, Subscription} from 'rxjs';
import {Animal, LivestockAnimal} from '../../../shared/models/animal.model';
import {ErrorMessage} from '../../../shared/models/error-message.model';
import {JsonResponseModel} from '../../../shared/models/json-response.model';
import * as moment from 'moment';
import {TreatmentTemplateSelectionGroup, TreatmentTemplate} from '../../../shared/models/treatment-template.model';
import {CacheService} from '../../../shared/services/settings/cache.service';
import {TreatmentService} from '../treatment.service';
import {TreatmentMedication} from '../../../shared/models/treatment-medication.model';
import {MedicationOption} from '../../../shared/models/medication-option.model';
import {Treatment} from '../../../shared/models/treatment-model';

@Component({
  providers: [NSFOService, Constants],
  templateUrl: './treatment.declare.html',
})

export class TreatmentDeclareComponent implements OnInit, OnDestroy, AfterViewChecked {
  livestockType = LIVESTOCK_TYPE_TREATMENT;
  public countryCode$;
  public country_code_list = [];
  public isSendingDeclare = false;
  public isValidForm = true;
  public livestock = <LivestockAnimal[]>[];

  private treatmentTemplatesSubscription: Subscription;
  public treatmentTemplates = <TreatmentTemplate[]>[];
  public treatmentTemplateSelectionGroups = <TreatmentTemplateSelectionGroup[]>[];

  public modalDisplay = 'none';
  public errorMessages: ErrorMessage[] = [];
  public view_date_format;
  public model_datetime_format;
  public form: FormGroup = new FormGroup({
        uln: new FormControl(''),
        pmsg: new FormControl('NO'),
        ki: new FormControl('NO'),
        start_date: new FormControl(),
        end_date: new FormControl()
    });
  public uidPattern = '[0-9]';
  public successDurationSeconds = 3;
  public updateEndDateSubject = new Subject<any>();
  public updateEndDateObservable = this.updateEndDateSubject.asObservable();
  public sendStartDateSubject = new Subject<any>();
  public sendStartDateObservable = this.sendStartDateSubject.asObservable();
  public self;
  private startDate;
  public userWantsToAddEndDate = false;
  private currentLocationUbn;
  public selectedTreatmentTemplate: TreatmentTemplate;
  public showTreatmentTemplates = true;
  public displayTreatmentLocationIndividualType = this.treatmentService.displayTreatmentLocationIndividualType;

  constructor(private fb: FormBuilder,
              private nsfo: NSFOService,
              private router: Router,
              public constants: Constants,
              private settingsService: SettingsService,
              private settings: Settings,
              private translate: TranslateService,
              private treatmentService: TreatmentService,
              private cache: CacheService
  ) {
    this.self = this;
    this.view_date_format = settingsService.getViewDateFormat();
    this.model_datetime_format = settingsService.getModelDateTimeFormat();
    this.currentLocationUbn = this.cache.getUbn();
  }

  ngOnInit() {
    this.getLivestockList();
    this.errorMessages = [];

    this.treatmentTemplatesSubscription = this.treatmentService.treatmentTemplatesChanged.subscribe(
      (templates: TreatmentTemplate[]) => {
        this.treatmentTemplates = templates;
        this.updateTreatmentTemplateSelectionGroups();
      }
    );
    this.treatmentTemplates = this.treatmentService.getTreatmentTemplates();
    this.updateTreatmentTemplateSelectionGroups();
  }

  private updateTreatmentTemplateSelectionGroups() {
    this.treatmentTemplateSelectionGroups = [];
    this.treatmentTemplateSelectionGroups.push(
      new TreatmentTemplateSelectionGroup('Q-FEVER',
        this.treatmentService.getTreatmentTemplates().filter( template => template.templatetype === 'QFever')
      ),
      new TreatmentTemplateSelectionGroup('NEW',
        this.treatmentService.getTreatmentTemplates().filter( template => template.templatetype === 'Default' && template.is_new)
      ),
      new TreatmentTemplateSelectionGroup('TREATMENT',
        this.treatmentService.getTreatmentTemplates().filter( template => template.templatetype === 'Default' && !template.is_new)
      ),
    );
  }

  ngOnDestroy(): void {
    this.treatmentTemplatesSubscription.unsubscribe();
  }

  ngAfterViewChecked() {
      this.startDate = moment(this.form.get('start_date').value);
  }

  declareTreatment(event) {
    const animals = [];
    event.animals.forEach((animal: Animal) => {
      let type = '';
      switch (animal.gender) {
        case 'MALE':
          type = 'Ram';
        break;
        case 'FEMALE':
          type = 'Ewe';
        break;
        case 'NEUTER':
          type = 'Neuter';
        break;
      }

        animals.push({
          id: animal.id,
          type: type
        });
    });

    if (this.form.valid) {
      const requestData: any = {};

      const clonedTreatmentTemplate = _.cloneDeep(this.selectedTreatmentTemplate);

      _.remove(clonedTreatmentTemplate.treatment_medications, (treatment_medication) => {
        return !treatment_medication.marked_to_keep;
      });

      requestData.treatment_template = clonedTreatmentTemplate;
      requestData.treatment_template.location = {};
      requestData.description = this.selectedTreatmentTemplate.description;
      requestData.start_date = this.form.get('start_date').value;
      if (this.useEndDate()) {
        requestData.end_date = this.form.get('end_date').value;
      }
      requestData.animals = animals;
      requestData.treatment_template.location.id = this.cache.getLocation().id;

      this.nsfo
        .doPostRequest(API_URI_GET_TREATMENT_TEMPLATES + '/' + this.selectedTreatmentTemplate.type.toLowerCase(), requestData)
        .subscribe( (res: JsonResponseModel) => {
            if (typeof res.result.code !== 'undefined' && res.result.code === 500) {
              alert(res.result.message);
            }
          },
          error => {
            alert(this.nsfo.getErrorMessage(error));
          });
    }
  }

  public setDefaultMarkedForRemoval() {
    this.selectedTreatmentTemplate.treatment_medications.forEach((treatmentMedication: TreatmentMedication) => {
      treatmentMedication.marked_to_keep = true;
    });
  }

  public isTreatmentTemplateNotSelected() {
    return typeof this.selectedTreatmentTemplate === 'undefined';
  }

  purgeErrors() {
    this.errorMessages = [];
    this.closeModal();
  }

  public updateEndDate(startDate) {
    if (typeof startDate === 'object') {
        this.form.get('end_date').setValue(startDate.format());
        this.updateEndDateSubject.next(startDate.format('DD-MM-YYYY'));
    }
  }

  public sendStartDateToDatePicker() {
    this.sendStartDateSubject.next(this.startDate);
  }

  public getCountryCodeList() {
    this.countryCode$ = this.settingsService.getCountryList()
      .subscribe(countryCodeList => {
        this.country_code_list = countryCodeList;
      });
  }

  public getLivestockList() {
    this.nsfo
      .doGetRequest(API_URI_GET_ANIMALS_LIVESTOCK)
      .subscribe(
          (res: JsonResponseModel) => {
          this.livestock = <LivestockAnimal[]> res.result;
          for (const animal of this.livestock) {
            if (animal.uln_country_code && animal.uln_number) {
              animal.uln = animal.uln_country_code + animal.uln_number;
              animal.ulnLastFive = animal.uln_number.substr(animal.uln_number.length - 5);
            }

            if (animal.pedigree_country_code && animal.pedigree_number) {
              animal.pedigree = animal.pedigree_country_code + animal.pedigree_number;
            }
          }

          this.livestock = _.orderBy(this.livestock, ['ulnLastFive'], ['asc']);
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
        }
      );
  }

  public getCheckBoxTitle(treatmentTemplate: TreatmentTemplate): string {
    return treatmentTemplate.is_editable ? '' : 'THIS MEDICINE IS OBLIGATORY';
  }

  public openModal() {
    this.modalDisplay = 'block';
  }

  public closeModal() {
    this.modalDisplay = 'none';
  }

  public navigateTo(route: string) {
    this.router.navigate([route]);
  }

  public useEndDate(): boolean {
      return this.userWantsToAddEndDate && this.allowEndDate();
  }

  public activateUserWantsToUseEndDate() {
    this.userWantsToAddEndDate = true;
    this.updateEndDate(this.startDate);
  }

  public allowEndDate(): boolean {
      return this.selectedTreatmentTemplate && this.selectedTreatmentTemplate.allow_end_date;
  }
}
