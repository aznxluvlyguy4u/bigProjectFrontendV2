import {AfterViewChecked, Component} from '@angular/core';
import { PDF } from '../../shared/variables/file-type.enum';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';

import { QueryParamsService } from '../../shared/services/utils/query-params.service';
import { DownloadService } from '../../shared/services/download/download.service';
import {AnimalsOverviewSelection} from '../../shared/components/livestock/animals-overview-selection.model';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {SettingsService} from '../../shared/services/settings/settings.service';
import {API_URI_GET_LOCATIONS_WITH_EXPORT_OR_DEPART} from '../../shared/services/nsfo-api/nsfo.settings';
import * as moment from 'moment';

@Component({
    templateUrl: './report.combiFormTransportDocument.html',
})

export class ReportCombiFormTransportDocumentComponent {

    defaultFileType: string = PDF;
    public form: FormGroup;
    public view_date_format;
    public model_datetime_format;
    public modalDisplay;
    public locations;
    public exportUBN = '';
    public isLoadingLocations = true;

    private transport_date;

    constructor(
      private nsfo: NSFOService,
      private queryParamsService: QueryParamsService,
      private downloadService: DownloadService,
      private fb: FormBuilder,
      private settingsService: SettingsService,
    ) {
      this.form = fb.group({
          transport_date: new FormControl('')
        }
      );
      this.view_date_format = settingsService.getViewDateFormat();
      this.model_datetime_format = settingsService.getModelDateTimeFormat();
      setTimeout(this.getLocationsWithExportsOrDeparts(), 3000);
    }

    public generateReport() {
        this.downloadService.doCombiFormTransportDocumentPostRequest(this.form, this.exportUBN);
    }

    public getFileTypesList(): string[] {
        return [ PDF ];
    }

    public setTransportDate(value) {
      this.transport_date = value;
      this.getLocationsWithExportsOrDeparts();
    }

    public openModal() {
      this.modalDisplay = 'block';
    }

    public closeModal() {
      this.modalDisplay = 'none';
    }

    private getLocationsWithExportsOrDeparts() {
      this.nsfo.doGetRequest(API_URI_GET_LOCATIONS_WITH_EXPORT_OR_DEPART + '?depart_date=' + moment(this.transport_date).format('D-M-YYYY'))
        .subscribe((response: any) => {
          this.locations = response.result;
          this.isLoadingLocations = false;
          if (this.locations.length > 0) {
            this.exportUBN = this.locations[0].ubn;
          }
        });
    }
}
