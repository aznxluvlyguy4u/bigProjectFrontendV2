import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';

import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';

@Component({
  templateUrl: './eartag.component.html',
})

export class EartagComponent implements OnInit {
  private errorAmount = 0;
  private selectedRoute: string;

  constructor(private apiService: NSFOService, private router: Router, private location: Location) {
  }

  ngOnInit() {
    if (this.location.path() === '/main/eartag') {
      this.selectedRoute = '/main/eartag/declare';
      this.router.navigate(['/main/eartag/declare']);
    }
    this.getEartagErrorList();
  }

  private getEartagErrorList() {
    // this.apiService
    //     .doGetRequest(API_URI_GET_ARRIVALS_ERRORS)
    //     .subscribe(res => {
    //         let arrivals = <ArrivalErrorResponse[]> res.result.arrivals;
    //         let imports = <ArrivalErrorResponse[]> res.result.imports;
    //         this.errorAmount = arrivals.length + imports.length;
    //     });
    // setTimeout(() => {this.getEartagErrorList()}, 10 * 1000);
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
