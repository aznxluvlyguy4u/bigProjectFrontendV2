import {Component, EventEmitter, Input, Output} from '@angular/core';
import {AnimalAnnotationModel} from './animal-annotation.model';
import {SettingsService} from '../../../shared/services/settings/settings.service';

@Component({
  selector: 'app-animal-annotation',
  templateUrl: 'animal-annotation.component.html'
})
export class AnimalAnnotationComponent {

  @Input()
  public annotation: AnimalAnnotationModel;
  @Input()
  public changeEnabled: boolean;
  @Input()
  public isEditModeActive = false;
  @Input()
  public showCompanyAndUbn: boolean;

  @Input()
  public editableBody: string;
  @Output()
  public editableBodyChange = new EventEmitter<string>();

  constructor(public settings: SettingsService) {}


  public updateEditableBody(body) {
    this.editableBody = body;
    this.editableBodyChange.emit(body);
  }
}
