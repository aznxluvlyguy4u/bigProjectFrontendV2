import {Component} from '@angular/core';

import {Router} from '@angular/router';
import {LivestockOverviewComponent} from '../shared/components/livestock/overview.component';
import {IS_INVOICES_ACTIVE} from '../shared/variables/feature.activation';

@Component({
  templateUrl: './invoice.component.html'
})

export class InvoiceComponent {
  constructor(private router: Router) {
    if (IS_INVOICES_ACTIVE) {
      router.navigate(['/main/invoices/overview']);
    } else {
      router.navigate(['/main']);
    }
  }
}
