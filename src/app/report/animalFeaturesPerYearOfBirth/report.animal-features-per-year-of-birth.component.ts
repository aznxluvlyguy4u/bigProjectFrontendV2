import { Component } from '@angular/core';

import { DownloadService } from '../../shared/services/download/download.service';

@Component({
  selector: 'app-animal-features-per-year-of-birth-report',
  templateUrl: './report.animal-features-per-year-of-birth.component.html',
})
export class ReportAnimalFeaturesPerYearOfBirthComponent {

  public yearOfBirth: number;

  constructor(private downloadService: DownloadService) {
    this.initializeValues();
  }

  initializeValues() {
    this.yearOfBirth = (new Date()).getUTCFullYear();
  }

  download() {
    this.generateReport();
  }

  private generateReport() {
    this.downloadService.doAnimalFeaturesPerYearOfBirthReportGetRequest(this.yearOfBirth.toString());
  }
}
