import {BrowserModule} from '@angular/platform-browser';
import {enableProdMode, NgModule} from '@angular/core';
import {CommonModule, DatePipe} from '@angular/common';

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
import {TranslateLoader, TranslateModule, TranslateService} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {NgxPaginationModule} from 'ngx-pagination';
import {AppRoutingModule} from './app-routing.module';
import {lastFiveMessagesFilterPipe} from './shared/pipes/lastFiveMessagesFilter';
import {localNumberFormat} from './shared/pipes/localNumberFormat';


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
import {HomeComponent} from './core/home/home.component';
import {InvoiceDetailsComponent} from './invoices/details/invoice.details';
import {InvoiceOverviewComponent} from './invoices/overview/invoice.overview';
import {InvoiceComponent} from './invoices/invoice.component';
import {LivestockOverviewComponent} from './shared/components/livestock/overview.component';
import {LivestockDetailComponent} from './livestock/details/details.component';

import {ExteriorComponent} from './livestock/details/exterior/exterior.component';
import {DownloadButtonComponent} from './shared/components/downloadbutton/download-button.component';
import {LivestockComponent} from './livestock/livestock.component';
import {LivestockMainOverviewComponent} from './livestock/main-overview/main-overview.component';
import {MessagesComponent} from './notifications/messages.component';
import {PaginationComponent} from './shared/components/pagination/pagination.component';
import {PedigreeRegisterDropdownComponent} from './shared/components/pedigreeregisterdropdown/pedigree-register-dropdown.component';
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
import {ReportBirthListComponent} from './report/birthlist/report.birth-list.component';
import {ReportCompanyRegisterComponent} from './report/companyRegister/report.company-register.component';
import {ReportFertilizerAccountingComponent} from './report/fertilityAccounting/report.fertilizer-accounting.component';
import {ReportInbreedingCoefficientComponent} from './report/inbreedingCoefficient/report.inbreedingCoefficient';
import {ReportLineageProofComponent} from './report/lineageProof/report.lineageProof';
import {ReportLivestockComponent} from './report/livestock/report.livestock';
import {ReportOffspringComponent} from './report/offspring/report.offspring.component';
import {ReportEweCardComponent} from './report/eweCard/report.ewe-card.component';
import {ReportWeightsPerYearOfBirthComponent} from './report/weightsPerYearOfBirth/report.weights-per-year-of-birth.component';
import {BooleanSwitchComponent} from './shared/components/booleanswitch/boolean-switch.component';
import {ReportComponent} from './report/report.component';
import {ArrivalDeclareComponent} from './rvo-declares/arrival/declare/arrival.declare';
import {ArrivalErrorRowComponent} from './rvo-declares/arrival/errors/arrival.errors.row';
import {ArrivalErrorsComponent} from './rvo-declares/arrival/errors/arrival.errors';
import {ArrivalHistoryRowComponent} from './rvo-declares/arrival/history/arrival.history.row';
import {ArrivalCsvComponent} from './rvo-declares/arrival/csv/arrival.csv';
import {RevokeButtonComponent} from './shared/components/revokebutton/revoke-button.component';
import {HistoryErrorInfoComponent} from './shared/components/historyerrorinfo/history-error-info.component';
import {ArrivalHistoryComponent} from './rvo-declares/arrival/history/arrival.history';
import {ArrivalComponent} from './rvo-declares/arrival/arrival.component';
import {BirthCsvComponent} from './rvo-declares/birth/csv/birth.csv';
import {BirthDeclareRowComponent} from './rvo-declares/birth/declare/birth.declare.row';
import {BirthDeclareComponent} from './rvo-declares/birth/declare/birth.declare';
import {BirthErrorRowComponent} from './rvo-declares/birth/errors/birth.errors.row';
import {BirthErrorsComponent} from './rvo-declares/birth/errors/birth.errors';
import {BirthHistoryComponent} from './rvo-declares/birth/history/birth.history';
import {BirthComponent} from './rvo-declares/birth/birth.component';
import {DepartCsvComponent} from './rvo-declares/depart/csv/depart.csv';
import {DepartDeclareComponent} from './rvo-declares/depart/declare/depart.declare';
import {DepartErrorsComponent} from './rvo-declares/depart/errors/depart.errors';
import {DepartErrorRowComponent} from './rvo-declares/depart/errors/depart.errors.row';
import {DepartHistoryComponent} from './rvo-declares/depart/history/depart.history';
import {DepartHistoryRowComponent} from './rvo-declares/depart/history/depart.history.row';
import {DepartComponent} from './rvo-declares/depart/depart.component';
import {EartagComponent} from './rvo-declares/eartag/eartag.component';
import {LossCsvComponent} from './rvo-declares/loss/csv/loss.csv';
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
import {InvoiceFilterPipe} from './invoices/pipes/invoice-filter.pipe';
import {DatepickerComponent} from './shared/components/datepicker/datepicker.component';
import {BirthHistoryRowComponent} from './rvo-declares/birth/history/birth-history-row.component';
import {MomentModule} from 'ngx-moment';
import {ContactComponent} from './user/contact/contact.component';
import {ProfileComponent} from './user/profile/profile.component';
import {ProfileCompanyComponent} from './user/profile/company/company.component';
import {ProfileEmailComponent} from './user/profile/email/email.component';
import {ProfileLoginComponent} from './user/profile/login/login.component';
import {DownloadModalComponent} from './shared/components/downloadmodal/download-modal.component';
import {DeclareManagerModalComponent} from './shared/components/declaremanagermodal/declare-manager-modal.component';
import {EartagDeclareComponent} from './rvo-declares/eartag/declare/eartag.declare';
import {EartagErrorsComponent} from './rvo-declares/eartag/errors/eartag.errors';
import {EartagHistoryComponent} from './rvo-declares/eartag/history/eartag.history';
import {EartagHistoryRowComponent} from './rvo-declares/eartag/history/eartag.history.row';
import {CheckMarkComponent} from './shared/components/checkmark/check-mark.component';
import {FormsModule, ReactiveFormsModule} from '@angular/forms';
import {EartagErrorRowComponent} from './rvo-declares/eartag/errors/eartag.errors.row';
import {HttpModule} from '@angular/http';
import {LiveSearchComponent} from './shared/components/livesearch/livesearch.component';
import {CacheService} from './shared/services/settings/cache.service';
import {BarComponent} from './shared/components/googlechart/bar.component';
import {GoogleChartsBaseService} from './shared/services/google/googlechartsbase.service';
import {GoogleColumnChartService} from './shared/services/google/googlecolumnchart.service';
import {LineComponent} from './shared/components/googlechart/line.component';
import {GoogleLineChartService} from './shared/services/google/googlelinechart.service';
import {AnimalDetailsCardComponent} from './shared/components/animal-details-card/animal-details-card.component';
import {BrowserAnimationsModule} from '@angular/platform-browser/animations';
import {
  MAT_SNACK_BAR_DEFAULT_OPTIONS,
  MatButtonModule,
  MatCheckboxModule,
  MatProgressSpinnerModule,
  MatSnackBar,
  MatSnackBarModule
} from '@angular/material';
import {PageLoadingSpinnerComponent} from './shared/components/page-loading-spinner/page-loading-spinner.component';
import {ButtonPrimaryComponent} from './shared/components/button-primary/button-primary.component';
import {InsideComponentLoadingSpinnerComponent} from './shared/components/inside-component-loading-spinner/inside-component-loading-spinner.component';
import {AnimalHealthComponent} from './animal-health/animal-health.component';
import {AnimalHealthRequestComponent} from './animal-health/request/animal-health.request';
import { PapaParseModule } from 'ngx-papaparse';
import {ReportService} from './shared/services/report/report.service';
import {ReportModalComponent} from './shared/components/reportmodal/report-modal.component';
import {SortService} from './shared/services/utils/sort.service';
import {PedigreeRegisterStorage} from './shared/services/storage/pedigree-register.storage';
import {InvoiceSortPipe} from './invoices/pipes/invoice-sort.pipe';
import {YeardropdownComponent} from './shared/components/yeardropdown/yeardropdown.component';
import {ReportAnimalFeaturesPerYearOfBirthComponent} from './report/animalFeaturesPerYearOfBirth/report.animal-features-per-year-of-birth.component';
import {AnimalDetailsContactCardComponent} from './livestock/details/contact/animal-details-contact-card.component';
import {RearingSelectorComponent} from './shared/components/rearingselector/rearing-selector.component';
import {AnimalAnnotationsComponent} from './livestock/details/annotations/animal-annotations.component';
import {AnimalAnnotationComponent} from './livestock/details/annotations/animal-annotation.component';
import {ScanMeasurementsEditModalComponent} from './livestock/details/scanmeasurementseditmodal/scan-measurements-edit-modal.component';
import {TreatmentComponent} from './nsfo-declares/treatment/treatment.component';
import {TreatmentDeclareComponent} from './nsfo-declares/treatment/declare/treatment.declare';
import {TreatmentHistoryComponent} from './nsfo-declares/treatment/history/treatment.history';
import {TreatmentHistoryRowComponent} from './nsfo-declares/treatment/history/treatment.history.row';
import {TreatmentHistoryPipe} from './nsfo-declares/treatment/history/pipes/treatment.history.pipe';
import {ReportAnimalTreatmentsPerYearComponent} from './report/animalTreatmentsPerYear/report.animal-treatments-per-year.component';
import {ReportCombiFormTransportDocumentComponent} from './report/combiFormTransportDocument/report.combiFormTransportDocument';

import { StorageServiceModule } from 'ngx-webstorage-service';

// AoT requires an exported function for factories
export function CreateTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, '../assets/i18n/', '.json');
}
// enableProdMode();
@NgModule({
  declarations: [
    AppComponent,
      AnimalHealthComponent,
      AnimalHealthRequestComponent,
      LiveSearchComponent,
      RvoLeadingLivestockSyncComponent,
      AdminComponent,
      GhostLoginComponent,
      LoginComponent,
      DashboardComponent,
      HomeComponent,
      InvoiceDetailsComponent,
      InvoiceOverviewComponent,
      InvoiceFilterPipe,
      InvoiceComponent,
      LivestockOverviewComponent,
      LivestockDetailComponent,
      AnimalDetailsCardComponent,
      DatepickerComponent,
      DatepickerV2Component,
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
      ContactComponent,
      ProfileComponent,
      ProfileCompanyComponent,
      ProfileEmailComponent,
      ProfileLoginComponent,
      DownloadModalComponent,
      DeclareManagerModalComponent,
      EartagDeclareComponent,
      EartagErrorsComponent,
      EartagHistoryComponent,
      EartagHistoryRowComponent,
      EartagHistoryFilterPipe,
      CheckMarkComponent,
      DatepickerComponent,
      DatepickerV2Component,
      EartagErrorRowComponent,
      LineComponent,
    LiveSearchComponent,
    RvoLeadingLivestockSyncComponent,
    AdminComponent,
    GhostLoginComponent,
    LoginComponent,
    DashboardComponent,
    HomeComponent,
    InvoiceDetailsComponent,
    InvoiceOverviewComponent,
    InvoiceFilterPipe,
    InvoiceComponent,
    InvoiceSortPipe,
    LivestockOverviewComponent,
    LivestockDetailComponent,
    AnimalDetailsCardComponent,
    AnimalDetailsContactCardComponent,
    DatepickerComponent,
    DatepickerV2Component,
    ExteriorComponent,
    DownloadButtonComponent,
    ExteriorComponent,
    AnimalAnnotationComponent,
    AnimalAnnotationsComponent,
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
    ReportBirthListComponent,
    ReportEweCardComponent,
    ReportCompanyRegisterComponent,
    ReportWeightsPerYearOfBirthComponent,
    ReportAnimalFeaturesPerYearOfBirthComponent,
    BooleanSwitchComponent,
    ReportComponent,
    ReportOffspringComponent,
    ArrivalCsvComponent,
    ArrivalDeclareComponent,
    ArrivalErrorRowComponent,
    ArrivalErrorsComponent,
    ArrivalHistoryRowComponent,
    RevokeButtonComponent,
    HistoryErrorInfoComponent,
    ArrivalHistoryComponent,
    ArrivalHistoryFilterPipe,
    ArrivalComponent,
    BirthCsvComponent,
    BirthDeclareRowComponent,
    BirthDeclareComponent,
    BirthErrorRowComponent,
    BirthErrorsComponent,
    BirthHistoryRowComponent,
    BirthHistoryComponent,
    BirthHistoryPipe,
    BirthComponent,
    DepartCsvComponent,
    DepartDeclareComponent,
    DepartErrorsComponent,
    DepartErrorRowComponent,
    DepartHistoryComponent,
    DepartHistoryRowComponent,
    DepartHistoryFilterPipe,
    DepartComponent,
    EartagComponent,
    LossCsvComponent,
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
    ContactComponent,
    PedigreeRegisterDropdownComponent,
    ProfileComponent,
    ProfileCompanyComponent,
    ProfileEmailComponent,
    ProfileLoginComponent,
    DownloadModalComponent,
    DeclareManagerModalComponent,
    EartagDeclareComponent,
    EartagErrorsComponent,
    EartagHistoryComponent,
    EartagHistoryRowComponent,
    EartagHistoryFilterPipe,
    CheckMarkComponent,
    DatepickerComponent,
    DatepickerV2Component,
    EartagErrorRowComponent,
    LineComponent,
    lastFiveMessagesFilterPipe,
    localNumberFormat,
    InvoiceFilterPipe,
    LivestockFilterPipe,
    LivestockOrderBy,
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
    BarComponent,
    PageLoadingSpinnerComponent,
    InsideComponentLoadingSpinnerComponent,
    ButtonPrimaryComponent,
    RearingSelectorComponent,
    ReportModalComponent,
    ScanMeasurementsEditModalComponent,
    YeardropdownComponent,
    TreatmentComponent,
    TreatmentDeclareComponent,
    TreatmentHistoryComponent,
    TreatmentHistoryRowComponent,
    TreatmentHistoryPipe,
    ReportAnimalTreatmentsPerYearComponent,
    ReportCombiFormTransportDocumentComponent
  ],
  imports: [
    BrowserAnimationsModule,
    BrowserModule,
    HttpModule,
    HttpClientModule,
    AppRoutingModule,
    NgxPaginationModule,
    MomentModule,
    FormsModule,
    CommonModule,
    ReactiveFormsModule,
    PapaParseModule,
    TranslateModule.forRoot({
      loader: {
        provide: TranslateLoader,
        useFactory: (CreateTranslateLoader),
        deps: [HttpClient]
      }
    }),
    MatProgressSpinnerModule,
    MatButtonModule,
    MatSnackBarModule,
    MatCheckboxModule,
    StorageServiceModule,
  ],
  providers: [
    UtilsService,
    QueryParamsService,
    NSFOService,
    NSFOAuthService,
    NSFOAdminAuthService,
    DownloadService,
    DeclareManagerService,
    CacheService,
    SettingsService,
      GoogleChartsBaseService,
      GoogleColumnChartService,
      GoogleLineChartService,
      ReportService,
    Settings,
    SortService,
    Constants,
    MatSnackBar,
    PedigreeRegisterStorage,
    DatePipe,
    {provide: MAT_SNACK_BAR_DEFAULT_OPTIONS, useValue: {duration: 3500}}
  ],
  bootstrap: [AppComponent]
})
export class AppModule {
}
