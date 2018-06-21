import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';


@Component({
  templateUrl: './tagReplacement.component.html',
})

export class TagReplacementComponent implements OnInit {
  selectedRoute: string;
  errorAmount: number; // TODO get errorAmount from TagReplacementErrorsComponent

  constructor(private router: Router, private location: Location) {}

  ngOnInit() {
    if (this.location.path() === '/main/tag-replacement') {
      this.selectedRoute = '/main/tag-replacement/declare';
      this.router.navigate(['/main/tag-replacement/declare']);
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
