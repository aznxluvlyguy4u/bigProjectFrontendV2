import {AfterViewInit, Component, HostListener, Input, OnChanges, OnInit} from '@angular/core';
import {GoogleColumnChartService} from '../../services/google/googlecolumnchart.service';
import {GoogleLineChartService} from '../../services/google/googlelinechart.service';
import {GoogleChartConfigModel} from '../../models/google.chart.config.model';

declare var google: any;


@Component({
    selector: 'app-line-component',
    templateUrl: './bar.component.html'
})
export class LineComponent implements AfterViewInit, OnChanges {

    @Input() data: any[];
    @Input() config: GoogleChartConfigModel;
    @Input() elementId: string;

    constructor(private _lineChartService: GoogleLineChartService) {}

    ngOnChanges(changes) {
        if (changes.data !== undefined) {
            this.data = changes.data.currentValue;
            this._lineChartService.buildLineChart(this.elementId, this.data, this.config);
        }
    }

    ngAfterViewInit (): void {
        // this._columnChartService.buildColumnChart(this.elementId, this.data, this.config);
    }

    @HostListener('window:resize', ['$event'])
    onResize(event) {
        setTimeout(() => {
            this._lineChartService.buildLineChart(this.elementId, this.data, this.config);
        }, 2000);
    }
}
