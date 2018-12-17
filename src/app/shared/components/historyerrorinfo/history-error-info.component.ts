import {Component, Input} from '@angular/core';
import {TranslatePipe, TranslateService} from '@ngx-translate/core';
import {HistoryResponseModel} from './history-response.model';

@Component({
  selector: 'app-history-error-info',
  templateUrl: './history-error-info.component.html',

})
export class HistoryErrorInfoComponent {
  @Input() historyResponse: HistoryResponseModel = null;

  constructor(private translateService: TranslateService) {
  }

  showErrorInfo(): boolean {
    return this.historyResponse !== null && this.historyResponse !== undefined
      && this.historyResponse.request_state !== null && this.historyResponse.request_state !== undefined
      && this.historyResponse.error_code !== null && this.historyResponse.error_code !== undefined
      && this.historyResponse.error_message !== null && this.historyResponse.error_message !== undefined;
  }

  getErrorData(): string {
    if (!this.showErrorInfo()) {
      return '';
    }

    return this.translateService.instant('SUCCESSFULLY PROCESSED BY RVO, BUT WITH WARNING') +
      '. Foutcode ' + this.historyResponse.error_code + ': ' + this.historyResponse.error_message;
  }
}
