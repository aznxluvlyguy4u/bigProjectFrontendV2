import {Component} from '@angular/core';

import {Router} from '@angular/router/router';

@Component({
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
