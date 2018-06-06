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
    if (!this.ulnIsEmpty()) {
      this.router.navigate(['/main/livestock/details/' + this.inputAnimal.uln]);
    }
  }

  ngOnInit() {
    if (this.isStringEmpty(this.inputAnimal.date_of_birth)) {
      this.inputAnimal.date_of_birth = this.inputAnimal.dd_mm_yyyy_date_of_birth;
    } else {
      this.inputAnimal.date_of_birth = moment(this.inputAnimal.date_of_birth).format(this.settings.VIEW_DATE_FORMAT);
    }
    this.inputAnimal.uln = this.getUln(this.inputAnimal);
  }

  getUln(animal: Animal) {
    if (!this.isStringEmpty(animal.uln)) {
      return animal.uln;
    }

    if (!this.isStringEmpty(animal.uln_country_code) && !this.isStringEmpty(animal.uln_number)) {
      return animal.uln_country_code + animal.uln_number;
    }

    return '';
  }

  ulnIsEmpty(): boolean {
    return this.isStringEmpty(this.inputAnimal.uln);
  }

  private isStringEmpty(string: string): boolean {
    return string === undefined || string === null || string === '';
  }

}
