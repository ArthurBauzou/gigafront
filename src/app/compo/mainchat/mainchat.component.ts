import { Component, ElementRef, OnDestroy, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { Message } from 'src/app/models/message.model';
import { SocketioService } from 'src/app/socketio.service';
import { JwtHelperService } from '@auth0/angular-jwt';


@Component({
  selector: 'app-mainchat',
  templateUrl: './mainchat.component.html',
  styleUrls: ['./mainchat.component.css']
})
export class MainchatComponent {
  
  colorlist = ['#D40000ff','#ff6600ff','#D4AA00ff','#558b2fff','#00CCFFFF','#0066FFff','#7137c8ff','#c837abff']
  user = {id: '', name: '', color: '' }
  messages: Message[] = []

  userlist = new Map;
  token:any = {}
  params:any = {
    autoreco: false
  }
  messageSub: Subscription;
  usersConnectedSub: Subscription;
  
  @ViewChild('messageB') textarea!:ElementRef
  @ViewChild('picker') picker!:ElementRef

  constructor(
    private _socketService: SocketioService,
    private _jwtHelper: JwtHelperService
    ) { 
    this.messageSub = this._socketService.watchMessages().subscribe((m) => {
      this.messages.push(m)
    });
    this.usersConnectedSub = this._socketService.watchUsers().subscribe((list) => {
      this.userlist = list;
    })
   }
  
  // INITIALISATIONS
  iniTextarea() {
    this.textarea.nativeElement.addEventListener('keydown', (e:any) => {
      if(e.key == 'Enter' && !e.shiftKey) { e.preventDefault() }
    })
  }
  ngAfterViewInit() {
    this.iniTextarea();
    this.checkToken();
    this.checkParams();
    if (this.params.autoreco) {
      this.reconnect()
    }
  }

  // fonctions de gbestion du stockage local
  checkToken() {
    let tkn: string | null = localStorage.getItem('userToken')
    if (tkn) { this.token = this._jwtHelper.decodeToken(tkn) }
  }
  checkParams() {
    let params = localStorage.getItem('userParams')
    if (params) {this.params =  JSON.parse(params)}
  }
  reconnect() {
    this.user.name = this.token.name;
    this.user.color = this.token.color;
    this.user.id = this.token.id;
    this._socketService.setupSocketConnection(this.user);
  }
  purgeToken() {
    this.token = {}
    localStorage.removeItem('userToken')
  }
  autoconnect() {
    if (!this.params.autoreco) {
      localStorage.setItem('userParams', '{"autoreco": true}')
      this.params.autoreco = true
    }
    else {
      localStorage.setItem('userParams', '{"autoreco": false}')
      this.params.autoreco = false
    }
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
    this.checkToken();
  }
  sendMessage(form:any) {
    if (form.value.message != '') {
      let message = new Message(this.user.name, this.user.color, form.value.message)
      form.reset();
      this._socketService.sendMessage(message)
    }
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
