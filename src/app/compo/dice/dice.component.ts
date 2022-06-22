import { Component, ElementRef, Input, ViewChild } from '@angular/core';

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

  SPEED = 10
  WINSTYLE = 'white'
  DIMS = {x:32,y:46}

  @Input() user!: { id: string; color: string; };
  @Input() dicetype: number[] = []

  dices: Dice[] = []

  @ViewChild('dicecontainer') dcont!: ElementRef

  constructor() {
  }

  ngAfterViewInit() {
    let container = this.dcont.nativeElement
    container.style.borderLeft = `5px ${this.user.color} solid`
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

      d.querySelectorAll('p:not(.winner)').forEach( (f,j) => {
        let el = f as HTMLElement
        el.innerHTML = this.faceroll(nbFace)
        el.style.bottom = `${j*this.DIMS.y}px`;
        let anim = setInterval(() => {
          this.roll(el,this.dices[i],anim)
        }, 8)
      })
    })
  }

  faceroll(sides:number):string {
    let res = Math.random()*sides
    if ([10,100].includes(res)) {res = Math.floor(res)}
    else {res = Math.ceil(res)}
    return res.toString()
  }

  roll(e:HTMLElement,d:Dice,a:any) {
    let pos = parseInt(e.style.bottom)
    if (e.style.backgroundColor == this.WINSTYLE) {console.log("winner: ",e);clearInterval(a)}
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
    if (this.dices[i].stop == false) {
      this.dices[i].stop = true;
      // création du resultat au dessus du reste
      let winp = this.dices[i].element.querySelector('.winner')! as HTMLElement
      winp.innerHTML = this.faceroll(this.dices[i].sides)
      winp.style.backgroundColor = this.WINSTYLE
      winp.classList.remove('winner')
      // winp.append(this.dices[i].element)
      this.dices[i].element.append(winp)
      winp.style.bottom = `${3*this.DIMS.y}px`
      this.stop(winp)
    }
  }

  stop(e:HTMLElement) {
    let speed = this.SPEED
    let accel = 0
    let posprev = 80
    let bounce = Math.ceil(Math.random()*10) + 5
    let animstop = setInterval(()=>{
      let pos = parseInt(e.style.bottom)
      // commence à agir quand on est dans la fenêtre du dé
      if (pos < this.DIMS.y ) {
        accel = pos/bounce
      }
      // s’arrête définitivement quand il est presque à l’arrêt et centré
      if (Math.abs(speed) < 1 && pos < bounce && pos > -bounce ) {
        e.style.bottom = '-3px'
        clearInterval(animstop)
      }
      // sinon ça subit l’influence de l’acceleration
      else {
        speed += accel
        e.style.bottom = `${pos-(speed)}px`
      }
      // quand on passe le '0', la vitesse est limitée
      if (posprev > 0 && parseInt(e.style.bottom) < 0 && speed > 5) { speed = 5 }
      if (posprev < 0 && parseInt(e.style.bottom) > 0 && speed < -5) { speed = -5 }
      posprev = parseInt(e.style.bottom)
    },8)
  }

}
