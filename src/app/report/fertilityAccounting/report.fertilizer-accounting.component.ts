import { Component, EventEmitter, OnInit } from '@angular/core';
import { DownloadService } from '../../shared/services/download/download.service';
import { CSV, PDF } from '../../shared/variables/file-type.enum';
import { FileTypeDropdownComponent } from '../../shared/components/filetypedropdown/file-type-dropdown.component';
import { DatepickerV2Component } from '../../shared/components/datepickerV2/datepicker-v2.component';
import { SettingsService } from '../../shared/services/settings/settings.service';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  selector: 'app-fertilizer-accounting-report',
  template: require('./report.fertilizer-accounting.component.html'),
  directives: [DatepickerV2Component, FileTypeDropdownComponent],

})
export class ReportFertilizerAccountingComponent implements OnInit {
  selectedFileType: string;
  referenceDateString: string;
  initialValuesChanged = new EventEmitter<boolean>();

  constructor(private downloadService: DownloadService, private settings: SettingsService) {}

  ngOnInit() {
    this.selectedFileType = this.getFileTypesList()[0];
    this.referenceDateString = SettingsService.getDateString_YYYY_MM_DD_fromDate();
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
