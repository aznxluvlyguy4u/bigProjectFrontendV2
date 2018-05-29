import {Component} from '@angular/core';

import {Router} from '@angular/router';
import {LivestockOverviewComponent} from '../shared/components/livestock/overview.component';

@Component({
  templateUrl: './invoice.component.html'
})

export class InvoiceComponent {
  constructor(private router: Router) {
    router.navigate(['/main/invoices/overview']);
  }
}
