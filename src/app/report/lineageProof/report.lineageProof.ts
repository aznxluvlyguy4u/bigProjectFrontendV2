import {Component} from '@angular/core';
import { CSV, PDF } from '../../shared/variables/file-type.enum';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import { LivestockOverview } from '../../shared/components/livestock';
import { QueryParamsService } from '../../shared/services/utils/query-params.service';
import { DownloadService } from '../../shared/services/download/download.service';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {AnimalsOverviewSelection} from '../../shared/components/livestock/animals-overview-selection.model';

@Component({
    directives: [LivestockOverview],
    template: require('./report.lineageProof.html'),
    
})

export class ReportLineageProofComponent {
    defaultFileType: string = PDF;
    private lineageProofMaxSelectionCount = 50;

    constructor(private nsfo: NSFOService, private queryParamsService: QueryParamsService,
                private downloadService: DownloadService, private translate: TranslateService) {}

    private generateReport(event: AnimalsOverviewSelection) {
        this.downloadService.doLineageProofPostRequest(event.animals, event.fileType);
    }

    public getFileTypesList(): string[] {
        return [ CSV, PDF ];
    }
}
