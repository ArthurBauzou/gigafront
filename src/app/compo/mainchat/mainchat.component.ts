import { Component, ElementRef, HostListener, OnDestroy, OnInit, ViewChild } from '@angular/core';
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
  user = {
    id: '',
    name: '',
    color: ''
  }
  messages: Message[] = []
  userlist: any[] = []

  messageSub: Subscription;
  usersConnectedSub: Subscription;
  
  @ViewChild('messageB') textarea!:ElementRef

  @HostListener('window:beforeunload', [ '$event' ])
  unloadHandler() {
    this._socketService.userDeco(this.user)
    this._socketService.disconnect()
  }

  constructor(private _socketService: SocketioService) { 
    this.messageSub = this._socketService.watchMessages().subscribe((m) => {
      this.messages.push(m)
    });
    this.usersConnectedSub = this._socketService.watchUsers().subscribe((list) => {
      this.userlist = list;
    })
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
    this._socketService.userDeco(this.user)
    this._socketService.disconnect()
  }

  adjustHeight(el:HTMLElement){
    el.style.height = "1px";
    el.style.height = (el.scrollHeight - 16)+"px";
    if ((el as HTMLInputElement).value == '') {el.style.height = "18px"}
  }

  // fonctions d’input
  loguser(form:any) {
    // USERNAME
    this.user.name = form.value.username
    // ID
    function dec2hex (dec:number) {
      return dec.toString(16).padStart(2, "0")
    }
    function generateId (len?:number) {
      var arr = new Uint8Array((len || 40) / 2)
      window.crypto.getRandomValues(arr)
      return Array.from(arr, dec2hex).join('')
    }
    this.user.id = generateId()
    // COLOR
    this.user.color = this.colorlist[Math.floor(Math.random()*this.colorlist.length)]
    document.getElementById('colorpicker')!.style.backgroundColor = this.user.color

    this._socketService.userCo(this.user)
  }
  logout() {
    this._socketService.userDeco(this.user)
    this.user = {id:'',name:'',color:''};
  }
  sendMessage(form:any) {
    if (form.value.message != '') {
      let message = new Message(this.user.name, this.user.color, form.value.message)
      form.reset();
      this._socketService.sendMessage(message)
    }
  }

  // INITIALISATIONS
  iniColorPick() {
    let colorbutton = document.getElementById('colorpicker')!
    let colorpicker = colorbutton.querySelector('div')!
    for (let col of this.colorlist) {
      let d = document.createElement('div')
      d.classList.add('color')
      d.style.backgroundColor = col
      d.addEventListener('click', (e) => {
        e.stopPropagation()
        this.user.color = col;
        this._socketService.userColor(this.user)
        colorbutton.style.backgroundColor = this.user.color
        colorpicker.classList.add("hidd")
      })
      colorpicker.append(d)
    }
  }
  
  iniTextarea() {
    this.textarea.nativeElement.addEventListener('keydown', (e:any) => {
      if(e.key == 'Enter' && !e.shiftKey) { e.preventDefault() }
    })
  }

}
