import {LocalLocation} from '../../../shared/models/location.model';
import {Component, Input} from '@angular/core';

@Component({
  selector: 'app-animal-details-contact-card',
  templateUrl: './animal-details-contact-card.component.html',
})
export class AnimalDetailsContactCardComponent {

  @Input()
  location?: LocalLocation;

  @Input()
  header: string;

  hasData(): boolean {
    return this.location != null &&
      this.location.company != null &&
      this.location.address != null &&
      this.location.ubn != null;
  }

  getParsedAddress(): string {
    const address = this.location.address;
    if (address != null) {
      const suffix = address.address_number_suffix != null ?
        address.address_number_suffix.trim() : '';
      return address.street_name + ' ' +  address.address_number + suffix;
    }
    return '';
  }
}
