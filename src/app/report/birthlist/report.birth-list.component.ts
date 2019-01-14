import { Component, EventEmitter, OnInit } from '@angular/core';

import { PedigreeRegister } from '../../shared/models/pedigree-register.model';
import { DownloadService } from '../../shared/services/download/download.service';

@Component({
  selector: 'app-birth-list-report',
  templateUrl: './report.birth-list.component.html',
})
export class ReportBirthListComponent {

  public breedCode: string;
  public pedigreeRegister: PedigreeRegister;

  public isBreedCodeActive = false;
  public isPedigreeRegisterActive = false;

  constructor(private downloadService: DownloadService) {}

  download() {
    this.generateReport();
  }

  private generateReport() {
    const breedCode = this.isBreedCodeActive ? this.breedCode : null;
    const pedigreeRegisterAbbreviation = (this.isPedigreeRegisterActive &&
      this.pedigreeRegister !== null && this.pedigreeRegister !== undefined) ?
      this.pedigreeRegister.abbreviation : null;

    this.downloadService.doBirthListReportGetRequest(breedCode, pedigreeRegisterAbbreviation);
  }
}
