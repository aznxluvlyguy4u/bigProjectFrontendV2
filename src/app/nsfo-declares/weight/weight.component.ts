import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router/router';


@Component({
  templateUrl: './weight.component.html',
})

export class WeightComponent implements OnInit {

  constructor(private router: Router, private location: Location) {
  }

  ngOnInit() {
    if (this.location.path() === '/main/weight') {
      this.router.navigate(['/main/weight/declare']);
    }
  }

  private navigateTo(route: string) {
    this.router.navigate([route]);
  }

  private selectRoute(event) {
    this.navigateTo(event.target.value);
  }

  private isActiveRoute(route: string) {
    return this.router.serializeUrl(this.router.createUrlTree([])) === this.router.serializeUrl((this.router.createUrlTree([route])));
  }
}
