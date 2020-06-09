import {Component} from '@angular/core';
import { PDF } from '../../shared/variables/file-type.enum';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';

import { QueryParamsService } from '../../shared/services/utils/query-params.service';
import { DownloadService } from '../../shared/services/download/download.service';
import {TranslateService} from '@ngx-translate/core';
import {AnimalsOverviewSelection} from '../../shared/components/livestock/animals-overview-selection.model';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {Settings} from '../../shared/variables/settings';
import {SettingsService} from '../../shared/services/settings/settings.service';
import * as moment from 'moment';

@Component({
    templateUrl: './report.combiFormTransportDocument.html',
})

export class ReportCombiFormTransportDocumentComponent {
    defaultFileType: string = PDF;
    public form: FormGroup;
    public view_date_format;
    public model_datetime_format;

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
    }

    public generateReport(event: AnimalsOverviewSelection) {
        this.downloadService.doCombiFormTransportDocumentPostRequest(event.animals, this.form);
    }

    public getFileTypesList(): string[] {
        return [ PDF ];
    }

    public setTransportDate(value) {
      this.transport_date = value;
    }

    public log (value) {
      console.log(value);
    }
}
