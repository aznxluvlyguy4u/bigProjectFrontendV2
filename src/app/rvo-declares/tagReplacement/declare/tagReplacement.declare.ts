
import {Component} from '@angular/core';
import {LivestockOverviewComponent} from '../../../shared/components/livestock/overview.component';
import {SelectorComponent} from '../../../shared/components/selector/selector.component';
import {API_URI_DECLARE_TAG_REPLACEMENT, API_URI_GET_EARTAGS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import * as _ from 'lodash';
import {Animal} from '../../../shared/models/animal.model';

@Component({
  templateUrl: './tagReplacement.declare.html',
})

export class TagReplacementDeclareComponent {
  private tags = [];
  private filteredTags = [];
  private selectedAnimal: Animal;
  private selectedTag;
  private sending: boolean;

  constructor(private nsfo: NSFOService) {
    this.getEartagsList();
  }

  private getEartagsList() {
    this.nsfo
      .doGetRequest(API_URI_GET_EARTAGS)
      .subscribe(
        res => {
          this.tags = res.json().result;

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

  private selectAnimal(event) {
    this.selectedAnimal = event.animals[0];
  }

  private declareTagReplacement(event) {
    this.selectedAnimal.sending = true;
    this.selectedTag = event;

    const request = {
      'tag': {
        'uln_country_code': this.selectedTag.uln_country_code,
        'uln_number': this.selectedTag.uln_number
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
        }
      );
  }
}
