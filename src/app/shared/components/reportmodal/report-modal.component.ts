import {Component, OnDestroy, OnInit} from '@angular/core';

import {PDF} from '../../variables/file-type.enum';
import {Subscription} from 'rxjs';
import {ReportRequest, ReportType} from '../../services/report/report-request.model';
import {ReportService} from '../../services/report/report.service';
import {TranslateService} from '@ngx-translate/core';

@Component({
  selector: 'app-report-modal',
  templateUrl: './report-modal.component.html'
})
export class ReportModalComponent implements OnInit, OnDestroy {
  public reportRequestsShownInModal: ReportRequest[];
  private modalDisplay = 'none';
  private reportRequestSubscription: Subscription;
  private isModalActiveSubscription: Subscription;
  private toggleModalSubscription: Subscription;

  constructor(
      private translate: TranslateService,
      private reportService: ReportService) {
  }


  ngOnInit() {

    this.reportRequestSubscription = this.reportService.downloadsShownInModalChanged.subscribe(
      (downloadRequests: ReportRequest[]) => {
        this.reportRequestsShownInModal = downloadRequests;
        this.closeIfEmpty();
      }
    );
    this.reportRequestsShownInModal = this.reportService.getDownloadRequestsShownInModal();


    this.isModalActiveSubscription = this.reportService.isModalActive.subscribe(
      (notifyUser: boolean) => {
        if (notifyUser) {
          this.openModal();
        } else {
          this.closeModal();
        }
      }
    );


    this.toggleModalSubscription = this.reportService.toggleIsModalActive.subscribe(
      (toggleModal: boolean) => {
        if (toggleModal) {
          this.toggleModal();
        }
      }
    );
  }

  public getReportTypeString(reportType: ReportType) {
    switch (reportType) {
        case ReportType.ANNUAL_ACTIVE_LIVE_STOCK:
          return this.translate.instant('REPORT_ANNUAL_ACTIVE_LIVE_STOCK');
        case ReportType.ANNUAL_TE_100:
          return this.translate.instant('REPORT_ANNUAL_TE_100');
        case ReportType.FERTILIZER_ACCOUNTING:
          return this.translate.instant('REPORT_FERTILIZER_ACCOUNTING');
        case ReportType.INBREEDING_COEFFICIENT:
          return this.translate.instant('REPORT_INBREEDING_COEFFICIENT');
        case ReportType.PEDIGREE_CERTIFICATE:
          return this.translate.instant('REPORT_PEDIGREE_CERTIFICATE');
        case ReportType.ANIMALS_OVERVIEW:
          return this.translate.instant('REPORT_ANIMALS_OVERVIEW');
        case ReportType.ANNUAL_ACTIVE_LIVE_STOCK_RAM_MATES:
          return this.translate.instant('REPORT_ANNUAL_ACTIVE_LIVE_STOCK_RAM_MATES');
        case ReportType.OFF_SPRING:
          return this.translate.instant('REPORT_OFF_SPRING');
        case ReportType.PEDIGREE_REGISTER_OVERVIEW:
          return this.translate.instant('REPORT_PEDIGREE_REGISTER_OVERVIEW');
        default:
          return this.translate.instant('REPORT_UNKNOWN');
    }
  }

  closeIfEmpty() {
    if (this.reportRequestsShownInModal.length === 0) {
      this.closeModal();
    }
  }

  ngOnDestroy() {
    this.reportRequestSubscription.unsubscribe();
    this.isModalActiveSubscription.unsubscribe();
    this.toggleModalSubscription.unsubscribe();
  }

  public openModal() {
    this.modalDisplay = 'block';
  }

  public closeModal() {
    this.modalDisplay = 'none';
  }

  public toggleModal() {
    if (this.modalDisplay === 'none') {
      this.openModal();
    } else {
      this.closeModal();
    }
  }


  public downloadFile(downloadRequest: ReportRequest) {

    if (downloadRequest.report_worker.file_type === PDF) {
      const win = window.open('/loading', '_blank');
      win.location.href = downloadRequest.report_worker.download_url;
    } else {
      const win = window.open('/downloaded', '_blank');
      win.location.href = downloadRequest.report_worker.download_url;
    }
  }

  public resetDownloadList() {
    this.reportService.resetDownloadList();
  }

  public isModalEmpty(): boolean {
    return this.reportService.isModalEmpty();
  }

  public hasFailedDownloads() {
    return this.reportService.failedDownloadsCount > 0;
  }
}
