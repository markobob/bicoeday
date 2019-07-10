import { Injectable } from '@angular/core';
import { AngularFirestore } from '@angular/fire/firestore';
import { AngularFireAuth } from '@angular/fire/auth';


@Injectable({
  providedIn: 'root'
})
export class FirebaseService {

  constructor(private afs: AngularFirestore, private as: AngularFireAuth) { }

  getAllNotes() {
    return this.afs
      .collection('notes', ref => ref.orderBy('createdDate', 'desc'))
      .snapshotChanges();
  }

  saveNote(nodeData) {
    console.log('adding note:', nodeData);
    const batch = this.afs.firestore.batch();
    const newNoteId = this.afs.createId();

    const newNoteData = {
      noteId: newNoteId,
      userId: '0',
      lastModifiedDate: new Date(),
      createdDate: new Date(),
      ...nodeData
    };
    const newNoteRef = this.afs.doc(`notes/${newNoteId}`).ref;

    batch.set(newNoteRef, newNoteData);

    batch
      .commit()
      .then(() => {
        // insert create node...
        console.log('firestore note saved');
      })
      .catch(function(err) {
        console.error('firestore saveNote failed', err);
      });
  }

  deleteNoteById(noteID) {
    this.afs
      .doc(`notes/${noteID}`)
      .delete()
      .then(() => {
        console.log('note deleted');
      })
      .catch(err => {
        console.error('firestore error deleting note', err);
      });
  }

}
