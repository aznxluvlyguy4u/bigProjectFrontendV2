import {Injectable} from '@angular/core';
import {Subject} from 'rxjs';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_TREATMENT_TEMPLATES} from '../../shared/services/nsfo-api/nsfo.settings';
import {JsonResponseModel} from '../../shared/models/json-response.model';
import {TreatmentTemplate} from '../../shared/models/treatment-template.model';

@Injectable()
export class TreatmentService {
  treatmentTemplatesChanged = new Subject<TreatmentTemplate[]>();
  private treatmentTemplates: TreatmentTemplate[] = [];

  constructor(
    private nsfo: NSFOService
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
          this.notifyTreatmentTemplatesChanged();
        }
      );
  }
}
