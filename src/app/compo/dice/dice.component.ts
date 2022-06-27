import { Component, ElementRef, Input, ViewChild } from '@angular/core';
import { Subscription } from 'rxjs';
import { SocketioService } from 'src/app/services/socketio.service';

interface Dice {
  sides: number;
  element: HTMLElement;
  result: string;
  stop: boolean;
}

@Component({
  selector: 'app-dice',
  templateUrl: './dice.component.html',
  styleUrls: ['./dice.component.css']
})
export class DiceComponent {

  SPEED = 12
  WINSTYLE = '#929292'
  DIMS = {x:32,y:46}

  @Input() diceuser!: { id: string; color: string; };
  @Input() dicetype: number[] = []
  @Input() diceID: string = ''
  @Input() userid: string = ''

  dices: Dice[] = []
  commentary: string[] = []

  diceResSub?: Subscription;

  @ViewChild('dicecontainer') dcont!: ElementRef

  constructor(private _socketService: SocketioService) {
    console.log('subscribed !')
    this.diceResSub = this._socketService.watchDiceRes().subscribe((res) => {
      if (res.diceid == this.diceID && res.user == this.diceuser.id) {
        this.pickwin(res.diceIndex,res.result)
        if (this.checkDone()) {this.diceResSub!.unsubscribe() ; console.log("unsubscribed !")}
      }
    })
  }

  ngAfterViewInit() {
    let container = this.dcont.nativeElement
    let diceDivs = container.querySelectorAll('.dice')

    diceDivs.forEach((d:HTMLElement,i:number) => {
      let nbFace = this.dicetype[i]
      this.dices[i] = {
        sides: nbFace,
        element: d as HTMLElement,
        result: '',
        stop: false
      }
      if (nbFace > 10) {d.style.width = "50px"}
      d.querySelector('.diceLabel')!.innerHTML = `d${nbFace}`

      d.querySelectorAll('p:not(.winner)').forEach( (f,j) => {
        let el = f as HTMLElement
        el.innerHTML = this.faceroll(nbFace)
        if (this.userid == this.diceuser.id) {el.classList.add('allowed')}
        el.style.bottom = `${j*this.DIMS.y}px`;
        let anim = setInterval(() => {
          this.roll(el,this.dices[i],anim)
        }, 8)
      })
    })

    if (this.diceuser.id == this.userid) {
      this.diceResSub!.unsubscribe() ; console.log("unsubscribed !")
    }
  }

  faceroll(sides:number):string {
    let res:number = Math.random()*sides
    if ([10,100].includes(sides)) {res = Math.floor(res)}
    else {res = Math.ceil(res)}
    
    if (sides == 100 || sides == 20) {
      let res2:string = res.toString().padStart(2,'0')
      return res2
    } else {
      return res.toString()
    }
  }

  roll(e:HTMLElement,d:Dice,a:any) {
    let pos = parseInt(e.style.bottom)
    if (e.style.backgroundColor == this.WINSTYLE) {clearInterval(a)}
    if (pos < -this.DIMS.y) {
      if (d.stop == false) {
        e.style.bottom = `${2*this.DIMS.y}px`;
        e.innerHTML = this.faceroll(d.sides)
      }
      else {clearInterval(a)}
    } 
    else {
      e.style.bottom = `${pos-this.SPEED}px`
    }
  }

  pickwin(i:number,forceRes?:number) {
    if (this.diceuser.id == this.userid && this.dices[i].stop == false) {
      this.dices[i].stop = true;
      // création du resultat au dessus du reste
      let winp = this.dices[i].element.querySelector('.winner')! as HTMLElement
      winp.innerHTML = this.faceroll(this.dices[i].sides)
      this.dices[i].result = winp.innerHTML
      winp.style.backgroundColor = this.WINSTYLE
      winp.classList.remove('winner')
      this.dices[i].element.append(winp)
      winp.style.bottom = `${3*this.DIMS.y}px`
      this.stop(winp)
      // envoi du resultat
      let diceresult = {
        diceid: this.diceID,
        diceIndex: i,
        user: this.diceuser.id,
        result: winp.innerHTML
      }
      this._socketService.sendDiceRes(diceresult)
    }
    // stop déclenché à distance
    if (forceRes) {
      this.dices[i].stop = true;
      let winp = this.dices[i].element.querySelector('.winner')! as HTMLElement
      winp.innerHTML = forceRes.toString()
      this.dices[i].result = winp.innerHTML
      winp.style.backgroundColor = this.WINSTYLE
      winp.classList.remove('winner')
      this.dices[i].element.append(winp)
      winp.style.bottom = `${3*this.DIMS.y}px`
      this.stop(winp)
    }
  }

  stop(e:HTMLElement) {
    let speed = this.SPEED
    let accel = 0
    let posprev = 80
    let bounce = 5
    let offset = -7
    let animstop = setInterval(()=>{
      let pos = parseInt(e.style.bottom)
      // commence à agir quand on est dans la fenêtre du dé
      if (pos < this.DIMS.y ) {
        accel = pos/bounce
      }
      // s’arrête définitivement quand il est presque à l’arrêt et centré
      if (Math.abs(speed) < 1 && pos < offset+bounce && pos > offset-bounce ) {
        e.style.bottom = `${offset}px`
        clearInterval(animstop)
      }
      // sinon ça subit l’influence de l’acceleration
      else {
        speed += accel
        e.style.bottom = `${pos-(speed)}px`
      }
      // quand on passe le '0', la vitesse est limitée
      if (posprev > offset && parseInt(e.style.bottom) < offset && speed > 5) { speed = 5 }
      if (posprev < offset && parseInt(e.style.bottom) > offset && speed < -5) { speed = -5 }
      posprev = parseInt(e.style.bottom)
    },8)
  }

  checkDone() {
    let done = true
    this.dices.forEach((d)=>{
      if (d.stop == false) {done = false}
    })
    return done
  }

}
