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
import {DatepickerV2Component} from './shared/components/datepickerV2/datepicker-v2.component';
import {FileTypeDropdownComponent} from './shared/components/filetypedropdown/file-type-dropdown.component';
import {ReportFertilizerAccountingComponent} from './report/fertilityAccounting/report.fertilizer-accounting.component';
import {ReportInbreedingCoefficientComponent} from './report/inbreedingCoefficient/report.inbreedingCoefficient';
import {ReportLineageProofComponent} from './report/lineageProof/report.lineageProof';
import {ReportLivestockComponent} from './report/livestock/report.livestock';
import {ReportOffspringComponent} from './report/offspring/report.offspring.component';
import {BooleanSwitchComponent} from './shared/components/booleanswitch/boolean-switch.component';
import {ReportComponent} from './report/report.component';
import {ArrivalDeclareComponent} from './rvo-declares/arrival/declare/arrival.declare';
import {ArrivalErrorRowComponent} from './rvo-declares/arrival/errors/arrival.errors.row';
import {ArrivalErrorsComponent} from './rvo-declares/arrival/errors/arrival.errors';
import {ArrivalHistoryRowComponent} from './rvo-declares/arrival/history/arrival.history.row';
import {RevokeButtonComponent} from './shared/components/revokebutton/revoke-button.component';
import {HistoryErrorInfoComponent} from './shared/components/historyerrorinfo/history-error-info.component';
import {ArrivalHistoryComponent} from './rvo-declares/arrival/history/arrival.history';
import {ArrivalComponent} from './rvo-declares/arrival/arrival.component';
import {BirthDeclareRowComponent} from './rvo-declares/birth/declare/birth.declare.row';
import {BirthDeclareComponent} from './rvo-declares/birth/declare/birth.declare';
import {BirthErrorRowComponent} from './rvo-declares/birth/errors/birth.errors.row';
import {BirthErrorsComponent} from './rvo-declares/birth/errors/birth.errors';
import {BirthHistoryRowComponent} from './rvo-declares/birth/history/birth.history.row';
import {BirthHistoryComponent} from './rvo-declares/birth/history/birth.history';
import {BirthComponent} from './rvo-declares/birth/birth.component';
import {DepartDeclareComponent} from './rvo-declares/depart/declare/depart.declare';
import {DepartErrorsComponent} from './rvo-declares/depart/errors/depart.errors';
import {DepartErrorRowComponent} from './rvo-declares/depart/errors/depart.errors.row';
import {DepartHistoryComponent} from './rvo-declares/depart/history/depart.history';
import {DepartHistoryRowComponent} from './rvo-declares/depart/history/depart.history.row';
import {DepartComponent} from './rvo-declares/depart/depart.component';
import {EartagComponent} from './rvo-declares/eartag/eartag.component';
import {LossDeclareComponent} from './rvo-declares/loss/declare/loss.declare';
import {LossErrorRowComponent} from './rvo-declares/loss/errors/loss.errors.row';
import {LossErrorsComponent} from './rvo-declares/loss/errors/loss.errors';
import {LossHistoryRowComponent} from './rvo-declares/loss/history/loss.history.row';
import {LossHistoryComponent} from './rvo-declares/loss/history/loss.history';
import {LossComponent} from './rvo-declares/loss/loss.component';
import {TagReplacementDeclareComponent} from './rvo-declares/tagReplacement/declare/tagReplacement.declare';
import {TagReplacementErrorRowComponent} from './rvo-declares/tagReplacement/errors/tagReplacement.errors.row';
import {TagReplacementErrorsComponent} from './rvo-declares/tagReplacement/errors/tagReplacement.errors';
import {TagReplacementHistoryRowComponent} from './rvo-declares/tagReplacement/history/tagReplacement.history.row';
import {TagReplacementHistoryComponent} from './rvo-declares/tagReplacement/history/tagReplacement.history';
import {TagReplacementComponent} from './rvo-declares/tagReplacement/tagReplacement.component';

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
      DatepickerV2Component,
      FileTypeDropdownComponent,
      ReportFertilizerAccountingComponent,
      ReportInbreedingCoefficientComponent,
      ReportLineageProofComponent,
      ReportLivestockComponent,
      ReportOffspringComponent,
      BooleanSwitchComponent,
      ReportComponent,
      ReportOffspringComponent,
      ArrivalDeclareComponent,
      ArrivalErrorRowComponent,
      ArrivalErrorsComponent,
      ArrivalHistoryRowComponent,
      RevokeButtonComponent,
      HistoryErrorInfoComponent,
      ArrivalHistoryComponent,
      ArrivalHistoryFilterPipe,
      ArrivalComponent,
      BirthDeclareRowComponent,
      BirthDeclareComponent,
      BirthErrorRowComponent,
      BirthErrorsComponent,
      BirthHistoryRowComponent,
      BirthHistoryComponent,
      BirthHistoryPipe,
      BirthComponent,
      DepartDeclareComponent,
      DepartErrorsComponent,
      DepartErrorRowComponent,
      DepartHistoryComponent,
      DepartHistoryRowComponent,
      DepartHistoryFilterPipe,
      DepartComponent,
      EartagComponent,
      LossDeclareComponent,
      LossErrorRowComponent,
      LossErrorsComponent,
      LossHistoryRowComponent,
      LossHistoryComponent,
      LossHistoryFilterPipe,
      LossComponent,
      TagReplacementDeclareComponent,
      TagReplacementErrorRowComponent,
      TagReplacementErrorsComponent,
      TagReplacementHistoryRowComponent,
      TagReplacementHistoryComponent,
      TagReplacementComponent,
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
