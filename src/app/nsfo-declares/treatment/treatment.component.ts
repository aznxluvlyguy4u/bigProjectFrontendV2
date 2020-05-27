import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';
import {TreatmentService} from './treatment.service';


@Component({
  providers: [TreatmentService],
  templateUrl: './treatment.component.html',
})

export class TreatmentComponent implements OnInit {
  public selectedRoute: string;

  constructor(private router: Router, private location: Location) {
  }

  ngOnInit() {
    if (this.location.path() === '/main/treatment') {
      this.selectedRoute = '/main/treatment/declare';
      this.router.navigate(['/main/treatment/declare']);
    } else {
      this.selectedRoute = this.location.path();
    }
  }

  public navigateTo(route: string) {
    this.selectedRoute = route;
    this.router.navigate([route]);
  }

  public selectRoute(event) {
    this.navigateTo(event.target.value);
  }

  public isActiveRoute(route: string) {
    return this.router.serializeUrl(this.router.createUrlTree([])) === this.router.serializeUrl((this.router.createUrlTree([route])));
  }
}
