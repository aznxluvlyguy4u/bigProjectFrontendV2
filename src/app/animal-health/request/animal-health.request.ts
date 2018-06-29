import {Component, OnInit} from '@angular/core';
import {Router} from '@angular/router';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {FormBuilder, FormControl, FormGroup} from '@angular/forms';
import {API_URI_ANIMAL_HEALTH_ANNOUNCEMENTS} from '../../shared/services/nsfo-api/nsfo.settings';
import {AnimalHealthRequest} from '../../shared/models/animal-health.model';
import {CacheService} from '../../shared/services/settings/cache.service';

@Component({
  templateUrl: './animal-health.request.html'
})

export class AnimalHealthRequestComponent implements OnInit {

  private illnesses = ['MAEDI VISNA', 'SCRAPIE'];
  private isError = false;
  private form: FormGroup;
  private ubn;
  private selectedIllness = '';
  private errorMessage = '';


  public constructor(private router: Router, private apiService: NSFOService, private fb: FormBuilder, private cache: CacheService) {
    if (this.cache.getUbn()) {
      this.ubn = this.cache.getUbn();
    }
    this.form = new FormGroup({
      'illness_type': new FormControl('')
    });
  }

  ngOnInit() {
    this.getUserInfo();
  }

  sendHealthRequest() {
    const data = new AnimalHealthRequest();
    data.illness = this.form.get('illness_type').value;
    data.ubn = this.ubn;
    this.apiService.doPostRequest(API_URI_ANIMAL_HEALTH_ANNOUNCEMENTS + '/customer', data).subscribe(
      res => {
          if (res.result.result === 'null' && res.result.failed !== 'null') {
            this.isError = true;
          }
      }
    );
  }
}
