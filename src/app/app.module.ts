import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainchatComponent } from './compo/mainchat/mainchat.component';
import { SocketioService } from './socketio.service';

@NgModule({
  declarations: [
    AppComponent,
    MainchatComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule
  ],
  providers: [SocketioService],
  bootstrap: [AppComponent]
})
export class AppModule { }
