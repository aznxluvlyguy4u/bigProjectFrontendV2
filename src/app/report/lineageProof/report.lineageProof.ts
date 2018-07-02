import {Component} from '@angular/core';
import { CSV, PDF } from '../../shared/variables/file-type.enum';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';

import { QueryParamsService } from '../../shared/services/utils/query-params.service';
import { DownloadService } from '../../shared/services/download/download.service';
import {TranslateService} from '@ngx-translate/core';
import {AnimalsOverviewSelection} from '../../shared/components/livestock/animals-overview-selection.model';

@Component({
    templateUrl: './report.lineageProof.html',
})

export class ReportLineageProofComponent {
    defaultFileType: string = PDF;
    public lineageProofMaxSelectionCount = 50;

    constructor(private nsfo: NSFOService, private queryParamsService: QueryParamsService,
                private downloadService: DownloadService, private translate: TranslateService) {}

    public generateReport(event: AnimalsOverviewSelection) {
        this.downloadService.doLineageProofPostRequest(event.animals, event.fileType);
    }

    public getFileTypesList(): string[] {
        return [ CSV, PDF ];
    }
}
