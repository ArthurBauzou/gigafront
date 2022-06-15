import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { Message } from 'src/app/models/message.model';
import { SocketioService } from 'src/app/socketio.service';

@Component({
  selector: 'app-mainchat',
  templateUrl: './mainchat.component.html',
  styleUrls: ['./mainchat.component.css']
})
export class MainchatComponent implements OnDestroy {
  
  colorlist = ['#D40000ff','#ff6600ff','#D4AA00ff','#558b2fff','#00CCFFFF','#0066FFff','#7137c8ff','#c837abff']
// colorlist = [ '#37474F','#3949AB','#1E88E5','#00B8D4',
//               '#4E342E','#1B5E20','#558B2F','#8BEB09',
//               "#4527A0","#880E4F","#C62828","#FF4081"]
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
  @ViewChild('picker') picker!:ElementRef

  constructor(private _socketService: SocketioService) { 
    this.messageSub = this._socketService.watchMessages().subscribe((m) => {
      this.messages.push(m)
    });
    this.usersConnectedSub = this._socketService.watchUsers().subscribe((list) => {
      this.userlist = list;
    })
   }
  
  // fonctions automatiques du cycle de vie des composants
  ngAfterViewInit() {
    this.iniTextarea()
  }
  ngOnDestroy(): void {
    this._socketService.disconnect()
  }
  
  // fonctions d’interactions avec le socket
  loguser(form:any) {
    this.user.name = form.value.username
    this.user.id = this.generateId()
    this.user.color = this.colorlist[Math.floor(Math.random()*this.colorlist.length)]
    this._socketService.setupSocketConnection(this.user);
  }
  logout() {
    this._socketService.disconnect();
    this.messages = []
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
  iniTextarea() {
    this.textarea.nativeElement.addEventListener('keydown', (e:any) => {
      if(e.key == 'Enter' && !e.shiftKey) { e.preventDefault() }
    })
  }

  // FONCTIONS UTILITAIRES
  changeColor(col:string) {
    this.user.color = col;
    this._socketService.userColorChange(this.user)
  }
  adjustHeight(el:HTMLElement){
    el.style.height = "1px";
    el.style.height = (el.scrollHeight - 16)+"px";
    if ((el as HTMLInputElement).value == '') {el.style.height = "18px"}
  }
  dec2hex (dec:number) {
    return dec.toString(16).padStart(2, "0")
  }
  generateId (len?:number) {
    var arr = new Uint8Array((len || 40) / 2)
    window.crypto.getRandomValues(arr)
    return Array.from(arr, this.dec2hex).join('')
  }
  
}
