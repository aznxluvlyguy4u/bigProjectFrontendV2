import {Component} from '@angular/core';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {ActivatedRoute, Router} from '@angular/router';
import {ACCESS_TOKEN_NAMESPACE, GHOST_TOKEN_NAMESPACE} from '../../shared/services/nsfo-api/nsfo.settings';

@Component({
  template: '',
})
export class GhostLoginComponent {

  constructor(private apiService: NSFOService, private router: Router, private route: ActivatedRoute) {
    this.route.params
      .subscribe(params => {
        const ghostToken = params.ghostToken;
        const accessToken = params.accessToken;
        localStorage.setItem(ACCESS_TOKEN_NAMESPACE, accessToken);
        sessionStorage.setItem(GHOST_TOKEN_NAMESPACE, ghostToken);

        this.apiService
          .doGhostLoginVerification()
          .subscribe(res => this.router.navigate(['/main']));
      });
  }
}
