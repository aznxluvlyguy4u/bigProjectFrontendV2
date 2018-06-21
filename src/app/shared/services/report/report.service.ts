import {Injectable, OnInit} from '@angular/core';
import {Subject} from 'rxjs';
import {NSFOService} from '../nsfo-api/nsfo.service';
import {
    API_URI_GET_FERTILIZER_ACCOUNTING_REPORT,
    API_URI_GET_INBREEDING_COEFFICIENT,
    API_URI_GET_LINEAGE_PROOF,
    API_URI_GET_LIVESTOCK_DOCUMENT,
    API_URI_GET_OFFSPRING_REPORT, API_URI_GET_REPORTS,
    API_URI_INVOICES
} from '../nsfo-api/nsfo.settings';
import {
  QUERY_PARAM_CONCAT_VALUE_AND_ACCURACY,
  QUERY_PARAM_FILE_TYPE,
  QUERY_PARAM_REFERENCE_DATE
} from '../../variables/query-param.constant';
import {UtilsService} from '../utils/utils.services';
import {QueryParamsService} from '../utils/query-params.service';
import {CSV, PDF} from '../../variables/file-type.enum';
import * as _ from 'lodash';
import {Animal, LivestockAnimal} from '../../models/animal.model';
import {Invoice} from '../../models/invoice.model';
import {JsonResponseModel} from '../../models/json-response.model';
import {ReportRequest} from './report-request.model';
import {DownloadRequest} from '../download/download-request.model';

export const INBREEDING_COEFFICIENT_REPORT = 'INBREEDING_COEFFICIENT_REPORT';
export const LINEAGE_PROOF_REPORT = 'LINEAGE_PROOF_REPORT';
export const LIVESTOCK_REPORT = 'LIVESTOCK_REPORT';
export const INVOICE_PDF = 'INVOICE_PDF';
export const OFFSPRING_REPORT = 'OFFSPRING';
export const FERTILIZER_ACCOUNTING = 'FERTILIZER ACCOUNTING';

@Injectable()
export class ReportService implements OnInit{

  isModalActive = new Subject<boolean>();
  toggleIsModalActive = new Subject<boolean>();
  downloadsShownInModalChanged = new Subject<ReportRequest[]>();
  failedDownloadsCount: number;
  private downloadRequestShownInModal: ReportRequest[];
  private lastId: number;

  constructor(private nsfo: NSFOService) {
      this.fetchReports();
  }

  ngOnInit() {
  }

  fetchReports() {
    this.nsfo.doGetRequest(API_URI_GET_REPORTS).subscribe((res: JsonResponseModel) => {
        this.resetDownloadList();
        const reportRequest: ReportRequest[] = res.result;
        reportRequest.forEach((report) => {
            this.downloadRequestShownInModal.push(report);
        });
    });

    setTimeout(() => {
      this.fetchReports();
    }, 10000);
  }

  resetDownloadList() {
    this.downloadRequestShownInModal = [];
    this.lastId = 0;
    this.failedDownloadsCount = 0;
  }

  getDownloadRequestsShownInModal(): ReportRequest[] {
    return this.downloadRequestShownInModal;
  }

  getDownloadsInModalCount(): number {
    return this.downloadRequestShownInModal.length;
  }

  isModalEmpty(): boolean {
    return this.getDownloadsInModalCount() === 0;
  }

  public openDownloadModal() {
    this.updateModalNotificationStatus(true);
  }

  public closeDownloadModal() {
    this.updateModalNotificationStatus(false);
  }

  public toggleDownloadModal() {
    this.toggleIsModalActive.next(true);
  }

  private updateModalNotificationStatus(openModal: boolean) {
    this.isModalActive.next(openModal);
  }
}
