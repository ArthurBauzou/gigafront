import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class UtilService {

  colorlist = ['#D40000','#ff6600','#D4AA00','#558b2f','#00CCFF','#0066FF','#7137c8','#c837ab']
  notMessage = ['diceroll', 'code', 'quote']

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
