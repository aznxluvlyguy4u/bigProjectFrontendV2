import { Component } from '@angular/core';

import { DownloadService } from '../../shared/services/download/download.service';

@Component({
  selector: 'app-animal-treatments-per-year-of-birth-report',
  templateUrl: './report.animal-treatments-per-year.component.html',
})
export class ReportAnimalTreatmentsPerYearComponent {

  public yearOfBirth: number;

  constructor(private downloadService: DownloadService) {
    this.initializeValues();
  }

  initializeValues() {
    this.yearOfBirth = (new Date()).getUTCFullYear();
  }

  download() {
    this.downloadService.doAnimalTreatmentsPerYearReportGetRequest(this.yearOfBirth.toString());
  }
}
