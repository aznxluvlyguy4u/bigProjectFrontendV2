import * as moment from 'moment';
import {Component, OnDestroy, OnInit} from '@angular/core';

import {Invoice} from '../../shared/models/invoice.model';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../shared/services/settings/settings.service';
import {Router} from '@angular/router';
import {API_URI_INVOICE_PAYMENT, API_URI_INVOICES} from '../../shared/services/nsfo-api/nsfo.settings';
import {DownloadService} from '../../shared/services/download/download.service';
import {NgxPaginationModule} from 'ngx-pagination';
import {JsonResponseModel} from '../../shared/models/json-response.model';

@Component({
  providers: [NgxPaginationModule],
  templateUrl: './invoice.overview.html',
})

export class InvoiceOverviewComponent implements OnInit, OnDestroy {
  public page = 1;
  public areRecurrentApiCallsActivated: boolean;
  public loopGetInvoicesList = true;
  public invoices: Invoice[] = [];
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
    this.getInvoicesList();
  }

  ngOnDestroy() {
    this.areRecurrentApiCallsActivated = false;
  }

  public downloadPdf(invoice: Invoice) {
    this.downloadService.doInvoicePdfGetRequest(invoice);
  }

  private getInvoicesList() {
    this.apiService.doGetRequest(API_URI_INVOICES)
      .subscribe(
          (res: JsonResponseModel) => {
          this.invoices = <Invoice[]> res.result;
          this.isLoaded = true;
        },
        error => {
          this.loopGetInvoicesList = false;
          // DO NOT LOGOUT HERE TO PREVENT THE RISK OF BEING LOGGED OUT, WHILE TRYING TO LOGIN AGAIN
        }
      );

    setTimeout(() => {
      if (this.areRecurrentApiCallsActivated && this.loopGetInvoicesList) {
        this.getInvoicesList();
      }
    }, 10 * 1000);
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
