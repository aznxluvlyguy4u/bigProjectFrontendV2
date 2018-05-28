import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router/router';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
  templateUrl: './mate.component.html',
  
})

export class MateComponent implements OnInit {
  private selectedRoute: string;

  constructor(private router: Router, private location: Location) {
  }

  ngOnInit() {
    if (this.location.path() === '/main/mate') {
      this.selectedRoute = '/main/mate/declare';
      this.router.navigate(['/main/mate/declare']);
    }
  }

  private navigateTo(route: string) {
    this.selectedRoute = route;
    this.router.navigate([route]);
  }

  private selectRoute(event) {
    this.navigateTo(event.target.value);
  }

  private isActiveRoute(route: string) {
    return this.router.serializeUrl(this.router.createUrlTree([])) === this.router.serializeUrl((this.router.createUrlTree([route])));
  }
}
