import * as moment from 'moment';
import {Component, EventEmitter, Input, OnInit, Output} from '@angular/core';

import {Settings} from '../../variables/settings';
import {Router} from '@angular/router';
import {Animal} from '../../models/animal.model';
import {SettingsService} from '../../services/settings/settings.service';

@Component({
  selector: 'app-animal-details-card',
  templateUrl: './animal-details-card.component.html',
})
export class AnimalDetailsCardComponent implements OnInit {

  constructor (
      private settings: Settings,
      private settingsService: SettingsService,
      private router: Router
  ) {}

  @Input() inputAnimal: Animal;
  @Input() offSpring = false;
  @Input() mainAnimalGender: string = null;
  @Output() historyUpdate = new EventEmitter();
  dateOfBirth = '';

  redirectToAnimal(isEdit: boolean = false) {
    if (!this.ulnIsEmpty()) {
      this.historyUpdate.emit(this.inputAnimal.uln);
      this.router.navigate(['/main/livestock/details/' + this.inputAnimal.uln]);
    }
  }

  ngOnInit() {

    if (!this.isStringEmpty(this.inputAnimal.date_of_birth)) {
      this.dateOfBirth = moment(this.inputAnimal.date_of_birth).format(this.settings.VIEW_DATE_FORMAT);
    } else if (!this.isStringEmpty(this.inputAnimal.dd_mm_yyyy_date_of_birth)) {
      this.dateOfBirth = this.inputAnimal.dd_mm_yyyy_date_of_birth;
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

  isRedirectButtonEnabled(): boolean {
    if (this.ulnIsEmpty()) {
      return false;
    }

    if (this.settingsService.isAdmin()) {
      return true;
    }

    return this.inputAnimal.is_user_allowed_to_access_animal_details === true;
  }

}
