import {Component, OnDestroy, OnInit} from '@angular/core';
import {FormControl, FormGroup, FormBuilder} from '@angular/forms';
import {TranslateService} from '@ngx-translate/core';
import {NSFOService} from '../../shared/services/nsfo-api/nsfo.service';
import {API_URI_GET_CMS, API_URI_SEND_MESSAGE} from '../../shared/services/nsfo-api/nsfo.settings';
import {SettingsService} from '../../shared/services/settings/settings.service';
import {UtilsService} from '../../shared/services/utils/utils.services';

@Component({
  templateUrl: './contact.component.html',
})

export class ContactComponent implements OnInit, OnDestroy {
  private form: FormGroup;
  private feedback = '';
  private userEmail = '';
  private category_default = '';
  private category = '';
  private mood_default = '';
  private mood = '';
  private contactInfo = '';
  private userInfo$;

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

  private initTranslation() {
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

  private getContactInfo() {
    this.apiService.doGetRequest(API_URI_GET_CMS)
      .subscribe(res => {
          if (res.json().result) {
            this.contactInfo = res.json().result.contact_info;
          }
        },
        error => {
          alert(this.apiService.getErrorMessage(error));
        });
  }

  private getUserInfo() {
    this.userInfo$ = this.utils.getUserInfo()
      .subscribe(res => {
        this.userEmail = res.email_address;
      });
  }

  private sendMessage() {
    const request = {
      email: this.userEmail,
      category: this.category,
      mood: this.mood,
      message: this.form.get('message').value
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
