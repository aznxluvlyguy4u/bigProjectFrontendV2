import { Component, EventEmitter, OnInit } from '@angular/core';

import { DownloadService } from '../../shared/services/download/download.service';

@Component({
  selector: 'app-weights-per-year-of-birth-report',
  templateUrl: './report.weights-per-year-of-birth.component.html',
})
export class ReportWeightsPerYearOfBirthComponent {

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
    this.downloadService.doWeightsPerYearOfBirthReportGetRequest(this.yearOfBirth.toString());
  }
}
