import {Component} from '@angular/core';
import {Router} from '@angular/router';


@Component({
  templateUrl: './profile.component.html',
})

export class ProfileComponent {
  private selectedRoute: string;

  navLinks: {label: string, path: string}[] = [
    {
      label: 'COMPANY INFO',
      path: '/main/profile/company',
    },
    {
      label: 'LOGIN INFO',
      path: '/main/profile/login',
    },
    {
      label: 'EMAIL INFO',
      path: '/main/profile/email',
    }
  ];

  constructor(private router: Router) {
    this.selectedRoute = '/main/profile/company';
    router.navigate(['/main/profile/company']);
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
