import {BrowserModule} from '@angular/platform-browser';
import {NgModule} from '@angular/core';

import {AppComponent} from './app.component';
import {HttpClient, HttpClientModule} from '@angular/common/http';
import {UtilsService} from './shared/services/utils/utils.services';
import {QueryParamsService} from './shared/services/utils/query-params.service';
import {NSFOService} from './shared/services/nsfo-api/nsfo.service';
import {NSFOAuthService} from './shared/services/nsfo-api/nsfo.auth';
import {NSFOAdminAuthService} from './shared/services/nsfo-api/nsfo-admin.auth';
import {DownloadService} from './shared/services/download/download.service';
import {DeclareManagerService} from './shared/services/declaremanager/declare-manager.service';
import {SettingsService} from './shared/services/settings/settings.service';
import {Settings} from './shared/variables/settings';
import {Constants} from './shared/variables/constants';
import {TranslateLoader, TranslateModule, TranslatePipe} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {NgxPaginationModule} from 'ngx-pagination';
import {AppRoutingModule} from './app-routing.module';
import {lastFiveMessagesFilterPipe} from './shared/pipes/lastFiveMessagesFilter';
import {localNumberFormat} from './shared/pipes/localNumberFormat';
import {DatePipe, DecimalPipe} from '@angular/common';
import {invoiceFilterPipe} from './invoices/pipes/invoiceFilter.pipe';
import {LivestockFilterPipe} from './shared/components/livestock/pipes/livestockFilter';
import {LivestockOrderBy} from './shared/components/livestock/pipes/livestockSort';
import {SelectorFilterPipe} from './shared/components/selector/pipes/selectorFilter';
import {LivesearchFilterPipe} from './shared/components/livesearch/pipes/livesearchFilter';
import {HiddenMessagesFilterPipe} from './shared/pipes/hiddenMessagesFilter';
import {LossHistoryFilterPipe} from './rvo-declares/loss/history/pipes/lossHistoryFilter';
import {BirthHistoryPipe} from './rvo-declares/birth/history/pipes/birth.history.pipe';
import {DepartHistoryFilterPipe} from './rvo-declares/depart/history/pipes/departHistoryFilter';
import {EartagFilterPipe} from './rvo-declares/eartag/declare/pipes/eartagFilter';
import {EartagHistoryFilterPipe} from './rvo-declares/eartag/history/pipes/eartagHistoryFilter';
import {ArrivalHistoryFilterPipe} from './rvo-declares/arrival/history/pipes/arrivalHistoryFilter';
import {TagReplacementHistoryFilterPipe} from './rvo-declares/tagReplacement/history/pipes/TagReplacementHistoryFilter';
import {MateHistoryPipe} from './nsfo-declares/mate/history/pipes/mate.history.pipe';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
    lastFiveMessagesFilterPipe,
    localNumberFormat,
    DecimalPipe,
    invoiceFilterPipe,
    TranslatePipe,
    LivestockFilterPipe,
    LivestockOrderBy,
    DatePipe,
    SelectorFilterPipe,
    LivesearchFilterPipe,
    HiddenMessagesFilterPipe,
    LossHistoryFilterPipe,
    BirthHistoryPipe,
    DepartHistoryFilterPipe,
    EartagFilterPipe,
    EartagHistoryFilterPipe,
    ArrivalHistoryFilterPipe,
    TagReplacementHistoryFilterPipe,
    MateHistoryPipe,
  ],
  imports: [
    BrowserModule,
    HttpClientModule,
    AppRoutingModule,
    NgxPaginationModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: HttpLoaderFactory,
        deps: [HttpClient]
      }
    })
  ],
  providers: [
    UtilsService,
    QueryParamsService,
    NSFOService,
    NSFOAuthService,
    NSFOAdminAuthService,
    DownloadService,
    DeclareManagerService,
    SettingsService,
    Settings,
    Constants,
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
