import { Component, Input, OnInit, Output, EventEmitter } from '@angular/core';
import { NotificationUiService } from '../services/notification-ui.service';

@Component({
  selector: 'app-quill-editor-image-select',
  templateUrl: './quill-editor-image-select.component.html',
  styleUrls: ['./quill-editor-image-select.component.scss'],
})
export class QuillEditorImageSelectComponent implements OnInit {

  fileName : any = '';
  details: any = {};
  url: any = '';
  @Input() modal;
  uploadType: any = { name: "URL", value: "URL" };

  constructor(public notifiService: NotificationUiService) { }

  ngOnInit() { }

  onSave() {
    this.details.url = this.url;
    this.modal.dismiss(this.details);
  }

  onCancel(){
    this.modal.dismiss();
  }

  getBase64URL(event: any) {
    this.fileName = event.target.value;
    var file = event.target.files[0];
    if (file) {
      var reader = new FileReader();
      reader.readAsDataURL(file);
      this.details.fileName = file.name;
      reader.onload = (e: any) => {
        this.details.base64Content = e.target.result;
      }
      event.target.value = "";
    }
  };

  deleteImage() {
    this.fileName = '';
    delete this.details.fileName;
    delete this.details.base64Content;
  }
}

