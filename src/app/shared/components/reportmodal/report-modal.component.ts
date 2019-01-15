import {Component, OnDestroy, OnInit} from '@angular/core';

import {PDF} from '../../variables/file-type.enum';
import {Subscription} from 'rxjs';
import {ReportRequest, ReportType} from '../../services/report/report-request.model';
import {ReportService} from '../../services/report/report.service';
import {TranslateService} from '@ngx-translate/core';
import {PaginationService} from 'ngx-pagination';

@Component({
  selector: 'app-report-modal',
    providers: [PaginationService],
    templateUrl: './report-modal.component.html'
})
export class ReportModalComponent implements OnInit, OnDestroy {
  public reportRequestsShownInModal: ReportRequest[];
  public modalDisplay = 'none';
  private reportRequestSubscription: Subscription;
  private isModalActiveSubscription: Subscription;
  private toggleModalSubscription: Subscription;

  public title = 'REPORT OVERVIEW';
  public items_per_page = 5;

  constructor(
      private translate: TranslateService,
      private reportService: ReportService) {
  }


  ngOnInit() {

    this.reportRequestSubscription = this.reportService.reportsShownInModelChanged.subscribe(
      (downloadRequests: ReportRequest[]) => {
        this.reportRequestsShownInModal = downloadRequests;
        this.closeIfEmpty();
      }
    );
    this.reportRequestsShownInModal = this.reportService.getReportRequestsShownInModal();


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
        case ReportType.LIVE_STOCK:
            return this.translate.instant('REPORT_LIVE_STOCK');
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
      case ReportType.BIRTH_LIST:
        return this.translate.instant('REPORT_BIRTH_LIST');
      case ReportType.MEMBERS_AND_USERS_OVERVIEW:
        return this.translate.instant('REPORT_MEMBERS_AND_USERS_OVERVIEW');
      case ReportType.ANIMAL_HEALTH_STATUSES:
        return this.translate.instant('REPORT_ANIMAL_HEALTH_STATUSES');
      case ReportType.QUICK_VIEW_KPIS:
        return this.translate.instant('REPORT_QUICK_VIEW_KPIS');
      case ReportType.COMPANY_REGISTER:
        return this.translate.instant('REPORT_COMPANY_REGISTER');
      case ReportType.MARKS_PER_ANIMAL_PER_BIRTH_YEAR:
        return this.translate.instant('REPORT_MARKS_PER_ANIMAL_PER_BIRTH_YEAR');
      case ReportType.CLIENT_NOTES_OVERVIEW:
        return this.translate.instant('REPORT_CLIENT_NOTES_OVERVIEW');
      case ReportType.STAR_EWES:
        return this.translate.instant('REPORT_STAR_EWES');
      case ReportType.COMBI_FORMS_VKI_AND_TRANSPORT_DOCUMENTS:
        return this.translate.instant('REPORT_COMBI_FORMS_VKI_AND_TRANSPORT_DOCUMENTS');
      case ReportType.EWE_CARD:
        return this.translate.instant('REPORT_EWE_CARD');
      case ReportType.BLOOD_AND_TISSUE_INVESTIGATIONS:
        return this.translate.instant('REPORT_BLOOD_AND_TISSUE_INVESTIGATIONS');
      case ReportType.I_AND_R:
        return this.translate.instant('REPORT_I_AND_R');
      case ReportType.POPREP_INPUT_FILE:
        return this.translate.instant('REPORT_POPREP_INPUT_FILE');
      case ReportType.REASONS_DEPART_AND_LOSS:
        return this.translate.instant('REPORT_REASONS_DEPART_AND_LOSS');
      case ReportType.WEIGHTS_PER_BIRTH_YEAR:
        return this.translate.instant('REPORT_WEIGHTS_PER_BIRTH_YEAR');
      case ReportType.TREATMENTS:
        return this.translate.instant('REPORT_TREATMENTS');
      case ReportType.MODEL_EXPORT_CERTIFICATE:
        return this.translate.instant('REPORT_MODEL_EXPORT_CERTIFICATE');
      case ReportType.ACTION_LOG:
        return this.translate.instant('REPORT_ACTION_LOG');
        
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

    if (downloadRequest.file_type === PDF) {
      const win = window.open('/loading', '_blank');
      win.location.href = downloadRequest.download_url;
    } else {
      const win = window.open('/downloaded', '_blank');
      win.location.href = downloadRequest.download_url;
    }
  }

  public resetDownloadList() {
    this.reportService.resetReportList();
  }

  public isModalEmpty(): boolean {
    return this.reportService.isModalEmpty();
  }

  public hasFailedDownloads() {
    return this.reportService.failedReportsCount > 0;
  }
}
