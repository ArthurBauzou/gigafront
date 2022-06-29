import { Injectable } from '@angular/core';
import { io } from 'socket.io-client'
import { environment } from 'src/environments/environment';
import { Message } from '../models/message.model';
import { Subject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class SocketioService {

  socket:any;

  private message$ = new Subject<Message>()
  private users$ = new Subject<any>()
  private diceRes$ = new Subject<any>()
  private drawatch$ = new Subject<any>()

  constructor() { }

  // FONCTIONS D’OBSERVABLES
  watchMessages() {
    return this.message$.asObservable()
  }
  watchUsers() {
    return this.users$.asObservable()
  }
  watchDiceRes() {
    return this.diceRes$.asObservable()
  } 
  watchDraw() {
    return this.drawatch$.asObservable()
  }

  sendMessage(message:Message) {
    this.socket.emit('send0', message)
  }
  userDeco(user:any) {
    this.socket.emit('leave0', user)
  }
  userColorChange(user:any) {
    this.socket.emit('color0', user)
  }
  sendDiceRes(res:any) {
    this.socket.emit('dice0', res)
  }
  sendPath(path:any) {
    this.socket.emit('path0', path)
  }

  setupSocketConnection(user:any) {
    this.socket = io('http://glub.fr:3000')
    this.socket.emit('join0', user)
    this.socket.on('msg0', (msg:any) => { this.message$.next(msg) })
    this.socket.on('dice1', (res:any) => { this.diceRes$.next(res) })
    this.socket.on('path1', (path:any) => { this.drawatch$.next(path) })
    this.socket.on('user0', (userlist:any) => { this.users$.next(userlist) })
    this.socket.on('token0', (token:string) => { localStorage.setItem("userToken", token) })
  }
  disconnect(){
    if(this.socket){
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }
  }

}
