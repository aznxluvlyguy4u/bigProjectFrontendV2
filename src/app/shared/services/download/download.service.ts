import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {DownloadRequest} from './download-request.model';
import {NSFOService} from '../nsfo-api/nsfo.service';
import {
  API_URI_GET_FERTILIZER_ACCOUNTING_REPORT,
  API_URI_GET_INBREEDING_COEFFICIENT,
  API_URI_GET_LINEAGE_PROOF,
  API_URI_GET_LIVESTOCK_DOCUMENT,
  API_URI_GET_OFFSPRING_REPORT,
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
import {ReportService} from '../report/report.service';

export const INBREEDING_COEFFICIENT_REPORT = 'INBREEDING_COEFFICIENT_REPORT';
export const LINEAGE_PROOF_REPORT = 'LINEAGE_PROOF_REPORT';
export const LIVESTOCK_REPORT = 'LIVESTOCK_REPORT';
export const INVOICE_PDF = 'INVOICE_PDF';
export const OFFSPRING_REPORT = 'OFFSPRING';
export const FERTILIZER_ACCOUNTING = 'FERTILIZER ACCOUNTING';

@Injectable()
export class DownloadService {

  isModalActive = new Subject<boolean>();
  toggleIsModalActive = new Subject<boolean>();
  downloadsChanged = new Subject<DownloadRequest[]>();
  downloadsShownInModalChanged = new Subject<DownloadRequest[]>();
  failedDownloadsCount: number;
  private downloadRequests: DownloadRequest[];
  private downloadRequestShownInModal: DownloadRequest[];
  private lastId: number;

  constructor(
      private nsfo: NSFOService,
      private reportService: ReportService,
  ) {
    this.resetDownloadList();
  }

  static generateHash(downloadType: string, fileType: string, reportCount: number | string = 0, jsonBody: any, queryParam: string): string {
    return btoa(downloadType + fileType + reportCount + queryParam + JSON.stringify(jsonBody));
  }

  resetDownloadList() {
    this.downloadRequests = [];
    this.lastId = 0;
    this.notifyDownloadListsChanged();
    this.failedDownloadsCount = 0;
  }

  removeDownloadedAndFailedDownloads() {
    this.downloadRequests = _.filter(this.downloadRequests, function (download: DownloadRequest) {
      return download.isDownloaded || !download.isFailed;
    });
    this.notifyDownloadListsChanged();
  }

  getNewDownloadRequest(downloadType: string, fileType: string, reportCount: number | string = 0, jsonBody: any, queryParam = ''):
  DownloadRequest {
    const hash = DownloadService.generateHash(downloadType, fileType, reportCount, jsonBody, queryParam);

    if (this.isDuplicateDownloadRequest(hash)) {
      return null;
    }

    const download = new DownloadRequest();
    download.id = this.getNextId();
    download.isCompleted = false;
    download.isFailed = false;
    download.downloadType = downloadType;
    download.fileType = fileType;
    download.isDownloaded = false;
    download.logDate = new Date();
    download.reportCount = reportCount;
    download.hash = hash;
    return download;
  }

  getDownloadRequests(): DownloadRequest[] {
    return this.downloadRequests;
  }

  getDownloadRequestsShownInModal(): DownloadRequest[] {
    return this.downloadRequestShownInModal;
  }

  getDownloadsInModalCount(): number {
    return this.downloadRequestShownInModal.length;
  }

  getFailedDownloadCount(): number {
    return this.failedDownloadsCount;
  }

  isModalEmpty(): boolean {
    return this.getDownloadsInModalCount() === 0;
  }

  addDownload(download: DownloadRequest) {
    this.downloadRequests.push(download);
    this.notifyDownloadListsChanged();
  }

  failDownload(download: DownloadRequest, error: any = null) {
    download.isFailed = true;
    if (error !== null) {
      download.errorMessage = this.nsfo.getErrorMessage(error);
    }
    this.updateDownload(download);
    this.openDownloadModal();
  }

  completeDownloadPreparation(download: DownloadRequest) {
    download.isCompleted = true;
    this.updateDownload(download);
    this.openDownloadModal();
  }

  downloadFile(download: DownloadRequest): DownloadRequest {
    download.isDownloaded = true;
    this.updateDownload(download);
    return download;
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

  updateDownloadRequestsShownForModal() {
    this.downloadRequestShownInModal = _.filter(this.downloadRequests, function (download: DownloadRequest) {
      return (!download.isDownloaded) || download.isFailed;
    });
  }

  updateFailedDownloadCount() {
    this.failedDownloadsCount = _.filter(this.downloadRequests, {isFailed: true}).length;
  }

  doLineageProofPostRequest(animals: Animal[], fileType = 'PDF') {

    const request = {
      'animals': animals
    };

    const queryParam = typeof fileType === 'string' ? '?' + QUERY_PARAM_FILE_TYPE + '=' + fileType.toLowerCase() : '';
    this.doDownloadPostRequest(API_URI_GET_LINEAGE_PROOF + queryParam, request);
  }

  doLivestockReportPostRequest(animals: LivestockAnimal[], fileType: string, concatBreedValueAndAccuracyColumns: boolean) {

    let data = {};
    let dataCount = 0;
    if (animals !== null) {
      data = this.parseFilteredLivestockReportPostBody(animals);
      dataCount = animals.length;
    }

    const concatBooleanString = UtilsService.getBooleanAsString(concatBreedValueAndAccuracyColumns);
    let queryParam = '?' + QUERY_PARAM_CONCAT_VALUE_AND_ACCURACY + '=' + concatBooleanString;
    queryParam += typeof fileType === 'string' ? '&' + QUERY_PARAM_FILE_TYPE + '=' + fileType.toLowerCase() : '';
    this.doDownloadPostRequest(API_URI_GET_LIVESTOCK_DOCUMENT + queryParam, data);
  }

  doInbreedingCoefficientReportPostRequest(ram: Animal, ewes: LivestockAnimal[], fileType: string) {

    const request = {
      'ram': {
        'uln_country_code': ram.uln_country_code,
        'uln_number': ram.uln_number
      },
      'ewes': ewes
    };
    this.doDownloadPostRequest(API_URI_GET_INBREEDING_COEFFICIENT + QueryParamsService.getFileTypeQueryParam(fileType), request);
  }

  doOffspringReportPostRequest(animals: Animal[], concatBreedValueAndAccuracyColumns: boolean) {

    const request = {
      parents: NSFOService.cleanAnimalsInput(animals)
    };

    const concatBooleanString = UtilsService.getBooleanAsString(concatBreedValueAndAccuracyColumns);
    const queryParam = '?' + QUERY_PARAM_CONCAT_VALUE_AND_ACCURACY + '=' + concatBooleanString;
    this.doDownloadPostRequest(API_URI_GET_OFFSPRING_REPORT + queryParam, request);
  }

  doFertilizerAccountingReportGetRequest(referenceDateString: string, fileType: string) {

    const queryParam = '?' + QUERY_PARAM_REFERENCE_DATE + '=' + referenceDateString + '&' + QUERY_PARAM_FILE_TYPE + '=' + fileType;
    this.doDownloadGetRequest(API_URI_GET_FERTILIZER_ACCOUNTING_REPORT + queryParam);
  }

  doInvoicePdfGetRequest(invoice: Invoice) {
    const download = this.getNewDownloadRequest(INVOICE_PDF, PDF, 0, null);
    const uri = API_URI_INVOICES + '/' + invoice.id + '/pdf';
    this.doDownloadGetRequest(uri);
  }

  private getNextId(): number {
    this.lastId++;
    return this.lastId;
  }

  private updateDownload(download: DownloadRequest) {
    const index = _.findIndex(this.downloadRequests, {id: download.id});
    this.downloadRequests[index] = download;
    this.notifyDownloadListsChanged();
  }

  private isDuplicateDownloadRequest(hash: string): boolean {
    return _.findIndex(this.downloadRequests,
      {hash: hash, isCompleted: false, isFailed: false}
    ) !== -1;
  }

  private updateModalNotificationStatus(openModal: boolean) {
    this.isModalActive.next(openModal);
  }

  private notifyDownloadListsChanged() {
    this.downloadsChanged.next(this.downloadRequests.slice());
    this.updateDownloadRequestsShownForModal();
    this.updateFailedDownloadCount();
    this.downloadsShownInModalChanged.next(this.downloadRequestShownInModal.slice());
  }

  private doDownloadPostRequest(uri: string, request: any) {

    this.nsfo.doPostRequest(uri, request)
      .subscribe(
          (res: JsonResponseModel) => {
          this.reportService.fetchReports();
          },
        error => {
          alert(this.nsfo.getErrorMessage(error));
        }
      );
  }

  private doDownloadGetRequest(uri: string) {
    this.nsfo.doGetRequest(uri)
      .subscribe(
          (res: JsonResponseModel) => {
              this.reportService.fetchReports();
          },
        error => {
          alert(this.nsfo.getErrorMessage(error));
        }
      );
  }

  private parseFilteredLivestockReportPostBody(animals: Animal[]) {
    const content: any[] = [];
    for (const animal of animals) {
      content.push({
        uln_country_code: animal.uln_country_code,
        uln_number: animal.uln_number,
      });
    }
    return {animals: content};
  }
}
