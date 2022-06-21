import { Component } from '@angular/core';

interface Dice {
  sides: number;
  element: HTMLElement;
  anims: Array<any>;
  result: string;
}

@Component({
  selector: 'app-dice',
  templateUrl: './dice.component.html',
  styleUrls: ['./dice.component.css']
})
export class DiceComponent {

  dices: Dice[] = []
  dims = {x:32,y:44}
  query = [6,6]
  color = "#D4AA00ff"

  constructor() {
  }

  ngAfterViewInit() {
    let container = document.querySelector('.diceContainer')! as HTMLElement
    container.style.border = `3px ${this.color} solid`
    let diceDivs = document.querySelectorAll('.dice')
    diceDivs.forEach((d,i) => {
      this.dices[i] = {
        sides: this.query[i],
        element: d as HTMLElement,
        anims: [],
        result: ''
      }
      let s = this.query[i]
      d.querySelectorAll('p').forEach( (f,j) => {
        f.innerHTML = this.toss(s)
        f.style.bottom = `${j*this.dims.y}px`;
        let anim = setInterval(() => {
          this.slide(f,s,this.dims.y)
        }, 8)
        this.dices[i].anims[j] = anim
      })
    })
  }

  toss(sides:number):string {
    let res = Math.random()*sides
    res = (sides == 10)? Math.floor(res) : Math.ceil(res)
    return res.toString()
  }

  slide (e:HTMLElement,s:number,y:number) {
    let p = parseInt(e.style.bottom)
    if (p < -y) {
      e.style.bottom = `${2*y}px`
      e.innerHTML = this.toss(s)
    } else {
      e.style.bottom = `${p-12}px`
    }
  }
  // slideNstop (e:HTMLElement,s:number,y:number) {
  //   let p = parseInt(e.style.bottom)
  //   if (p < -y) {
  //     e.style.bottom = `${2*y}px`
  //     e.innerHTML = this.toss(s)
  //   } else {
  //     e.style.bottom = `${p-12}px`
  //   }
  // }

  stop(i:number) {
    let dice = this.dices[i]
    this.dices[i].anims = []
    dice.anims.forEach((a:any) => {
      clearInterval(a)
    })
    dice.element.querySelectorAll('p').forEach( (f,j) => {
      let speed = 12
      let y = this.dims.y
      let animStop = setInterval( () => {
        let p = parseInt(f.style.bottom)
        if (p < -y) {
          f.style.bottom = `${2*y}px`
          f.innerHTML = this.toss(dice.sides)
        } else {
          f.style.bottom = `${p-speed}px`
          speed -= 0.3
        }
        if (speed < 0) {
          clearInterval(animStop)
        }
      },8)
      this.dices[i].anims[j] = animStop
    })
  }

  findWin() {}

}
