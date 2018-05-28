import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';

@Injectable()
export class NSFOAdminAuthService implements CanActivate {

  constructor(private router: Router) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (!!localStorage.getItem('access_token') && !!sessionStorage.getItem('ghost_token')) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
