import * as _ from 'lodash';
import {Component, OnInit} from '@angular/core';
import {Location} from '@angular/common';
import {Router} from '@angular/router';
import {REPORT_OPTIONS_LIST} from './report.model';

@Component({
    templateUrl: './report.component.html',
})

export class ReportComponent implements OnInit {

    public report_options_list = REPORT_OPTIONS_LIST;

    constructor(private router: Router, private location: Location) {}

    ngOnInit() {
        this.report_options_list = _.sortBy(this.report_options_list, ['nl_order']);
        if (this.location.path() === '/main/report') {
            this.router.navigate(['/main/report/lineage_proof']);
        }
    }

    public navigateTo(route: string) {
        this.router.navigate([route]);
    }

    public selectRoute(event) {
        this.navigateTo(event.target.value);
    }

    public isActiveRoute(route: string) {
        return this.router.serializeUrl(this.router.createUrlTree([])) === this.router.serializeUrl((this.router.createUrlTree([route])));
    }
}
