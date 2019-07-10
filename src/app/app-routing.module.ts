import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { VisComponent } from './vis/vis.component';
import { MessageComponent } from './message/message.component';
import { AdminComponent } from './admin/admin.component';

const routes: Routes = [
  {path: '', pathMatch: 'full', redirectTo: 'message'},
  {path: 'vis', component: VisComponent},
  {path: 'message', component: MessageComponent},
  {path: 'admin', component: AdminComponent},
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
