import { Component, EventEmitter, OnInit } from '@angular/core';
import { DownloadService } from '../../shared/services/download/download.service';
import { CSV, PDF } from '../../shared/variables/file-type.enum';


import { SettingsService } from '../../shared/services/settings/settings.service';


@Component({
  selector: 'app-fertilizer-accounting-report',
  templateUrl: './report.fertilizer-accounting.component.html',
})
export class ReportFertilizerAccountingComponent implements OnInit {
  selectedFileType: string;
  referenceDateString: string;
  initialValuesChanged = new EventEmitter<boolean>();

  private maxWarningDate = new Date('2021-07-01 00:00:00');

  constructor(private downloadService: DownloadService, public settings: SettingsService) {}

  ngOnInit() {
    this.selectedFileType = this.getFileTypesList()[0];
    this.referenceDateString = SettingsService.getDateString_YYYY_MM_DD_fromDate();
  }

  displayWarningText(): boolean {
    return (new Date(this.referenceDateString)) < this.maxWarningDate;
  }

  updateReferenceDateString(referenceDateString: string) {
    this.referenceDateString = SettingsService.getDateString_YYYY_MM_DD_fromDate(new Date(referenceDateString));
  }

  notifyInputValues() {
    this.initialValuesChanged.emit(true);
  }

  downloadReport() {
    this.notifyInputValues();
    this.downloadService.doFertilizerAccountingReportGetRequest(this.referenceDateString, this.selectedFileType);
  }

  public getFileTypesList(): string[] {
    return [PDF, CSV];
  }
}
