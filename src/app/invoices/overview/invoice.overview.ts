import * as moment from 'moment';
import {Component, OnDestroy, OnInit} from '@angular/core';

import {Invoice, TwinfieldInvoice} from '../../shared/models/invoice.model';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../shared/services/settings/settings.service';
import {Router} from '@angular/router';
import {API_URI_EXTERNAL_PROVIDER, API_URI_INVOICE_PAYMENT, API_URI_INVOICES} from '../../shared/services/nsfo-api/nsfo.settings';
import {DownloadService} from '../../shared/services/download/download.service';
import {PaginationService} from 'ngx-pagination';
import {JsonResponseModel} from '../../shared/models/json-response.model';
import {POLLING_INTERVAL_INVOICES_SECONDS} from '../../shared/variables/timeout.constant';

@Component({
  providers: [PaginationService],
  templateUrl: './invoice.overview.html',
})

export class InvoiceOverviewComponent implements OnInit, OnDestroy {
  public page = 1;
  public areRecurrentApiCallsActivated: boolean;
  public loopGetInvoicesList = true;
  public invoices: Invoice[] = [];
  public twinfieldInvoices: TwinfieldInvoice = new TwinfieldInvoice;
  public isLoaded = false;
  public status = 'ALL';
  public filterSearch = '';
  public filterAmount = 10;

  constructor(private apiService: NSFOService,
              private settings: SettingsService,
              private router: Router,
              private downloadService: DownloadService
  ) {}

  ngOnInit() {
    this.areRecurrentApiCallsActivated = true;
    this.isLoaded = false;
    this.getTwinfieldInvoicesList();
  }

  ngOnDestroy() {
    this.areRecurrentApiCallsActivated = false;
  }

  public downloadPdf(invoice: Invoice) {
    this.downloadService.doInvoicePdfGetRequest(invoice);
  }

  private getTwinfieldInvoicesList() {
    this.apiService.doGetRequest(API_URI_EXTERNAL_PROVIDER + '/customer-invoices')
      .subscribe(
        (res: JsonResponseModel) => {
          this.twinfieldInvoices = <TwinfieldInvoice> res.result;
          this.isLoaded = true;
        },
        error => {
          this.loopGetInvoicesList = false;
          // DO NOT LOGOUT HERE TO PREVENT THE RISK OF BEING LOGGED OUT, WHILE TRYING TO LOGIN AGAIN
        }
      );

    setTimeout(() => {
      if (this.areRecurrentApiCallsActivated && this.loopGetInvoicesList) {
        this.getTwinfieldInvoicesList();
      }
    }, POLLING_INTERVAL_INVOICES_SECONDS * 1000);
  }

  private calculateDays(date: string) {
    const now = moment();
    const end = moment(date);
    const duration = moment.duration(now.diff(end));
    if (Math.floor(duration.asDays()) === -1) {
      return 0;
    }

    return Math.floor(duration.asDays());
  }

  navigateToInvoiceView(invoiceId: number): void {
    this.router.navigate(['/main/invoices/details', invoiceId]);
  }

  private navigateTo(url: string) {
    this.router.navigate([url]);
  }

  private startInvoicePaymentProcedure(id: number, company_name: string) {
    const invoice: Invoice = new Invoice();
    invoice.id = id;
    invoice.company_name = company_name;
    this.apiService.doPostRequest(API_URI_INVOICE_PAYMENT, invoice)
      .subscribe(
          (res: JsonResponseModel) => {
          window.location.href = res.result['links']['payment_url'];
        }
      );
  }

  /**
   * This function is a temporary function, until it is figured out why the DatePipe won't take the date in as a valid date
   * @param paidDate
   * @returns {string}
   */
  private subStringPaidDate(paidDate: string) {
    return paidDate.substring(0, 10);
  }
}
