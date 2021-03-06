import { Component } from '@angular/core';
import {Router} from '@angular/router';

@Component({
    templateUrl: './admin.component.html',
})

export class AdminComponent {
    public selectedRoute: string;

    constructor(private router: Router) {
        this.selectedRoute = '/main/admin/rvo-leading-livestock-sync';
        router.navigate(['/main/admin/rvo-leading-livestock-sync']);
    }

    public navigateTo(route: string) {
        this.selectedRoute = route;
        this.router.navigate([route]);
    }

    public selectRoute(event) {
        this.selectedRoute = event.target.value;
        this.navigateTo(event.target.value);
    }

    public isActiveRoute(route: string) {
        return this.router.serializeUrl(this.router.createUrlTree([])) === this.router.serializeUrl((this.router.createUrlTree([route])));
    }
}
