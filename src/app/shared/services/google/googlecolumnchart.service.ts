import {GoogleChartsBaseService} from './googlechartsbase.service';
import {GoogleChartConfigModel} from '../../models/google.chart.config.model';

declare var google: any;

export class GoogleColumnChartService extends GoogleChartsBaseService {

    constructor() { super(); }

    public buildColumnChart(elementId: string, data: any[], config: GoogleChartConfigModel): void {
        const chartFunc = () => new google.visualization.ColumnChart(document.getElementById(elementId));
        const options = config.config;

        this.buildChart(data, chartFunc, options);
    }
}
