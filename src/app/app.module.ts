import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';

import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt'

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainchatComponent } from './compo/mainchat/mainchat.component';
import { SocketioService } from './socketio.service';
import { DiceComponent } from './compo/dice/dice.component';

@NgModule({
  declarations: [
    AppComponent,
    MainchatComponent,
    DiceComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule
  ],
  providers: [
    { provide: JWT_OPTIONS, 
      useValue: JWT_OPTIONS }, 
      JwtHelperService, 
      SocketioService
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
