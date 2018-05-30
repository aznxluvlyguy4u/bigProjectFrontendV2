import {Component} from '@angular/core';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {ActivatedRoute, Router} from '@angular/router';
import {CacheService} from '../../shared/services/settings/cache.service';

@Component({
  template: '',
})
export class GhostLoginComponent {

  constructor(private apiService: NSFOService, private router: Router, private route: ActivatedRoute, private cache: CacheService) {
    this.route.params
      .subscribe(params => {
        const ghostToken = params.ghostToken;
        const accessToken = params.accessToken;
        this.cache.setAccessToken(accessToken);
        this.cache.setGhostToken(ghostToken);

        this.apiService
          .doGhostLoginVerification()
          .subscribe(res => this.router.navigate(['/main']));
      });
  }
}
