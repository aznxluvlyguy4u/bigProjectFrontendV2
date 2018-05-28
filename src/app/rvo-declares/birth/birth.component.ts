import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router/router';


@Component({
  templateUrl: './birth.component.html',
  
})

export class BirthComponent implements OnInit {
  private selectedRoute: string;

  constructor(private router: Router, private location: Location) {
  }

  ngOnInit() {
    if (this.location.path() === '/main/birth') {
      this.selectedRoute = '/main/birth/declare';
      this.router.navigate(['/main/birth/declare']);
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
