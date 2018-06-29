import {Component, NgZone, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {NSFOService} from '../shared/services/nsfo-api/nsfo.service';
import {CacheService} from '../shared/services/settings/cache.service';
import {SettingsService} from '../shared/services/settings/settings.service';
import {UtilsService} from '../shared/services/utils/utils.services';
import {DownloadService} from '../shared/services/download/download.service';

@Component({
  templateUrl: './animal-health.component.html'
})

export class AnimalHealthComponent {

  constructor(private router: Router) {
    router.navigate(['/main/animal-health/request']);
  }
}
