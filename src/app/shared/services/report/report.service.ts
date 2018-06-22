import {Injectable, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {NSFOService} from '../nsfo-api/nsfo.service';
import { API_URI_GET_REPORTS } from '../nsfo-api/nsfo.settings';

import * as _ from 'lodash';
import {JsonResponseModel} from '../../models/json-response.model';
import {ReportRequest} from './report-request.model';

@Injectable()
export class ReportService implements OnInit {

  isModalActive = new Subject<boolean>();
  toggleIsModalActive = new Subject<boolean>();
  reportsShownInModelChanged = new Subject<ReportRequest[]>();
  failedReportsCount: number;
  private reportRequestShownInModal: ReportRequest[];

  constructor(private nsfo: NSFOService) {
      this.resetReportList();
      this.fetchReports();
  }

  ngOnInit() {
  }

  fetchReports() {
    this.nsfo.doGetRequest(API_URI_GET_REPORTS).subscribe((res: JsonResponseModel) => {
        this.resetReportList();
        const reportRequest: ReportRequest[] = res.result;
        reportRequest.forEach((report) => {
            this.reportRequestShownInModal.push(report);
        });
        this.reportsShownInModelChanged.next(this.reportRequestShownInModal.slice());

        const hasUnfinished = _.filter(this.reportRequestShownInModal, function (download: ReportRequest) {
            return (!download.finished_at);
        });
        if (hasUnfinished.length > 0) {
            setTimeout(() => {
                this.fetchReports();
            }, 2000);
        }
    });
  }

  resetReportList() {
    this.reportRequestShownInModal = [];
    this.failedReportsCount = 0;
  }

  getReportRequestsShownInModal(): ReportRequest[] {
    return this.reportRequestShownInModal;
  }

  getReportsInModalCount(): number {
    return this.reportRequestShownInModal.length;
  }

  isModalEmpty(): boolean {
    return this.getReportsInModalCount() === 0;
  }

  public openReportModal() {
    this.updateModalNotificationStatus(true);
  }

  public closeReportModal() {
    this.updateModalNotificationStatus(false);
  }

  public toggleReportModal() {
    this.toggleIsModalActive.next(true);
  }

  private updateModalNotificationStatus(openModal: boolean) {
    this.isModalActive.next(openModal);
  }
}
