import * as _ from 'lodash';
import {Component, OnDestroy, OnInit, AfterViewInit} from '@angular/core';
import {FormControl, FormGroup, FormBuilder, Validators} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {Constants} from '../../../shared/variables/constants';
import {LIVESTOCK_TYPE_MATE} from '../../../shared/components/livestock/overview.component';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {API_URI_DECLARE_MATE, API_URI_GET_ANIMALS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {Router} from '@angular/router';
import {Settings} from '../../../shared/variables/settings';
import {Observable, Subject} from 'rxjs';
import {MateChangeResponse} from '../../../shared/models/nsfo-declare.model';
import {LivestockAnimal} from '../../../shared/models/animal.model';
import {MateAnimalWithStatus} from './mate-animal-with-status.model';
import {AnimalsOverviewSelection} from '../../../shared/components/livestock/animals-overview-selection.model';
import {ErrorMessage} from '../../../shared/models/error-message.model';
import {JsonResponseModel} from '../../../shared/models/json-response.model';
import {HttpErrorResponse} from '@angular/common/http';
import * as moment from 'moment';

@Component({
  providers: [NSFOService, Constants],
  templateUrl: './mate.declare.html',
})

export class MateDeclareComponent implements OnInit, OnDestroy {
  livestockType = LIVESTOCK_TYPE_MATE;
  lastDeclareUpdateSubject = new Subject<MateChangeResponse>();
  public countryCode$;
  public country_code_list = [];
  public isSendingDeclare = false;
  public isValidForm = true;
  public livestock = <LivestockAnimal[]>[];
  public selectedRam: MateAnimalWithStatus;
  public modalDisplay = 'none';
  public errorMessages: ErrorMessage[] = [];
  public view_date_format;
  public model_datetime_format;
  public form: FormGroup = new FormGroup({
        uln: new FormControl(''),
        pmsg: new FormControl('NO'),
        ki: new FormControl('NO'),
        mate_startdate: new FormControl(),
        mate_enddate: new FormControl()
    });
  public uidPattern = '[0-9]';
  public successDurationSeconds = 3;
  private updateEndDateSubject = new Subject<any>();
  public updateEndDateObservable = this.updateEndDateSubject.asObservable();
  private sendStartDateSubject = new Subject<any>();
  public sendStartDateObservable = this.sendStartDateSubject.asObservable();
  private self;
  private startDate;

  constructor(private fb: FormBuilder,
              private nsfo: NSFOService,
              private router: Router,
              public constants: Constants,
              private settingsService: SettingsService,
              private settings: Settings,
              private translate: TranslateService) {
    this.self = this;
    this.view_date_format = settingsService.getViewDateFormat();
    this.model_datetime_format = settingsService.getModelDateTimeFormat();

  }

  ngOnInit() {
    this.getCountryCodeList();
    this.getLivestockList();
    this.errorMessages = [];
  }

  ngAfterViewChecked() {
      this.startDate = moment(this.form.get('mate_startdate').value);
  }

  ngOnDestroy() {
    this.countryCode$.unsubscribe();
  }

  purgeErrors() {
    this.errorMessages = [];
    this.closeModal();
  }

  private updateEndDate(startDate) {
    if (typeof startDate === 'object') {
        this.form.get('mate_enddate').setValue(startDate.format());
        this.updateEndDateSubject.next(startDate.format('DD-MM-YYYY'));
    }
  }

  private sendStartDateToDatePicker()
  {
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
      .doGetRequest(API_URI_GET_ANIMALS)
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

  public declareMate(event: AnimalsOverviewSelection) {
    const animals: MateAnimalWithStatus[] = <MateAnimalWithStatus[]>(event.animals);
    const selectionList = event.selectionList;

    if (this.form.valid) {
      this.isValidForm = true;

      const ki = this.form.get('ki').value === 'YES';
      const pmsg = this.form.get('pmsg').value === 'YES';

      const ram = {};

      if (this.selectedRam === null
        || this.selectedRam.uln_country_code === null
        || this.selectedRam.uln_number === null) {
        alert(this.translate.instant('STUD RAM CANNOT BE EMPTY'));
        return;
      }

      ram['uln_country_code'] = this.selectedRam.uln_country_code;
      ram['uln_number'] = this.selectedRam.uln_number;

      for (const animal of animals) {
        animal.sending = true;

        const request = {
          'start_date': this.form.get('mate_startdate').value,
          'end_date': this.form.get('mate_enddate').value,
          'ki': ki,
          'pmsg': pmsg,
          'ram': ram,
          'ewe': {
            'uln_country_code': animal.uln_country_code,
            'uln_number': animal.uln_number
          }
        };
        this.nsfo.doPostRequest(API_URI_DECLARE_MATE, request)
          .subscribe(
              (res: JsonResponseModel) => {

              animal.successful = true;
              animal.selected = false;
              const index = selectionList.indexOf(<LivestockAnimal>(animal));
              if (index !== -1) {
                selectionList.splice(index, 1);
              }

              this.updateLastMateAfterDeclare(res.result);

              setTimeout(() => {
                animal.successful = false;
                animal.sending = false;

                const indexOfAnimal = selectionList.indexOf(<LivestockAnimal>(animal));
                if (indexOfAnimal !== -1) {
                  selectionList.splice(indexOfAnimal, 1);
                }
              }, this.successDurationSeconds * 1000);
            },
            (err: HttpErrorResponse) => {
              const error = err.error;
              if (error.result.length === 0) {
                const errorMessage = {
                  code: 403,
                  message: 'SOMETHING WENT WRONG! TRY AGAIN AT LATER TIME!'
                };
                this.errorMessages.push(errorMessage);

              } else {
                for (const errorMessage of error.result) {
                  errorMessage.message += ' [Ooi: ' + animal.uln_country_code + animal.uln_number + ']';
                  this.errorMessages.push(errorMessage);
                }
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

  public updateLastMateAfterDeclare(declareResult: MateChangeResponse) {
    this.lastDeclareUpdateSubject.next(declareResult);
  }

  public selectRam(ram: MateAnimalWithStatus) {
    this.selectedRam = ram;
    this.form.get('uln').setValue(ram.uln);
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

}
