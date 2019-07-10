import { Component, OnInit } from '@angular/core';
import { FirebaseService } from '../firebase.service';
import { map, take } from 'rxjs/operators';

@Component({
  selector: 'app-admin',
  templateUrl: './admin.component.html',
  styleUrls: ['./admin.component.scss']
})
export class AdminComponent implements OnInit {

  notesSubscription;
  notesData;

  constructor(private fs: FirebaseService) { }

  ngOnInit() {
    this.notesSubscription = this.fs
    .getAllNotes()
    .pipe(
      map(col =>
        col.map(d => {
          return {
            noteId: d.payload.doc.id,
            ...d.payload.doc.data()
          };
        })
      )
    )
    .subscribe(data => {
      this.notesData = data;
    });
  }

  public onDeleteNote(noteId) {
    this.fs.deleteNoteById(noteId);
  }

}
