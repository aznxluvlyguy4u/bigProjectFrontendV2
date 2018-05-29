import {Component, OnDestroy, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router/router';

import {API_URI_GET_ARRIVALS_ERRORS} from '../../shared/services/nsfo-api/nsfo.settings';
import {ArrivalErrorResponse} from './arrival.model';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';

@Component({
  templateUrl: './arrival.component.html',
})
export class ArrivalComponent implements OnInit, OnDestroy {
  private errorAmount = 0;
  private selectedRoute: string;
  private cleanUpComponent = false;
  private loopGetArrivalErrorList = true;

  constructor(private apiService: NSFOService, private router: Router, private location: Location) {
  }

  ngOnInit() {
    if (this.location.path() === '/main/arrival') {
      this.selectedRoute = '/main/arrival/declare';
      this.router.navigate(['/main/arrival/declare']);
    }
    this.getArrivalErrorList();
  }

  ngOnDestroy() {
    this.cleanUpComponent = true;
  }

  private getArrivalErrorList() {
    this.apiService
      .doGetRequest(API_URI_GET_ARRIVALS_ERRORS)
      .subscribe(
        res => {
          const errorList = [];
          const arrivals = <ArrivalErrorResponse[]> res.result.arrivals;
          for (const arrival of arrivals) {
            if (!arrival.is_removed_by_user) {
              errorList.push(arrival);
            }
          }

          const imports = <ArrivalErrorResponse[]> res.result.imports;
          for (const arrival of imports) {
            if (!arrival.is_removed_by_user) {
              errorList.push(arrival);
            }
          }

          this.errorAmount = errorList.length;
        },
        error => {
          this.loopGetArrivalErrorList = false;
          // DO NOT LOGOUT HERE TO PREVENT THE RISK OF BEING LOGGED OUT, WHILE TRYING TO LOGIN AGAIN
        }
      );
    setTimeout(() => {
      if (!this.cleanUpComponent && this.loopGetArrivalErrorList) {
        this.getArrivalErrorList();
      }
    }, 10 * 1000);
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
