import _ = require('lodash');
import {Component} from '@angular/core';
import {Location} from '@angular/common';
import {ROUTER_DIRECTIVES} from '@angular/router';
import {Router} from '@angular/router/router';
import {TranslatePipe} from 'ng2-translate/ng2-translate';
import {REPORT_OPTIONS_LIST} from './report.model';

@Component({
    directives: [ROUTER_DIRECTIVES],
    template: require('./report.component.html'),
    
})

export class ReportComponent {

    private report_options_list = REPORT_OPTIONS_LIST;

    constructor(private router: Router, private location: Location) {}

    ngOnInit() {
        this.report_options_list = _.sortBy(this.report_options_list, ['nl_order']);
        if(this.location.path() == '/main/report') {
            this.router.navigate(['/main/report/lineage_proof']);
        }
    }

    private navigateTo(route: string) {
        this.router.navigate([route]);
    }

    private selectRoute(event) {
        this.navigateTo(event.target.value);
    }

    private isActiveRoute(route: string) {
        return this.router.serializeUrl(this.router.urlTree) == this.router.serializeUrl((this.router.createUrlTree([route])));
    }
}
