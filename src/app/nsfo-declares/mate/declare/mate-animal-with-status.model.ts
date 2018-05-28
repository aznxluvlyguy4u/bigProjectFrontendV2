import {Animal} from '../../../shared/models/animal.model';

export class MateAnimalWithStatus extends Animal {
  sending: boolean;
  successful: boolean;
  selected: boolean;
}
