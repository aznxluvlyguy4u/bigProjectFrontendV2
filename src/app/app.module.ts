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
import {TranslateLoader, TranslateModule} from '@ngx-translate/core';
import {TranslateHttpLoader} from '@ngx-translate/http-loader';
import {NgxPaginationModule} from 'ngx-pagination';
import {AppRoutingModule} from './app-routing.module';

// AoT requires an exported function for factories
export function HttpLoaderFactory(http: HttpClient) {
  return new TranslateHttpLoader(http);
}

@NgModule({
  declarations: [
    AppComponent
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
