import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_TREATMENT_TEMPLATES} from '../../shared/services/nsfo-api/nsfo.settings';
import {JsonResponseModel} from '../../shared/models/json-response.model';
import {TreatmentTemplate} from '../../shared/models/treatment-template.model';
import {ErrorMessage} from '../../shared/models/error-message.model';
import {Animal} from '../../shared/models/animal.model';
import * as _ from 'lodash';
import {FormGroup} from '@angular/forms';
import {CacheService} from '../../shared/services/settings/cache.service';
import {TreatmentMedication} from '../../shared/models/treatment-medication.model';

@Injectable()
export class TreatmentService {
  treatmentTemplatesChanged = new Subject<TreatmentTemplate[]>();
  private treatmentTemplates: TreatmentTemplate[] = [];

  public displayTreatmentLocationIndividualType = false;
  public declareErrorMessages: ErrorMessage[] = [];

  constructor(
    private nsfo: NSFOService,
    private cache: CacheService
  ) {
    this.doGetTreatmentTemplates();
  }

  public getTreatmentTemplates() {
    return this.treatmentTemplates;
  }

  private notifyTreatmentTemplatesChanged() {
    this.treatmentTemplatesChanged.next(this.treatmentTemplates.slice());
  }

  private doGetTreatmentTemplates() {
    this.nsfo
      .doGetRequest(API_URI_GET_TREATMENT_TEMPLATES + '/template?minimal_output=false')
      .subscribe(
        (res: JsonResponseModel) => {
          this.treatmentTemplates = res.result;
          this.treatmentTemplates.forEach(function (treatmentTemplate: TreatmentTemplate) {
              treatmentTemplate.treatment_medications.forEach(function (medication: TreatmentMedication) {
                  medication.marked_to_keep = true;
              });
              return treatmentTemplate;
          });
          this.notifyTreatmentTemplatesChanged();
        }
      );
  }

  declareTreatment(
    event,
    form: FormGroup,
    selectedTreatmentTemplate: TreatmentTemplate,
    useEndDate: boolean
  ) {
    const animals = [];
    event.animals.forEach((animal: Animal) => {
      let type = '';
      switch (animal.gender) {
        case 'MALE':
          type = 'Ram';
          break;
        case 'FEMALE':
          type = 'Ewe';
          break;
        case 'NEUTER':
          type = 'Neuter';
          break;
      }

      animals.push({
        id: animal.id,
        type: type
      });
    });

    if (form.valid) {
      const requestData: any = {};

      const clonedTreatmentTemplate = _.cloneDeep(selectedTreatmentTemplate);

      _.remove(clonedTreatmentTemplate.treatment_medications, (treatment_medication) => {
        return !treatment_medication.marked_to_keep;
      });

      requestData.treatment_template = clonedTreatmentTemplate;
      requestData.treatment_template.location = {};
      requestData.description = selectedTreatmentTemplate.description;
      requestData.start_date = form.get('start_date').value;
      if (useEndDate) {
        requestData.end_date = form.get('end_date').value;
      }
      requestData.animals = animals;
      requestData.treatment_template.location.id = this.cache.getLocation().id;

      this.nsfo
        .doPostRequest(API_URI_GET_TREATMENT_TEMPLATES + '/' + selectedTreatmentTemplate.type.toLowerCase(), requestData)
        .subscribe( (res: JsonResponseModel) => {
            if (typeof res.result.code !== 'undefined' && res.result.code === 500) {
              const errorDetails = new ErrorMessage();
              errorDetails.message = res.result.message;
              errorDetails.code = 500;
              this.declareErrorMessages.push(errorDetails);
              alert(errorDetails.message);
            }
          },
          error => {
            const errorDetails = this.nsfo.getErrorDetails(error);
            this.declareErrorMessages.push(errorDetails);
            alert(errorDetails.message);
          });
    }
  }
}
