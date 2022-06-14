import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { Message } from 'src/app/models/message.model';
import { SocketioService } from 'src/app/socketio.service';


@Component({
  selector: 'app-mainchat',
  templateUrl: './mainchat.component.html',
  styleUrls: ['./mainchat.component.css']
})
export class MainchatComponent implements OnInit, OnDestroy {
  
  colorlist = ['#ff2a2aff','#ff6600ff','#ffcc00ff','#44aa00ff','#00aad4ff','#0000aaff','#7137c8ff','#c837abff']
  username= ''
  usercolor= ''
  messageSub: Subscription;
  messages: Message[] = []
  
  constructor(private _socketService: SocketioService) { 
    this.messageSub = this._socketService.watchMessages().subscribe((m) => {
      this.messages.push(m)
    });
   }
  
  // fonctions automatiques du cysle de vie des composants
  ngOnInit(): void {
    this._socketService.setupSocketConnection();
  }

  ngOnDestroy(): void {
    this._socketService.disconnect()
  }

  // fonctions d’input
  loguser(form:any) {
    this.username = form.value.username
    this.iniColorPick()
  }
  sendMessage(form:any) {
    let message = new Message(this.username, this.usercolor, form.value.message)
    console.log(message)
    this._socketService.sendMessage(message)
  }

  // création du colorpicker
  iniColorPick() {
    let colorbutton = document.getElementById('colorpicker')!
    let colorpicker = colorbutton.querySelector('div')!

    for (let col of this.colorlist) {
      let d = document.createElement('div')
      d.classList.add('color')
      d.style.backgroundColor = col

      d.addEventListener('click', (e) => {
            e.stopPropagation()
            this.usercolor = col;
            colorbutton.style.backgroundColor = this.usercolor
            colorpicker.classList.add("hidd")
          })

      colorpicker.append(d)
    }
    
    if (this.usercolor === '') {
      this.usercolor = this.colorlist[Math.floor(Math.random()*this.colorlist.length)]
    }
    colorbutton.style.backgroundColor = this.usercolor

  }


}
