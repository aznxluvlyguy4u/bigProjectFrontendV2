import {Component, OnDestroy, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';

import {DepartErrorResponse} from './depart.model';
import {API_URI_GET_DEPARTS_ERRORS} from '../../shared/services/nsfo-api/nsfo.settings';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';

@Component({
  templateUrl: './depart.component.html',

})

export class DepartComponent implements OnInit, OnDestroy {
  private errorAmount = 0;
  private selectedRoute: string;
  private cleanUpComponent = false;
  private loopGetDepartErrorList = true;

  constructor(private apiService: NSFOService, private router: Router, private location: Location) {
  }

  ngOnInit() {
    if (this.location.path() === '/main/depart') {
      this.selectedRoute = '/main/depart/declare';
      this.router.navigate(['/main/depart/declare']);
    }
    this.getDepartErrorList();
  }

  ngOnDestroy() {
    this.cleanUpComponent = true;
  }

  private getDepartErrorList() {
    this.apiService
      .doGetRequest(API_URI_GET_DEPARTS_ERRORS)
      .subscribe(res => {
          const errorList = [];
          const departs = <DepartErrorResponse[]> res.json().result.departs;
          for (const depart of departs) {
            if (!depart.is_removed_by_user) {
              errorList.push(depart);
            }
          }

          const exports = <DepartErrorResponse[]> res.json().result.exports;
          for (const depart of exports) {
            if (!depart.is_removed_by_user) {
              errorList.push(depart);
            }
          }

          this.errorAmount = errorList.length;
        },
        error => {
          this.loopGetDepartErrorList = false;
          // DO NOT LOGOUT HERE TO PREVENT THE RISK OF BEING LOGGED OUT, WHILE TRYING TO LOGIN AGAIN
        });

    setTimeout(() => {
      if (!this.cleanUpComponent && this.loopGetDepartErrorList) {
        this.getDepartErrorList();
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
