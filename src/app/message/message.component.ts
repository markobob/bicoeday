import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../firebase.service';

@Component({
  selector: 'app-message',
  templateUrl: './message.component.html',
  styleUrls: ['./message.component.scss']
})
export class MessageComponent implements OnInit {

  msg;

  constructor(private afs: FirebaseService) { }

  ngOnInit() {
  }

  onSubmit() {
    console.log(this.msg);
    const newNoteData = {
      title: 'Test note',
      contents: this.msg
    };
    this.afs.saveNote(newNoteData);
  }

}
