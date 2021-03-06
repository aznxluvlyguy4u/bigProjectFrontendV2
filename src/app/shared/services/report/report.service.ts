import {Injectable, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {NSFOService} from '../nsfo-api/nsfo.service';
import { API_URI_GET_REPORTS } from '../nsfo-api/nsfo.settings';

import * as _ from 'lodash';
import {JsonResponseModel} from '../../models/json-response.model';
import {ReportRequest, ReportType} from './report-request.model';
import * as moment from 'moment';
import {SettingsService} from '../settings/settings.service';

@Injectable()
export class ReportService implements OnInit {

  isModalActive = new Subject<boolean>();
  toggleIsModalActive = new Subject<boolean>();
  reportsShownInModelChanged = new Subject<ReportRequest[]>();
  failedReportsCount: number;
  private reportRequestShownInModal: ReportRequest[];

  private isFirstFetch = true;

  constructor(
    private nsfo: NSFOService,
    private settings: SettingsService
  ) {
      this.resetReportList();
      this.fetchReports();
  }

  ngOnInit() {
  }

  addPlaceHolderReportRecord(reportType: ReportType, fileType: string) {
    const report = new ReportRequest();
    report.id = 99999;
    report.started_at = (new Date()).toLocaleString();
    report.worker_type = 1;
    report.report_type = reportType;
    report.file_type = fileType.toLocaleLowerCase();
    this.reportRequestShownInModal.push(report);
    this.reportsShownInModelChanged.next(this.reportRequestShownInModal.slice());
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
        } else {
            if (this.reportRequestShownInModal.length > 0 && !this.isFirstFetch) {
                this.updateModalNotificationStatus(true);
            }
        }
        this.isFirstFetch = false;
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
