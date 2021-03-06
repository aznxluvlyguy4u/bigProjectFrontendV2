import {Component, OnDestroy, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';

import {API_URI_GET_LOSS_ERRORS} from '../../shared/services/nsfo-api/nsfo.settings';
import {LossErrorResponse} from './loss.model';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {JsonResponseModel} from '../../shared/models/json-response.model';
import {POLLING_INTERVAL_DECLARE_ERRORS_SECONDS} from '../../shared/variables/timeout.constant';

@Component({
  templateUrl: './loss.component.html',
})

export class LossComponent implements OnInit, OnDestroy {
  cleanUpComponent = false;
  loopGetLossErrorList = true;
  public errorAmount = 0;
  public selectedRoute: string;

  constructor(private apiService: NSFOService, private router: Router, private location: Location) {
  }

  ngOnInit() {
    if (this.location.path() === '/main/loss') {
      this.selectedRoute = '/main/loss/declare';
      this.router.navigate(['/main/loss/declare']);
    }
    this.getLossErrorList();
  }

  ngOnDestroy() {
    this.cleanUpComponent = true;
  }

  public getLossErrorList() {
    this.apiService
      .doGetRequest(API_URI_GET_LOSS_ERRORS)
      .subscribe((res: JsonResponseModel) => {
          const errorList = [];
          const losses = <LossErrorResponse[]> res.result;

          for (const loss of losses) {
            if (!loss.is_removed_by_user) {
              errorList.push(loss);
            }
          }

          this.errorAmount = errorList.length;
        },
        error => {
          this.loopGetLossErrorList = false;
          // DO NOT LOGOUT HERE TO PREVENT THE RISK OF BEING LOGGED OUT, WHILE TRYING TO LOGIN AGAIN
        });
    setTimeout(() => {
      if (!this.cleanUpComponent && this.loopGetLossErrorList) {
        this.getLossErrorList();
      }
    }, POLLING_INTERVAL_DECLARE_ERRORS_SECONDS * 1000);
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
