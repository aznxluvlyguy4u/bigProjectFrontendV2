import {Component, AfterViewInit } from '@angular/core';
import {ActivatedRoute} from '@angular/router';

import {ReportService} from '../../shared/services/report/report.service';
import {ReportModalComponent} from '../../shared/components/reportmodal/report-modal.component';

@Component({
  templateUrl: './download-landing-page.component.html',
})

export class DownloadLandingPageComponent {

  constructor(private route: ActivatedRoute, private reportService: ReportService) {}

  ngAfterViewInit() {
    this.route.params
      .subscribe(
        params => {
          const encodedUrl = params['encodedUrl'];
          const url = ReportModalComponent.decodeUri(encodedUrl);
          window.location.replace(url);
        }
      );
  }

}
