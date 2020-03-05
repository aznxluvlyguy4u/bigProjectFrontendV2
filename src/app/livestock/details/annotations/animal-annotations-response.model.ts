import {AnimalAnnotationModel} from './animal-annotation.model';

export class AnimalAnnotationsResponseModel {
  public result: AnimalAnnotationModel[] = [];
  public status: number;
}
