import {API_URI_INVOICE_PAYMENT, API_URI_INVOICES} from '../../shared/services/nsfo-api/nsfo.settings';
import {Component, OnInit} from '@angular/core';
import {ActivatedRoute, Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {Invoice} from '../../shared/models/invoice.model';
import {SettingsService} from '../../shared/services/settings/settings.service';
import {DecimalPipe} from '@angular/common';
import {localNumberFormat} from '../../shared/pipes/localNumberFormat';
import {DownloadService} from '../../shared/services/download/download.service';
import {InvoiceSenderDetails} from '../../shared/models/invoice-sender-details.model';

@Component({
  selector: 'app-invoice-details',
  properties: [
    'allowClear',
    'placeholder',
    'items',
    'multiple',
    'showSearchInputInDropdown'
  ],
  templateUrl: './invoice.details.html',
  pipes: [localNumberFormat, DecimalPipe]
})

export class InvoiceDetailsComponent implements OnInit {
  private pageMode: string;
  private id: string;
  private senderDetails: InvoiceSenderDetails = new InvoiceSenderDetails();
  private invoice: Invoice = new Invoice();

  constructor(private apiService: NSFOService, private router: Router, private activatedRoute: ActivatedRoute,
              private settingsService: SettingsService, private downloadService: DownloadService) {
  }

  ngOnInit() {
    this.activatedRoute.params.subscribe(params => {
      this.id = params['id'];
      this.apiService.doGetRequest(API_URI_INVOICES + '/' + this.id)
        .subscribe(
          res => {
            this.invoice = res.result;
            this.senderDetails = res.result.sender_details;
          },
          error => {
            alert(this.apiService.getErrorMessage(error));
            this.router.navigate(['/main/invoices/overview']);
          }
        );
    });
  }

  public downloadPdf() {
    this.downloadService.doInvoicePdfGetRequest(this.invoice);
  }

  private startInvoicePaymentProcedure() {
    this.apiService.doPostRequest(API_URI_INVOICE_PAYMENT, this.invoice)
      .subscribe(
        res => {
          window.location.href = res.result['links']['payment_url'];
        }
      );
  }

  private navigateTo(url: string) {
    this.router.navigate([url]);
  }
}
