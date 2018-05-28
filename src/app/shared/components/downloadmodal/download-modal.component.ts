import {Component, OnDestroy, OnInit} from '@angular/core';

import {DownloadRequest} from '../../services/download/download-request.model';
import {DownloadService} from '../../services/download/download.service';
import {PDF} from '../../variables/file-type.enum';
import {Subscription} from 'rxjs';

@Component({
  selector: 'app-download-modal',
  templateUrl: './download-modal.component.html'
})
export class DownloadModalComponent implements OnInit, OnDestroy {
  public downloadRequestsShownInModal: DownloadRequest[];
  private modalDisplay = 'none';
  private downloadRequestSubscription: Subscription;
  private isModalActiveSubscription: Subscription;
  private toggleModalSubscription: Subscription;

  constructor(private downloadService: DownloadService) {
  }


  ngOnInit() {

    this.downloadRequestSubscription = this.downloadService.downloadsShownInModalChanged.subscribe(
      (downloadRequests: DownloadRequest[]) => {
        this.downloadRequestsShownInModal = downloadRequests;
        this.closeIfEmpty();
      }
    );
    this.downloadRequestsShownInModal = this.downloadService.getDownloadRequestsShownInModal();


    this.isModalActiveSubscription = this.downloadService.isModalActive.subscribe(
      (notifyUser: boolean) => {
        if (notifyUser) {
          this.openModal();
        } else {
          this.closeModal();
        }
      }
    );


    this.toggleModalSubscription = this.downloadService.toggleIsModalActive.subscribe(
      (toggleModal: boolean) => {
        if (toggleModal) {
          this.toggleModal();
        }
      }
    );
  }

  closeIfEmpty() {
    if (this.downloadRequestsShownInModal.length === 0) {
      this.closeModal();
    }
  }

  ngOnDestroy() {
    this.downloadRequestSubscription.unsubscribe();
    this.isModalActiveSubscription.unsubscribe();
    this.toggleModalSubscription.unsubscribe();
  }

  public openModal() {
    this.modalDisplay = 'block';
  }

  public closeModal() {
    this.modalDisplay = 'none';
  }

  public toggleModal() {
    if (this.modalDisplay === 'none') {
      this.openModal();
    } else {
      this.closeModal();
    }
  }


  public downloadFile(downloadRequest: DownloadRequest) {

    if (downloadRequest.fileType === PDF) {
      const win = window.open('/loading', '_blank');
      win.location.href = downloadRequest.url;
    } else {
      const win = window.open('/downloaded', '_blank');
      win.location.href = downloadRequest.url;
    }

    this.downloadService.downloadFile(downloadRequest);
  }


  public resetDownloadList() {
    this.downloadService.resetDownloadList();
  }

  public removeDownloadedAndFailedDownloads() {
    this.downloadService.removeDownloadedAndFailedDownloads();
  }

  public isModalEmpty(): boolean {
    return this.downloadService.isModalEmpty();
  }

  public hasFailedDownloads() {
    return this.downloadService.failedDownloadsCount > 0;
  }
}
