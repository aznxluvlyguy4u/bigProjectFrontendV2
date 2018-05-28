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
import {InvoiceFilterPipe} from './invoices/pipes/invoiceFilter.pipe';
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
import {RvoLeadingLivestockSyncComponent} from './admin/rvo-leading-livestock-sync/rvo-leading-livestock-sync.component';
import {AdminComponent} from './admin/admin.component';
import {GhostLoginComponent} from './auth/ghostlogin/ghostlogin.component';
import {LoginComponent} from './auth/login/login.component';
import {DashboardComponent} from './core/dashboard/dashboard.component';
import {MainComponent} from './core/home/home.component';
import {InvoiceDetailsComponent} from './invoices/details/invoice.details';
import {InvoiceOverviewComponent} from './invoices/overview/invoice.overview';
import {InvoiceComponent} from './invoices/invoice.component';
import {LivestockOverviewComponent} from './shared/components/livestock/overview.component';
import {LivestockDetailComponent} from './livestock/details/details.component';
import {Datepicker} from './shared/components/datepicker/datepicker.component';
import {ExteriorComponent} from './livestock/details/exterior/exterior.component';
import {DownloadButtonComponent} from './shared/components/downloadbutton/download-button.component';
import {LivestockComponent} from './livestock/livestock.component';
import {LivestockMainOverviewComponent} from './livestock/main-overview/main-overview.component';
import {MessagesComponent} from './notifications/messages.component';
import {PaginationComponent} from './shared/components/pagination/pagination.component';
import {MateComponent} from './nsfo-declares/mate/mate.component';
import {SelectorComponent} from './shared/components/selector/selector.component';
import {MateDeclareComponent} from './nsfo-declares/mate/declare/mate.declare';
import {MateHistoryRowComponent} from './nsfo-declares/mate/history/mate.history.row';
import {MateHistoryComponent} from './nsfo-declares/mate/history/mate.history';
import {WeightComponent} from './nsfo-declares/weight/weight.component';
import {WeightHistoryRowComponent} from './nsfo-declares/weight/history/weight.history.row';
import {WeightHistoryComponent} from './nsfo-declares/weight/history/weight.history';
import {WeightDeclareComponent} from './nsfo-declares/weight/declare/weight.declare';
import {DownloadLandingPageComponent} from './redirect/download/download-landing-page.component';
import {LoadingComponent} from './redirect/loading/loading.component';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent,
      RvoLeadingLivestockSyncComponent,
      AdminComponent,
      GhostLoginComponent,
      LoginComponent,
      DashboardComponent,
      MainComponent,
      InvoiceDetailsComponent,
      InvoiceOverviewComponent,
      InvoiceFilterPipe,
      InvoiceComponent,
      LivestockOverviewComponent,
      LivestockDetailComponent,
      Datepicker,
      ExteriorComponent,
      DownloadButtonComponent,
      ExteriorComponent,
      LivestockComponent,
      LivestockMainOverviewComponent,
      MessagesComponent,
      PaginationComponent,
      MateComponent,
      SelectorComponent,
      MateDeclareComponent,
      MateHistoryPipe,
      MateHistoryRowComponent,
      MateHistoryComponent,
      WeightComponent,
      WeightHistoryRowComponent,
      WeightHistoryComponent,
      WeightDeclareComponent,
      DownloadLandingPageComponent,
      LoadingComponent,
    lastFiveMessagesFilterPipe,
    localNumberFormat,
    DecimalPipe,
    InvoiceFilterPipe,
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
