import {Injectable} from '@angular/core';
import {ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot} from '@angular/router';
import {CacheService} from '../settings/cache.service';

@Injectable()
export class NSFOAuthService implements CanActivate {

  constructor(private router: Router, private cache: CacheService) {
  }

  canActivate(next: ActivatedRouteSnapshot, state: RouterStateSnapshot) {

    console.log('CAN ACTIVATE NSFO AUTH SERVICE');

    if (!!this.cache.getAccessToken()) {
      console.log('CAN ACTIVATE NSFO AUTH SERVICE: VALID');
      return true;
    }

    this.router.navigate(['/login']);
    return false;
  }
}
