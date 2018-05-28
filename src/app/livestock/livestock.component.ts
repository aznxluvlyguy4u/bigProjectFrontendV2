import {Component} from '@angular/core';

import {Router} from '@angular/router/router';
import {LivestockOverviewComponent} from '../shared/components/livestock/overview.component';

@Component({
  directives: [LivestockOverviewComponent],
  templateUrl: './livestock.component.html',
})

export class LivestockComponent {
  constructor(private router: Router) {
    router.navigate(['/main/livestock/overview']);
  }

  isActiveRoute(instruction: any[]): boolean {
    return this.router.isRouteActive(this.router.generate(instruction));
  }
}
