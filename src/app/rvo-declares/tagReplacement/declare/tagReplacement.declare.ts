
import {Component} from '@angular/core';
import {FormControl, FormGroup} from '@angular/forms';
import {LivestockOverviewComponent} from '../../../shared/components/livestock/overview.component';
import {SelectorComponent} from '../../../shared/components/selector/selector.component';
import {API_URI_DECLARE_TAG_REPLACEMENT, API_URI_GET_EARTAGS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import * as _ from 'lodash';
import {Animal} from '../../../shared/models/animal.model';
import {JsonResponseModel} from '../../../shared/models/json-response.model';
import {SettingsService} from '../../../shared/services/settings/settings.service';

@Component({
  templateUrl: './tagReplacement.declare.html',
})

export class TagReplacementDeclareComponent {
  public tags = [];
  public filteredTags = [];
  public selectedAnimal: Animal;
  public selectedTag;
  public sending: boolean;
  public form: FormGroup = new FormGroup({
    replacedAt: new FormControl(''),
  });
  public view_date_format;
  public model_datetime_format;
  public objectForDatePicker = {
    'formControl': this.form.controls['replacedAt'],
    'view_date_format': this.view_date_format,
    'model_datetime_format': this.model_datetime_format
  };

  constructor(private nsfo: NSFOService, private settingsService: SettingsService) {
    this.getEartagsList();
    this.view_date_format = settingsService.getViewDateFormat();
    this.model_datetime_format = settingsService.getModelDateTimeFormat();
  }

  public getEartagsList() {
    this.nsfo
      .doGetRequest(API_URI_GET_EARTAGS)
      .subscribe(
          (res: JsonResponseModel) => {
          this.tags = res.result;

          for (const tag of this.tags) {
            tag.uln = tag.uln_country_code + tag.uln_number;
            tag.ulnLastFive = tag.uln_number.substr(tag.uln_number.length - 5);
          }

          this.tags = _.orderBy(this.tags, ['ulnLastFive']);
          this.filteredTags = _.cloneDeep(this.tags);
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
        }
      );
  }

  public selectAnimal(event) {
    this.selectedAnimal = event.animals[0];
  }

  public declareTagReplacement(event) {
    this.selectedAnimal.sending = true;
    this.selectedTag = event;

    const request = {
      'tag': {
        'uln_country_code': this.selectedTag.uln_country_code,
        'uln_number': this.selectedTag.uln_number,
        'replaced_at': this.form.get('replacedAt').value
      },
      'animal': {
        'uln_country_code': this.selectedAnimal.uln_country_code,
        'uln_number': this.selectedAnimal.uln_number
      }
    };

    this.nsfo.doPostRequest(API_URI_DECLARE_TAG_REPLACEMENT, request)
      .subscribe(
        res => {
          this.selectedAnimal.successful = true;
          this.selectedAnimal.uln_country_code = this.selectedTag.uln_country_code;
          this.selectedAnimal.uln_number = this.selectedTag.uln_number;
          this.selectedAnimal.uln = this.selectedTag.uln;
          this.sending = false;

          this.selectedAnimal = null;
          this.selectedTag = null;
        },
        error => {
          alert(this.nsfo.getErrorMessage(error));
        }
      );
  }
}
