import moment = require('moment');
import {Component, OnDestroy, OnInit} from '@angular/core';

import {PaginationComponent} from '../../shared/components/pagination/pagination.component';
import {TranslatePipe} from '@ngx-translate/core';
import {Invoice} from '../../shared/models/invoice.model';
import {invoiceFilterPipe} from '../pipes/invoiceFilter.pipe';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../shared/services/settings/settings.service';
import {Router} from '@angular/router';
import {API_URI_INVOICE_PAYMENT, API_URI_INVOICES} from '../../shared/services/nsfo-api/nsfo.settings';
import {DownloadService} from '../../shared/services/download/download.service';
import {NgxPaginationModule} from 'ngx-pagination';

@Component({
  providers: [NgxPaginationModule],
  directives: [PaginationComponent],
  templateUrl: './invoice.overview.html',
  pipes: [invoiceFilterPipe]
})

export class InvoiceOverviewComponent implements OnInit, OnDestroy {
  areRecurrentApiCallsActivated: boolean;
  loopGetInvoicesList = true;
  private invoices: Invoice[] = [];
  private isLoaded = false;
  private status = 'ALL';
  private filterSearch = '';
  private filterAmount = 10;

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
        res => {
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
        res => {
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
