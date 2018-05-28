import {Component} from '@angular/core';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';


@Component({
  template: require('./report.livestock.html'),

})

export class ReportLivestockComponent {

  private form: FormGroup;

  constructor(private fb: FormBuilder) {
    this.form = fb.group({
      format: new FormControl('PDF'),
      report_type: new FormControl('LIMITED')
    });
  }
}
