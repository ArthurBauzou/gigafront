import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import { HighlightModule, HIGHLIGHT_OPTIONS } from 'ngx-highlightjs';

import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt'

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './compo/main/main.component';
import { SocketioService } from './services/socketio.service';
import { DiceComponent } from './compo/dice/dice.component';
import { HomeComponent } from './compo/home/home.component';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    DiceComponent,
    HomeComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    FormsModule,
    HighlightModule
  ],
  providers: [
    { provide: JWT_OPTIONS, 
      useValue: JWT_OPTIONS }, 
      JwtHelperService, 
      SocketioService,
      { provide: HIGHLIGHT_OPTIONS,
        useValue: { fullLibraryLoader: () => import('highlight.js') }}
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
