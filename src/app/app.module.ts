import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule } from '@angular/forms';
import {
  HighlightModule,
  HIGHLIGHT_OPTIONS,
  HighlightOptions,
} from 'ngx-highlightjs';
import { JwtHelperService, JWT_OPTIONS } from '@auth0/angular-jwt'

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { MainComponent } from './compo/main/main.component';
import { SocketioService } from './services/socketio.service';
import { DiceComponent } from './compo/dice/dice.component';
import { HomeComponent } from './compo/home/home.component';
import { CarnetComponent } from './compo/carnet/carnet.component';

@NgModule({
  declarations: [
    AppComponent,
    MainComponent,
    DiceComponent,
    HomeComponent,
    CarnetComponent
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
      {
        provide: HIGHLIGHT_OPTIONS,
        useValue: <HighlightOptions>{
          lineNumbers: true,
          coreLibraryLoader: () => import('highlight.js/lib/core'),
          themePath: 'node_modules/highlight.js/styles/github.css',
          languages: {
            typescript: () => import('highlight.js/lib/languages/typescript'),
            css: () => import('highlight.js/lib/languages/css'),
            xml: () => import('highlight.js/lib/languages/xml'),
          },
        },
      }
    ],
  bootstrap: [AppComponent]
})
export class AppModule { }
