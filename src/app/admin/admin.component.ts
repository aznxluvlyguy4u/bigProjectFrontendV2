import { Component, OnInit } from '@angular/core';
import {Router} from '@angular/router';
import {TranslatePipe} from '@ngx-translate/core';

@Component({
    template: require('./admin.component.html')
})

export class AdminComponent {
    private selectedRoute: string;

    constructor(private router: Router) {
        this.selectedRoute = '/main/admin/rvo-leading-livestock-sync';
        router.navigate(['/main/admin/rvo-leading-livestock-sync']);
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
