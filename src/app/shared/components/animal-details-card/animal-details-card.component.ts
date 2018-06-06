import * as moment from 'moment';
import {Component, Input, OnInit} from '@angular/core';

import {Settings} from '../../variables/settings';
import {Router} from '@angular/router';
import {Animal} from '../../models/animal.model';

@Component({
  selector: 'app-animal-details-card',
  templateUrl: './animal-details-card.component.html',
})
export class AnimalDetailsCardComponent implements OnInit {

  constructor (private settings: Settings, private router: Router) {}

  @Input() inputAnimal: Animal;
  @Input() mainAnimalGender: string = null;

  redirectToAnimal(isEdit: boolean = false) {
    this.router.navigate(['/main/livestock/details/' + this.inputAnimal.uln]);
  }

  ngOnInit() {
    this.inputAnimal.date_of_birth = moment(this.inputAnimal.date_of_birth).format(this.settings.VIEW_DATE_FORMAT);
    this.inputAnimal.uln = this.inputAnimal.uln === typeof 'undefined' || this.inputAnimal.uln !== '' ?
      this.inputAnimal.uln_country_code + this.inputAnimal.uln_number : null;
  }

}
