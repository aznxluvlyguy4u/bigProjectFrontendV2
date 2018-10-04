import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';

import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {CacheService} from '../../shared/services/settings/cache.service';

@Component({
  templateUrl: './eartag.component.html',
})

export class EartagComponent implements OnInit {
  public errorAmount = 0;
  public selectedRoute: string;

  constructor(private apiService: NSFOService, private router: Router, private location: Location, private cache: CacheService) {
  }

  ngOnInit() {
    if (this.location.path() === '/main/eartag') {
      this.selectedRoute = '/main/eartag/declare';
      this.router.navigate(['/main/eartag/declare']);
    }
    this.getEartagErrorList();
  }

  public useRvoLogic(): boolean {
    return this.cache.useRvoLogic();
  }

  public getEartagErrorList() {
    // this.apiService
    //     .doGetRequest(API_URI_GET_ARRIVALS_ERRORS)
    //     .subscribe(res => {
    //         let arrivals = <ArrivalErrorResponse[]> res.result.arrivals;
    //         let imports = <ArrivalErrorResponse[]> res.result.imports;
    //         this.errorAmount = arrivals.length + imports.length;
    //     });
    // setTimeout(() => {this.getEartagErrorList()}, 10 * 1000);
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
