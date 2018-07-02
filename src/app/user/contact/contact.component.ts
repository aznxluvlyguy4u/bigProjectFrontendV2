import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormBuilder} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_CMS, API_URI_SEND_MESSAGE} from '../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../shared/services/settings/settings.service';
import {UtilsService} from '../../shared/services/utils/utils.services';
import {JsonResponseModel} from '../../shared/models/json-response.model';

@Component({
  templateUrl: './contact.component.html',
})

export class ContactComponent implements OnInit, OnDestroy {
  public form: FormGroup;
  public feedback = '';
  public userEmail = '';
  public category_default = '';
  public category = '';
  public mood_default = '';
  public mood = '';
  public contactInfo = '';
  public userInfo$;
  public message = '';

  constructor(private apiService: NSFOService, private fb: FormBuilder, private settings: SettingsService,
              private utils: UtilsService, private translate: TranslateService) {
    this.initTranslation();
    this.form = fb.group({
      email: new FormControl(''),
      category: new FormControl(this.category_default),
      mood: new FormControl(this.mood_default),
      message: new FormControl('')
    });
  }

  ngOnInit() {
    this.getUserInfo();
    this.getContactInfo();
  }

  ngOnDestroy() {
    this.userInfo$.unsubscribe();
  }

  public initTranslation() {
    this.translate.get('GENERAL')
      .subscribe(
        res => {
          this.category_default = res;
          this.category = res;
        }
      );

    this.translate.get('HAPPY')
      .subscribe(
        res => {
          this.mood_default = res;
          this.mood = res;
        }
      );
  }

  public getContactInfo() {
    this.apiService.doGetRequest(API_URI_GET_CMS)
      .subscribe((res: JsonResponseModel) => {
          if (res.result) {
            this.contactInfo = res.result.contact_info;
          }
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        });
  }

  public getUserInfo() {
    this.userInfo$ = this.utils.getUserInfo()
      .subscribe(res => {
        this.userEmail = res.email_address;
      });
  }

  public sendMessage() {
    const request = {
      email: this.userEmail,
      category: this.category,
      mood: this.mood,
      message: this.message
    };

    this.apiService
      .doPostRequest(API_URI_SEND_MESSAGE, request)
      .subscribe(res => {
      });

    this.form.get('email').setValue('');
    this.form.get('message').setValue('');

    this.feedback = 'MESSAGE HAS BEEN SENT';
  }
}
