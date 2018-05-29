import {Component} from '@angular/core';

import {Router} from '@angular/router';

@Component({
  templateUrl: './livestock.component.html',
})

export class LivestockComponent {
  constructor(private router: Router) {
    router.navigate(['/main/livestock/overview']);
  }

  isActiveRoute(instruction: any): boolean {
    return this.router.isActive(instruction, false);
  }
}
