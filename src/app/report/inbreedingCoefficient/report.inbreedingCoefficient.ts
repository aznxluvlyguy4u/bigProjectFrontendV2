import {Component} from '@angular/core';

import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_ANIMALS} from '../../shared/services/nsfo-api/nsfo.settings';

import { CSV, PDF } from '../../shared/variables/file-type.enum';
import { QueryParamsService } from '../../shared/services/utils/query-params.service';
import { DownloadService } from '../../shared/services/download/download.service';
import * as _ from 'lodash';
import {AnimalsOverviewSelection} from '../../shared/components/livestock/animals-overview-selection.model';

import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {Animal, LivestockAnimal} from '../../shared/models/animal.model';
import {JsonResponseModel} from '../../shared/models/json-response.model';

@Component({
    templateUrl: './report.inbreedingCoefficient.html',
})

export class ReportInbreedingCoefficientComponent {
    public livestock = <LivestockAnimal[]>[];
    public selectedRam: Animal = new Animal;
    public form: FormGroup;
    defaultFileType: string = PDF;
    public inbreedingMaxSelectionCount = 50;

    constructor(
        private nsfo: NSFOService,
        private fb: FormBuilder,
        private queryParamsService: QueryParamsService,
        private downloadService: DownloadService
    ) {
        this.form = fb.group({
            uln: new FormControl(''),
        });
        this.getLivestockList();
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

    public generateReport(event: AnimalsOverviewSelection) {
        this.downloadService.doInbreedingCoefficientReportPostRequest(this.selectedRam, event.animals, event.fileType);
    }

    public selectRam(ram: Animal) {
        this.selectedRam = ram;
        this.form.get('uln').setValue(ram.uln);
    }


    public getFileTypesList(): string[] {
        return [ CSV, PDF ];
    }
}
