import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';
import {IS_CSV_IMPORT_BIRTHS_ACTIVE} from '../../shared/variables/feature.activation';


@Component({
  templateUrl: './birth.component.html',
})

export class BirthComponent implements OnInit {
  public selectedRoute: string;
  public isCsvImportActive = IS_CSV_IMPORT_BIRTHS_ACTIVE;

  constructor(private router: Router, private location: Location) {
  }

  ngOnInit() {
    if (this.location.path() === '/main/birth') {
      this.selectedRoute = '/main/birth/declare';
      this.router.navigate(['/main/birth/declare']);
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
