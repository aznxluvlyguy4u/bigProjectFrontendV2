export class DownloadRequest {
  public id: number;
  public fileType: string;
  public downloadType: string;
  public url: string;
  public isCompleted: boolean;
  public isFailed: boolean;
  public isDownloaded: boolean;
  public reportCount: number | string;
  public errorMessage: string;
  public logDate: Date;
  public hash: string;
}
