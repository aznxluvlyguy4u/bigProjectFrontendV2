import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {CacheService} from '../settings/cache.service';

@Injectable()
export class NSFOAdminAuthService implements CanActivate {

  constructor(private router: Router, private cache: CacheService) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {
    if (!!this.cache.getAccessToken() && !!this.cache.getGhostToken()) {
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
