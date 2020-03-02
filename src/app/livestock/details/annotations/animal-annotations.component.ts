import {Component, EventEmitter, Input, Output} from '@angular/core';
import {API_URI_ANIMALS} from '../../../shared/services/nsfo-api/nsfo.settings';
import {NSFOService} from '../../../shared/services/nsfo-api/nsfo.service';
import {SettingsService} from '../../../shared/services/settings/settings.service';
import {AnimalAnnotationModel} from './animal-annotation.model';
import {AnimalAnnotationsResponseModel} from './animal-annotations-response.model';
import {HttpResponse} from '@angular/common/http';
import {AnimalAnnotationResponseModel} from './animal-annotation-response.model';

import * as HttpStatus from 'http-status-codes';
import {AnimalAnnotationRequestModel} from './animal-annotation-request.model';
import {TranslateService} from '@ngx-translate/core';
import {MatSnackBar} from '@angular/material';

@Component({
  selector: 'app-animal-annotations',
  templateUrl: 'animal-annotations.component.html'
})
export class AnimalAnnotationsComponent {

  @Input()
  public changeEnabled: boolean;
  @Input()
  public isEditModeActive = false;
  @Output()
  public isEditModeActiveChange = new EventEmitter<boolean>();
  @Input()
  public isChangeButtonActive: boolean;

  private id: string = null;

  public isAdmin: boolean;
  public annotationForUser: AnimalAnnotationModel = null;
  public annotationsForAdmin: AnimalAnnotationModel[] = [];

  public isLoading = true;
  public isUpdating = false;

  public editableBody = '';

  constructor(
    private apiService: NSFOService,
    private settings: SettingsService,
    private translate: TranslateService,
    public snackBar: MatSnackBar
  ) {
    this.isAdmin = settings.isAdmin();
  }

  public updateIsEditModeActive(isEditModeActive) {
    this.isEditModeActive = isEditModeActive;
    this.isEditModeActiveChange.emit(isEditModeActive);
  }

  private animalAnnotationsUrl() {
    return API_URI_ANIMALS + '/' + this.id + '/annotations';
  }

  @Input()
  set ulnOrAnimalId(ulnOrAnimalId: string) {
    if (ulnOrAnimalId != null && ulnOrAnimalId !== '' && this.id === null) {
      this.id = ulnOrAnimalId;
      this.getAnimalAnnotations();
    }
  }

  public toggleEditMode() {
    this.isEditModeActive = !this.isEditModeActive;
    this.updateIsEditModeActive(this.isEditModeActive);
  }

  public cancel() {
    this.editableBody = this.annotationForUser != null ? this.annotationForUser.body : '';
    this.toggleEditMode();
  }

  public clearInput() {
    this.editableBody = '';
  }

  private getAnimalAnnotations() {
    if (this.isAdmin) {
      this.apiService
        .doGetRequest(this.animalAnnotationsUrl())
        .subscribe((response: AnimalAnnotationsResponseModel) => {
            this.annotationsForAdmin = response.result;
            this.isLoading = false;
          },
          error => {
            alert(this.apiService.getErrorMessage(error));
            this.isLoading = false;
          }
        );
    } else {
      this.apiService
        .doGetRequest(this.animalAnnotationsUrl(), true)
        .subscribe((response: HttpResponse<AnimalAnnotationResponseModel>) => {
            if (response.status !== HttpStatus.NO_CONTENT) {
              this.annotationForUser = response.body.result;
              this.editableBody = this.annotationForUser.body;
            }
            this.isLoading = false;
          },
          error => {
            alert(this.apiService.getErrorMessage(error));
            this.isLoading = false;
          }
        );
    }
  }

  private updateAnimalAnnotation() {
    if (!this.isAdmin) {
      this.isUpdating = true;

      const requestBody = new AnimalAnnotationRequestModel();
      requestBody.body = this.editableBody;

      this.apiService
        .doPutRequest(this.animalAnnotationsUrl(), requestBody, true)
        .subscribe((response: HttpResponse<AnimalAnnotationResponseModel>) => {
            if (response.status === HttpStatus.NO_CONTENT) {
              this.annotationForUser = null;
              this.editableBody = '';
            } else {
              this.annotationForUser = response.body.result;
              this.editableBody = this.annotationForUser.body;
            }

            this.isUpdating = false;
            this.toggleEditMode();
            this.openSaveConfirmationSnackBar();
          },
          error => {
            this.isUpdating = false;
            this.toggleEditMode();
            alert(this.apiService.getErrorMessage(error));
          }
        );
    }
  }

  private openSaveConfirmationSnackBar() {
    const message = this.translate.instant('THE ANIMAL INFO HAS BEEN SAVED') + '!';
    this.snackBar.open(message);
  }
}
