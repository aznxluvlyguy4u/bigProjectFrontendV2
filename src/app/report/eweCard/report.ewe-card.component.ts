import { Component } from '@angular/core';
import { DownloadService } from '../../shared/services/download/download.service';
import { PDF } from '../../shared/variables/file-type.enum';
import { Animal } from '../../shared/models/animal.model';




@Component({
  selector: 'app-ewe-card-report',
  templateUrl: './report.ewe-card.component.html',
})
export class ReportEweCardComponent {
  defaultFileType = PDF;
  maxSelectionCount = 50;

  constructor(private downloadService: DownloadService) {}

  generateReport(animals: Animal[]) {
    this.downloadService.doEweCardReportPostRequest(animals);
  }

  public getFileTypesList(): string[] {
    return [ PDF ];
  }
}
