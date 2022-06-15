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
  username= 'Arthur'
  usercolor= ''
  messageSub: Subscription;
  messages: Message[] = []
  userlist= [
    {
      username: "PascalBrutal",
      color: '#ff6600ff'
    },
    {
      username: "Octoblubos",
      color: '#00aad4ff'
    }
  ]
  
  @ViewChild('messageB') textarea!:ElementRef

  constructor(private _socketService: SocketioService) { 
    this.messageSub = this._socketService.watchMessages().subscribe((m) => {
      this.messages.push(m)
    });
   }
  
  // fonctions automatiques du cysle de vie des composants
  ngOnInit(): void {
    this._socketService.setupSocketConnection();
    this.iniColorPick()
  }
  ngAfterViewInit() {
    this.iniTextarea()
  }
  ngOnDestroy(): void {
    this._socketService.disconnect()
  }

  adjustHeight(el:HTMLElement){
    el.style.height = "1px";
    console.log((el as HTMLInputElement).value)
    el.style.height = (el.scrollHeight - 16)+"px";
    if ((el as HTMLInputElement).value == '') {el.style.height = "18px"}
  }

  // fonctions d’input
  loguser(form:any) {
    this.username = form.value.username
  }
  sendMessage(form:any) {
    if (form.value.message != '') {
      let message = new Message(this.username, this.usercolor, form.value.message)
      form.reset();
      this._socketService.sendMessage(message)
    }
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
  
  iniTextarea() {
    this.textarea.nativeElement.addEventListener('keydown', (e:any) => {
      if(e.key == 'Enter' && !e.shiftKey) { e.preventDefault() }
    })
  }

}
