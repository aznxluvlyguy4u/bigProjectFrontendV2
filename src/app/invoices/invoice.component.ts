import {Component} from '@angular/core';

import {Router} from '@angular/router/router';
import {LivestockOverviewComponent} from '../shared/components/livestock/overview.component';

@Component({
  directives: [LivestockOverviewComponent],
  templateUrl: './invoice.component.html'
})

export class InvoiceComponent {
  constructor(private router: Router) {
    router.navigate(['/main/invoices/overview']);
  }
}
