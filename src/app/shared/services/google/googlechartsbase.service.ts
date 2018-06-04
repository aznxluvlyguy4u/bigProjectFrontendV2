declare var google: any;

export class GoogleChartsBaseService {
    constructor() {
        google.charts.load('current', {packages: ['corechart']});
    }

    protected buildChart(data: any[], chartFunc: any, options: any): void {
        const func = (chartFunction, chartOptions) => {
            const datatable = google.visualization.arrayToDataTable(data);
            chartFunction().draw(datatable, chartOptions);
        };
        const callback = () => func(chartFunc, options);
        google.charts.setOnLoadCallback(callback);
    }
}
