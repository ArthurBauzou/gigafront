import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  colorlist = ['#D40000','#ff6600','#D4AA00','#558b2f','#00CCFF','#0066FF','#7137c8','#c837ab']
  notMessage = ['diceroll', 'code', 'quote']
  palette01 = ['#000000','#6f6776','#9a9a97','#c5ccb8','#8b5580','#c38890','#a593a5','#666092','#9a4f50','#c28d75','#7ca1c0','#416aa3','#8d6268','#be955c','#68aca9','#387080','#6e6962','#93a167','#6eaa78','#557064','#9d9f7f','#7e9e99','#5d6872','#433455']

  constructor() { }

  randomColor(list:string[]):string {
    let col:string = list[Math.floor(Math.random()*list.length)]
    return col
  }

  // FONCTIONS POUR LA CRÉATION D’IDENTIFIANT ALÉATOIRE
  dec2hex (dec:number) {
    return dec.toString(16).padStart(2, "0")
  }
  generateId (len?:number) {
    var arr = new Uint8Array((len || 40) / 2)
    window.crypto.getRandomValues(arr)
    return Array.from(arr, this.dec2hex).join('')
  }


}
