import { NgModule } from '@angular/core';
import { PreloadAllModules, RouterModule, Routes } from '@angular/router';
import {HomeComponent} from './core/home/home.component';
import {NSFOAuthService} from './shared/services/nsfo-api/nsfo.auth';
import {DashboardComponent} from './core/dashboard/dashboard.component';
import {NSFOAdminAuthService} from './shared/services/nsfo-api/nsfo-admin.auth';
import {RvoLeadingLivestockSyncComponent} from './admin/rvo-leading-livestock-sync/rvo-leading-livestock-sync.component';
import {ArrivalComponent} from './rvo-declares/arrival/arrival.component';
import {ArrivalDeclareComponent} from './rvo-declares/arrival/declare/arrival.declare';
import {ArrivalHistoryComponent} from './rvo-declares/arrival/history/arrival.history';
import {ArrivalErrorsComponent} from './rvo-declares/arrival/errors/arrival.errors';
import {ArrivalCsvComponent} from './rvo-declares/arrival/csv/arrival.csv';
import {DepartComponent} from './rvo-declares/depart/depart.component';
import {DepartDeclareComponent} from './rvo-declares/depart/declare/depart.declare';
import {DepartHistoryComponent} from './rvo-declares/depart/history/depart.history';
import {DepartErrorsComponent} from './rvo-declares/depart/errors/depart.errors';
import {DepartCsvComponent} from './rvo-declares/depart/csv/depart.csv';
import {MateComponent} from './nsfo-declares/mate/mate.component';
import {MateDeclareComponent} from './nsfo-declares/mate/declare/mate.declare';
import {MateHistoryComponent} from './nsfo-declares/mate/history/mate.history';
import {BirthComponent} from './rvo-declares/birth/birth.component';
import {BirthDeclareComponent} from './rvo-declares/birth/declare/birth.declare';
import {BirthHistoryComponent} from './rvo-declares/birth/history/birth.history';
import {BirthErrorsComponent} from './rvo-declares/birth/errors/birth.errors';
import {BirthCsvComponent} from './rvo-declares/birth/csv/birth.csv';
import {LossComponent} from './rvo-declares/loss/loss.component';
import {LossDeclareComponent} from './rvo-declares/loss/declare/loss.declare';
import {LossHistoryComponent} from './rvo-declares/loss/history/loss.history';
import {LossErrorsComponent} from './rvo-declares/loss/errors/loss.errors';
import {LossCsvComponent} from './rvo-declares/loss/csv/loss.csv';
import {WeightComponent} from './nsfo-declares/weight/weight.component';
import {WeightDeclareComponent} from './nsfo-declares/weight/declare/weight.declare';
import {WeightHistoryComponent} from './nsfo-declares/weight/history/weight.history';
import {TagReplacementComponent} from './rvo-declares/tagReplacement/tagReplacement.component';
import {TagReplacementDeclareComponent} from './rvo-declares/tagReplacement/declare/tagReplacement.declare';
import {TagReplacementHistoryComponent} from './rvo-declares/tagReplacement/history/tagReplacement.history';
import {TagReplacementErrorsComponent} from './rvo-declares/tagReplacement/errors/tagReplacement.errors';
import {LivestockComponent} from './livestock/livestock.component';
import {LivestockMainOverviewComponent} from './livestock/main-overview/main-overview.component';
import {LivestockDetailComponent} from './livestock/details/details.component';
import {InvoiceComponent} from './invoices/invoice.component';
import {InvoiceOverviewComponent} from './invoices/overview/invoice.overview';
import {InvoiceDetailsComponent} from './invoices/details/invoice.details';
import {AdminComponent} from './admin/admin.component';
import {ProfileComponent} from './user/profile/profile.component';
import {ProfileCompanyComponent} from './user/profile/company/company.component';
import {ProfileLoginComponent} from './user/profile/login/login.component';
import {ProfileEmailComponent} from './user/profile/email/email.component';
import {EartagComponent} from './rvo-declares/eartag/eartag.component';
import {EartagDeclareComponent} from './rvo-declares/eartag/declare/eartag.declare';
import {EartagHistoryComponent} from './rvo-declares/eartag/history/eartag.history';
import {EartagErrorsComponent} from './rvo-declares/eartag/errors/eartag.errors';
import {ContactComponent} from './user/contact/contact.component';
import {MessagesComponent} from './notifications/messages.component';
import {LoginComponent} from './auth/login/login.component';
import {GhostLoginComponent} from './auth/ghostlogin/ghostlogin.component';
import {LoadingComponent} from './redirect/loading/loading.component';
import {DownloadLandingPageComponent} from './redirect/download/download-landing-page.component';
import {ReportComponent} from './report/report.component';
import {ReportLineageProofComponent} from './report/lineageProof/report.lineageProof';
import {ReportInbreedingCoefficientComponent} from './report/inbreedingCoefficient/report.inbreedingCoefficient';
import {ReportLivestockComponent} from './report/livestock/report.livestock';
import {ReportFertilizerAccountingComponent} from './report/fertilityAccounting/report.fertilizer-accounting.component';
import {ReportOffspringComponent} from './report/offspring/report.offspring.component';
import {ReportBirthListComponent} from './report/birthlist/report.birth-list.component';
import {ReportEweCardComponent} from './report/eweCard/report.ewe-card.component';

// const appRoutes: Routes = [
const appRoutes = [
  {
    path: 'main',  component: HomeComponent, index: true, canActivate: [NSFOAuthService],
    children: [
      {path: '', component: DashboardComponent, index: true},
      {
        path: 'admin',  component: AdminComponent, canActivate: [NSFOAdminAuthService],
        children: [
          {path: 'rvo-leading-livestock-sync', component: RvoLeadingLivestockSyncComponent},
        ]
      },
      {
        path: 'arrival', component: ArrivalComponent,
        children: [
          {path: 'declare', component: ArrivalDeclareComponent},
          {path: 'history', component: ArrivalHistoryComponent},
          {path: 'errors', component: ArrivalErrorsComponent},
          {path: 'reader', component: ArrivalCsvComponent},
        ]
      },
      {
        path: 'depart', component: DepartComponent,
        children: [
          {path: 'declare', component: DepartDeclareComponent},
          {path: 'history', component: DepartHistoryComponent},
          {path: 'errors', component: DepartErrorsComponent},
          {path: 'reader', component: DepartCsvComponent},
        ]
      },
      {
        path: 'mate', component: MateComponent,
        children: [
          {path: 'declare', component: MateDeclareComponent},
          {path: 'history', component: MateHistoryComponent},
        ]
      },
      {
        path: 'birth', component: BirthComponent,
        children: [
          {path: 'declare', component: BirthDeclareComponent},
          {path: 'history', component: BirthHistoryComponent},
          {path: 'errors', component: BirthErrorsComponent},
          {path: 'reader', component: BirthCsvComponent},
        ]
      },
      {
        path: 'loss', component: LossComponent,
        children: [
          {path: 'declare', component: LossDeclareComponent},
          {path: 'history', component: LossHistoryComponent},
          {path: 'errors', component: LossErrorsComponent},
          {path: 'reader', component: LossCsvComponent},
        ]
      },
      {
        path: 'weight', component: WeightComponent,
        children: [
          {path: 'declare', component: WeightDeclareComponent},
          {path: 'history', component: WeightHistoryComponent},
        ]
      },
      {
        path: 'tag-replacement', component: TagReplacementComponent,
        children: [
          {path: 'declare', component: TagReplacementDeclareComponent},
          {path: 'history', component: TagReplacementHistoryComponent},
          {path: 'errors', component: TagReplacementErrorsComponent}
        ]
      },
      {
        path: 'livestock', component: LivestockComponent,
        children: [
          {path: 'overview', component: LivestockMainOverviewComponent},
          {path: 'details/:uln', component: LivestockDetailComponent},
        ]
      },
      {
        path: 'invoices', component: InvoiceComponent,
        children: [
          {path: 'overview', component: InvoiceOverviewComponent},
          {path: 'details/:id', component: InvoiceDetailsComponent}
        ]
      },
      {
        path: 'report', component: ReportComponent,
        children: [
          {path: 'lineage_proof', component: ReportLineageProofComponent},
          {path: 'inbreeding', component: ReportInbreedingCoefficientComponent},
          {path: 'livestock', component: ReportLivestockComponent},
          // {path: 'fertilizer_accounting', component: ReportFertilizerAccountingComponent},
          {path: 'offspring', component: ReportOffspringComponent},
          {path: 'birth_list', component: ReportBirthListComponent},
          {path: 'ewe_card', component: ReportEweCardComponent}
        ]
      },
      {
        path: 'profile', component: ProfileComponent,
        children: [
          {path: 'company', component: ProfileCompanyComponent},
          {path: 'login', component: ProfileLoginComponent},
          {path: 'email', component: ProfileEmailComponent},

        ]
      },
      {
        path: 'eartag', component: EartagComponent,
        children: [
          {path: 'declare', component: EartagDeclareComponent},
          {path: 'history', component: EartagHistoryComponent},
          {path: 'errors', component: EartagErrorsComponent}
        ]
      },
      {path: 'contact', component: ContactComponent},
      {path: 'messages', component: MessagesComponent},
      {path: 'messages/:id', component: MessagesComponent}
    ]
  },
  {path: 'login', component: LoginComponent},
  {path: 'ghostlogin/:ghostToken/:accessToken', component: GhostLoginComponent},
  {path: 'loading/:encodedUrl', component: LoadingComponent},
  {path: 'downloaded/:encodedUrl', component: DownloadLandingPageComponent},
  {path: '', redirectTo: '/main', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot( // Only use forRoot in appModule
    appRoutes,
    {preloadingStrategy: PreloadAllModules } // Preload lazy loaded components
  )],
  exports: [RouterModule]
})
export class AppRoutingModule {

}
