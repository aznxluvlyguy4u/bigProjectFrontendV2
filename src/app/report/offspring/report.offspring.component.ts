import { Component } from '@angular/core';
import { DownloadService } from '../../shared/services/download/download.service';
import { CSV } from '../../shared/variables/file-type.enum';
import { Animal } from '../../shared/models/animal.model';




@Component({
  selector: 'app-offspring-report',
  templateUrl: './report.offspring.component.html',
})
export class ReportOffspringComponent {
  defaultFileType = CSV;
  concatBreedValueAndAccuracyColumns = false;

  constructor(private downloadService: DownloadService) {}

  generateReport(animals: Animal[]) {
    this.downloadService.doOffspringReportPostRequest(animals,true);
  }

  public getFileTypesList(): string[] {
    return [ CSV ];
  }
}
