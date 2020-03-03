import { Component } from '@angular/core';

import { DownloadService } from '../../shared/services/download/download.service';
import { Settings } from '../../shared/variables/settings';
import {FormBuilder, FormControl, FormGroup, Validators} from '@angular/forms';
import {DateValidator} from '../../shared/validation/nsfo-validation';
import {CSV, PDF} from '../../shared/variables/file-type.enum';

@Component({
  selector: 'app-company-register-report',
  templateUrl: './report.company-register.component.html',
})
export class ReportCompanyRegisterComponent {

  public view_date_format;
  public form: FormGroup;
  public defaultFileType: string = CSV;

  constructor(
    private downloadService: DownloadService,
    private settings: Settings,
    private fb: FormBuilder
  ) {
    this.view_date_format = settings.VIEW_DATE_FORMAT;
    this.form = fb.group({
      sample_date: new FormControl('', Validators.compose([Validators.required, DateValidator.validateDateFormat])),
      selected_file_type: new FormControl(this.defaultFileType, Validators.compose([Validators.required]))
    });
  }

  public getFileTypesList(): string[] {
    return [ CSV, PDF ];
  }

  download() {
    this.generateReport();
  }

  private generateReport() {
    this.downloadService.doCompanyRegisterReportGetRequest(this.form.value['sample_date'], this.form.value['selected_file_type']);
  }
}
