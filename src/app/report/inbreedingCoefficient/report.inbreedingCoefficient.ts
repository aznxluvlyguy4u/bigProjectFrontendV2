import {Component} from '@angular/core';

import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_ANIMALS_LIVESTOCK} from '../../shared/services/nsfo-api/nsfo.settings';

import { CSV, PDF } from '../../shared/variables/file-type.enum';
import { QueryParamsService } from '../../shared/services/utils/query-params.service';
import { DownloadService } from '../../shared/services/download/download.service';
import * as _ from 'lodash';
import {AnimalsOverviewSelection} from '../../shared/components/livestock/animals-overview-selection.model';

import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {Animal, LivestockAnimal} from '../../shared/models/animal.model';
import {JsonResponseModel} from '../../shared/models/json-response.model';
import {TranslateService} from '@ngx-translate/core';
import {UlnRequestModel} from '../../shared/request/UlnRequestModel';

@Component({
    templateUrl: './report.inbreedingCoefficient.html',
})

export class ReportInbreedingCoefficientComponent {
    public livestock = <LivestockAnimal[]>[];
    public selectedRam1: Animal = new Animal;
    public selectedRam2: Animal = new Animal;
    public selectedRam3: Animal = new Animal;
    public selectedRam4: Animal = new Animal;
    public selectedRam5: Animal = new Animal;
    public form: FormGroup;
    defaultFileType: string = PDF;
    public inbreedingMaxSelectionCount = 200;

    private static isRamSelected(ram ?: Animal): boolean {
      return !!(ram && ram.uln_number && ram.uln_country_code);
    }

    private static getMinimalParentRequestBodyData(ram: Animal): UlnRequestModel {
      return new UlnRequestModel(
        ram.uln_country_code,
        ram.uln_number
      );
    }

    private static cleanEmptyRam(ram?: Animal): Animal {
      if (ram && ram.uln_number) {
        return ram;
      }
      return new Animal();
    }

    constructor(
        private nsfo: NSFOService,
        private fb: FormBuilder,
        private queryParamsService: QueryParamsService,
        private downloadService: DownloadService,
        private translate: TranslateService,
    ) {
        this.form = fb.group({
            uln1: new FormControl(''),
            uln2: new FormControl(''),
            uln3: new FormControl(''),
            uln4: new FormControl(''),
            uln5: new FormControl(''),
        });
        this.getLivestockList();
    }

    private getLivestockList() {
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

    public generateReport(event: AnimalsOverviewSelection) {

        const rams: UlnRequestModel[] = [];
        if (ReportInbreedingCoefficientComponent.isRamSelected(this.selectedRam1)) {
          rams.push(ReportInbreedingCoefficientComponent.getMinimalParentRequestBodyData(this.selectedRam1));
        }
        if (ReportInbreedingCoefficientComponent.isRamSelected(this.selectedRam2)) {
          rams.push(ReportInbreedingCoefficientComponent.getMinimalParentRequestBodyData(this.selectedRam2));
        }
        if (ReportInbreedingCoefficientComponent.isRamSelected(this.selectedRam3)) {
          rams.push(ReportInbreedingCoefficientComponent.getMinimalParentRequestBodyData(this.selectedRam3));
        }
        if (ReportInbreedingCoefficientComponent.isRamSelected(this.selectedRam4)) {
          rams.push(ReportInbreedingCoefficientComponent.getMinimalParentRequestBodyData(this.selectedRam4));
        }
        if (ReportInbreedingCoefficientComponent.isRamSelected(this.selectedRam5)) {
          rams.push(ReportInbreedingCoefficientComponent.getMinimalParentRequestBodyData(this.selectedRam5));
        }

        console.log(rams);

        if (rams.length === 0) {
          alert(this.translate.instant('NO RAM SELECTED'));
          return;
        }

        const ewesRequestBodyModel: UlnRequestModel[] = [];

        for (const animal of event.animals) {
            ewesRequestBodyModel.push(new UlnRequestModel(
              animal.uln_country_code,
              animal.uln_number
            ));
        }

        this.downloadService.doInbreedingCoefficientReportPostRequest(rams, ewesRequestBodyModel, event.fileType);
    }

    public selectRam1(ram: Animal) {
        this.selectedRam1 = ReportInbreedingCoefficientComponent.cleanEmptyRam(ram);
        this.form.get('uln1').setValue(this.selectedRam1.uln);
    }

    public selectRam2(ram: Animal) {
      this.selectedRam2 = ReportInbreedingCoefficientComponent.cleanEmptyRam(ram);
      this.form.get('uln2').setValue(this.selectedRam2.uln);
    }

    public selectRam3(ram: Animal) {
      this.selectedRam3 = ReportInbreedingCoefficientComponent.cleanEmptyRam(ram);
      this.form.get('uln3').setValue(this.selectedRam3.uln);
    }

    public selectRam4(ram: Animal) {
      this.selectedRam4 = ReportInbreedingCoefficientComponent.cleanEmptyRam(ram);
      this.form.get('uln4').setValue(this.selectedRam4.uln);
    }

    public selectRam5(ram: Animal) {
      this.selectedRam5 = ReportInbreedingCoefficientComponent.cleanEmptyRam(ram);
      this.form.get('uln5').setValue(this.selectedRam5.uln);
    }

    public getFileTypesList(): string[] {
        return [ CSV, PDF ];
    }
}
