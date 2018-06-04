import {GoogleChartsBaseService} from './googlechartsbase.service';
import {GoogleChartConfigModel} from '../../models/google.chart.config.model';

declare var google: any;

export class GoogleLineChartService extends GoogleChartsBaseService {

    constructor() { super(); }

    public buildLineChart(elementId: string, data: any[], config: GoogleChartConfigModel): void {
        const chartFunc = () => new google.visualization.LineChart(document.getElementById(elementId));
        const options = config.config;

        this.buildChart(data, chartFunc, options);
    }
}
