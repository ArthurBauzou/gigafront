import { Component, ElementRef, QueryList, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { Message } from 'src/app/models/message.model';
import { SocketioService } from 'src/app/services/socketio.service';
import { UserService } from 'src/app/services/user.service';
import { UtilService } from 'src/app/services/util.service';


@Component({
  selector: 'app-main',
  templateUrl: './main.component.html',
  styleUrls: ['./main.component.css']
})
export class MainComponent {
  
  user = {id: '', name: '', color: ''}
  messages: Message[] = []
  promptHistory: string[] = []
  promptHistoryPosition: number = 0
  colorlist:string[] = []
  autoscroll: boolean = true;
  notMessage: string[] = []

  userlist: {[id:string]: {name:string,color:string,sockets:string[]}} = {};

  messageSub: Subscription;
  usersConnectedSub: Subscription;
  
  @ViewChild('messageB') textarea!:ElementRef   // boîte de saisie des messages
  @ViewChild('messD') messD!:ElementRef         // conteneur des messages
  @ViewChild('picker') picker!:ElementRef       // element caché pour choisir sa couleur

  constructor(
    private _socketService: SocketioService,
    private _utilService: UtilService,
    private _userService: UserService
    ) { 
    // ini des valeurs depuis services
    this.colorlist = this._utilService.colorlist
    this.notMessage = this._utilService.notMessage
    // abonnements
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
    let txtArea = this.textarea.nativeElement
    txtArea.addEventListener('keydown', (e:any) => {
      // envoyer le message avec entrée et non aller à la ligne
      if(e.key == 'Enter' && !e.shiftKey) {
        e.preventDefault()
        this.sendMessage(txtArea as HTMLTextAreaElement)
        txtArea.dispatchEvent(new Event('ngModelChange'))
      }
      // remonter dans l’historique
      if(e.key == 'ArrowUp' && this.promptHistory.length != 0 && this.promptHistoryPosition < this.promptHistory.length) {
        txtArea.value = this.promptHistory[this.promptHistoryPosition]
        this.promptHistoryPosition += 1
        txtArea.dispatchEvent(new Event('ngModelChange'))
      }
      // redescendre dans l’historique
      if (e.key == 'ArrowDown' && this.promptHistoryPosition > 0) {
        this.promptHistoryPosition -= 1
        txtArea.value = this.promptHistory[this.promptHistoryPosition]
        txtArea.dispatchEvent(new Event('ngModelChange'))
      }
    })
  }
  ngAfterViewInit() {
    this.iniTextarea();
    this.user = this._userService.user
  }
  ngAfterViewChecked() {
    this.autoScroll();
  }

  logout() {
    // reset valeurs locales
    this.user = {id:'',name:'',color:''}
    this.messages = []
    // nettoyage des abonnements
    this.messageSub.unsubscribe()
    this.usersConnectedSub.unsubscribe()
    // deconnexions dans les servcices
    this._socketService.disconnect()
    this._userService.disconnect()
  }

  sendMessage(txtArea:HTMLTextAreaElement) {
    let mess = txtArea.value
    if (mess != '' ) {
      this.writeHistory(mess)
      let message = new Message(this.user.name, this.user.id, this.user.color, mess)
      let command = message.parse().command
      if (command != '') { message = this.parseCommand(command, message) }
      if (['erreur','notif'].includes(message.style)) { this.messages.push(message) }
      else { this._socketService.sendMessage(message) }
      this.promptHistoryPosition = 0
      txtArea.value = ''
    }
  }
  writeHistory(prompt:string) {
    this.promptHistory.unshift(prompt)
    let psize = this.promptHistory.length
    if (psize > 20) { this.promptHistory.pop() }
  }
  changeColor(col:string) {
    this.user.color = col;
    this._socketService.userColorChange(this.user)
  }
  parseCommand(command:string, message:Message) {
    let res = new Message('',this.user.id,'','','')
    let body = message.parse().body
    switch(command) {
      // COMMANDE : CODE
      case 'code':
        if (body != '') {
          res.auteur = message.auteur
          res.couleur = message.couleur
          res.contenu = body
          res.style = 'code'
        }
        else {
          res.contenu = 'Impossible d’envoyer cette commande vide'
          res.style = 'erreur'
        }
        break;
      // COMMANDE : CITATION
      case 'quote':
      case 'q':
        if (body != '') {
          let cit = this.parseQuote(body)
          res.auteur = message.auteur
          res.couleur = message.couleur
          res.contenu = cit[0]
          res.style = 'quote'
          res.info = cit[1]
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
        if (body != '') {
          let arr = this.parseRoll(body)
          if (arr[0] == 0) {
            res.contenu = 'Impossible de jetter ce type de dés'
            res.style = 'erreur'
            return res
          } else {
            res.contenu = arr
          }
        } else {
          res.contenu = this._userService.params.rolldef
        }
        res.style = 'diceroll'
        res.auteur = message.auteur
        res.couleur = message.couleur
        res.info = this._utilService.generateId(24)
        break;
      // COMMANDE : DEFINIR LE JET DE DÉS PAR DÉFAUT
      case 'rolldef':
        let newdef = this.parseRoll(body)
        if (newdef[0] == 0) {
          res.style = 'erreur'
          res.contenu = 'Format de jet de dé invalide'
        }
        else {
          res.style = 'notif'
          res.contenu = 'Jet de dé par défaut changé'
          this._userService.updateParams({rolldef: newdef})
        }
        break;
      // COMMANDE NON RECONNUE
      default :
        res.contenu = 'Commande non reconnue'
        res.style = 'erreur'
    }
    return res
  }

  parseRoll(body:any) {
    let res = body.split(/[dD]+/)                   // découpe sur les D et les d
    if (res.length == 1) {res.unshift('1')}         // gestion du format 'd4'
    if (res[0] == "") {res[0]='1'}
    res = res.map((x:string) => parseInt(x,10))    
    let dicevalid = true                            // verif que les dés demandés sont autorisés
    for (let i=1; i<res.length; i++) {          
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

  parseQuote(body:string) {
    let arr = body.split('--')
    if (arr.length > 1) {
      console.log(arr)
    }
    return arr
  }


  // Ajustement de confort du chat (hauteurs, scroll)
  adjustHeight(el:HTMLElement){
    if (el.scrollHeight > 50) {
      el.style.height = "1px";
      el.style.height = (el.scrollHeight - 24)+"px";
      let h = el.style.height.split('px').map(x => parseInt(x))[0]
      if (h > 128) {el.style.height = '128px'}
    }
    if ((el as HTMLInputElement).value == '') {el.style.height = "18px"}
  }
  autoScroll() {
    if (this.autoscroll) {
      this.messD.nativeElement.scrollTop = this.messD.nativeElement.scrollHeight
    }
  }
  disableAutoScroll() {
    let scroll = this.messD.nativeElement.scrollTop
    let height = this.messD.nativeElement.scrollHeight
    let cheight = this.messD.nativeElement.clientHeight
    if (scroll + cheight < height) {
      this.autoscroll = false
    } else {
      this.autoscroll = true
    }
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


}
