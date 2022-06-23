import { Component, ElementRef, ViewChild } from '@angular/core';
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
  
  colorlist = ['#D40000','#ff6600','#D4AA00','#558b2f','#00CCFF','#0066FF','#7137c8','#c837ab']
  user = {id: '', name: '', color: ''}
  messages: Message[] = []
  promptHistory: string[] = []
  promptHistoryPosition: number = 0

  // userlist = new Map<string, {name:string,color:string,sockets:string[]}>;
  userlist: {[id:string]: {name:string,color:string,sockets:string[]}} = {};
  token:any = {}
  params:any = {
    autoreco: false,
    rolldef: [6,6]
  }
  messageSub: Subscription;
  usersConnectedSub: Subscription;
  
  @ViewChild('messageB') textarea!:ElementRef
  @ViewChild('picker') picker!:ElementRef

  constructor(
    private _socketService: SocketioService,
    private _jwtHelper: JwtHelperService
    ) { 
    this.messageSub = this._socketService.watchMessages().subscribe((m:Message) => {
      this.messages.push(m)
      this.msgFusion(this.messages)
    });
    this.usersConnectedSub = this._socketService.watchUsers().subscribe((list) => {
      this.userlist = list;
      this.messages.forEach((m)=>{
        m.couleur = this.userlist[m.auteurID].color
      })
    })
   }


  // INITIALISATIONS
  iniTextarea() {
    this.textarea.nativeElement.addEventListener('keydown', (e:any) => {
      if(e.key == 'Enter' && !e.shiftKey) { e.preventDefault() }
      if(e.key == 'ArrowUp') {
        this.textarea.nativeElement.value = this.promptHistory[this.promptHistory.length-1]
      }
    })
  }
  ngAfterViewInit() {
    this.iniTextarea();
    this.checkToken();
    this.checkParams();
    if (this.params.autoreco) { this.reconnect() }
  }
  
  // fonctions de gestion du stockage local
  checkToken() {
    let tkn: string | null = localStorage.getItem('userToken')
    if (tkn) { this.token = this._jwtHelper.decodeToken(tkn) }
  }
  checkParams() {
    let params = localStorage.getItem('userParams')
    if (params) {
      let jpar = JSON.parse(params)
      for (let p in jpar) {this.params[p] = jpar[p]}
    }
  }
  reconnect() {
    this.user.name = this.token.name;
    this.user.color = this.token.color;
    this.user.id = this.token.id;
    this._socketService.setupSocketConnection(this.user);
  }
  purgeToken() {
    localStorage.removeItem('userToken')
    this.token = {}
    localStorage.setItem('userParams', '{"autoreco": false}')
    this.params.autoreco = false
  }
  switchAutocoParam() {
    if (!this.params.autoreco) {
      this.params.autoreco = true
      localStorage.setItem('userParams', JSON.stringify(this.params))
    }
    else {
      this.params.autoreco = false
      localStorage.setItem('userParams', JSON.stringify(this.params))
    }
  }

  // fonctions d’interactions avec le socket
  loguser(form:any) {
    if (form.value.username != '') {
      this.user.name = form.value.username
      this.user.id = this.generateId()
      this.user.color = this.colorlist[Math.floor(Math.random()*this.colorlist.length)]
      this._socketService.setupSocketConnection(this.user);
    }
  }
  logout() {
    this._socketService.disconnect();
    this.messages = []
    this.messageSub.unsubscribe()
    this.usersConnectedSub.unsubscribe()
    this.user = {id:'',name:'',color:''};
    this.checkToken();
  }
  sendMessage(form:any) {
    let body = form.value.message
    if (body != '') {
      this.writeHistory(body)
      let message = new Message(this.user.name, this.user.id, this.user.color, body)
      let command = message.parse().command
      if (command != '') { message = this.parseCommand(command, message) }
      if (['erreur','notif'].includes(message.style)) { this.messages.push(message) }
      else { this._socketService.sendMessage(message) }
      form.reset();
    }
  }
  changeColor(col:string) {
    this.user.color = col;
    this._socketService.userColorChange(this.user)
  }


  parseCommand(command:string, message:Message) {
    let res = new Message('',this.user.id,'','','')
    switch(command) {
      // COMMANDE : CODE
      case 'code':
        let codebod = message.parse().body
        if (codebod != '') {
          res.auteur = message.auteur
          res.couleur = message.couleur
          res.contenu = codebod
          res.style = 'code'
        }
        else {
          res.contenu = 'Impossible d’envoyer cette commande vide'
          res.style = 'erreur'
        }
        break;
      // COMMANDE : JET DE DÉS
      case 'roll':
      case 'r':
      case 'dé':
        let dicetype = message.parse().body
        if (dicetype != '') {
          let arr = this.parseRoll(dicetype)
          if (arr[0] == 0) {
            res.contenu = 'Impossible de jetter ce type de dés'
            res.style = 'erreur'
            return res
          } else {
            res.contenu = arr
          }
        } else {
          res.contenu = this.params.rolldef
        }
        res.style = 'diceroll'
        res.auteur = message.auteur
        res.couleur = message.couleur
        res.info = this.generateId(24)
        break;
      // COMMANDE : DEFINIR LE JET DE DÉS PAR DÉFAUT
      case 'rolldef':
        let newdef = this.parseRoll(message.parse().body)
        if (newdef[0] == 0) {
          res.style = 'erreur'
          res.contenu = 'Format de jet de dé invalide'
        }
        else {
          res.style = 'notif'
          res.contenu = 'Jet de dé par défaut changé'
          this.params.rolldef = newdef
          localStorage.setItem('userParams', JSON.stringify(this.params))
        }
        break;
      // COMMANDE NON RECONNUE
      default :
        res.contenu = 'Commande non reconnue'
        res.style = 'erreur'
    }
    return res
  }

  parseRoll(a:any) {
    let res = a.split(/[dD]+/)                  // découpe sur les D et les d
    if (res.length == 1) {res.unshift('1')}     // gestion du format 'd4'
    if (res[0] == "") {res[0]='1'}
    res = res.map((x:any) => parseInt(x,10))    
    let dicevalid = true
    for (let i=1; i<res.length; i++) {          // verif que les dés demandés sont autorisés
      if (![3,4,6,8,10,12,20,100].includes(res[i])) {dicevalid = false}
    }
    if ( !dicevalid ||
      (res.length != 2 && res[0] != 1) ||       // seul cas ou on a plus de deux args : format 'd6 d8 d10'
      res.length > 4 ||                         // pas plus de trois dés differents
      res.includes(NaN) ||
      res[0] > 6 || res[0] <= 0     // pas plus de six dés du même type
    ) {
      res = [] ; res[0] = 0         // une erreur est annoncée par un tableau avec juste '0' dedans
    } 
    else if (res.length == 2) {     // la forme 'd4' est gérée, on a [1,4] en entrée et [4] en sortie
      let res2 = []
      for (let i=res[0] ; i>0 ; i--) { res2.push(res[1]) }         // boucle de traduction de 2d6 en [6,6]
      res = res2
    }
    else {             // les autres cas valides sont de la forme 'd6 d8 d10'
      res.shift()      // suppression du 1 au début de la chaine
    }
    return res
  }


  // FONCTIONS UTILITAIRES
  adjustHeight(el:HTMLElement){
    el.style.height = "1px";
    el.style.height = (el.scrollHeight - 16)+"px";
    let h = el.style.height.split('px').map(x => parseInt(x))[0]
    if (h > 128) {el.style.height = '128px'}
    if ((el as HTMLInputElement).value == '') {el.style.height = "18px"}
  }
  msgFusion(arr:Message[]) {
    let size = arr.length - 1
    if (size > 0){
      let d = new Date(arr[size].date)
      let d2 = new Date(arr[size-1].date)
      if( arr[size].auteurID == arr[size-1].auteurID && 
          arr[size].style == '' && arr[size-1].style == '' && 
          d.getTime() - d2.getTime() < 20000
      ){
        arr[size-1].contenu += '\n'+arr[size].contenu
        arr[size-1].date = arr[size].date
        arr.pop()
      }
    }
  }
  writeHistory(prompt:string) {
    this.promptHistory.push(prompt)
    let psize = this.promptHistory.length
    if (psize > 20) { this.promptHistory.shift() }
  }
  

  // FONCTION DE CRÉATION D’IDENTIFIANT ALÉATOIRE
  dec2hex (dec:number) {
    return dec.toString(16).padStart(2, "0")
  }
  generateId (len?:number) {
    var arr = new Uint8Array((len || 40) / 2)
    window.crypto.getRandomValues(arr)
    return Array.from(arr, this.dec2hex).join('')
  }
  
}
