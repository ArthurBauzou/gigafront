import { Injectable } from '@angular/core';
import { io } from 'socket.io-client'
import { environment } from 'src/environments/environment';
import { Message } from './models/message.model';
import { BehaviorSubject, Observable, Subject } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class SocketioService {

  socket:any;

  private message$ = new Subject<Message>()
  private users$ = new Subject<any>()

  constructor() { }

  // FONCTIONS D’OBSERVABLES
  watchMessages() {
    return this.message$.asObservable()
  }
  watchUsers() {
    return this.users$.asObservable()
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

  setupSocketConnection(user:any) {
    this.socket = io(environment.SOCKET_ENDPOINT)
    this.socket.emit('join0', user)
    this.socket.on('msg0', (msg:any) => { this.message$.next(msg) })
    this.socket.on('user0', (userlist:any) => { this.users$.next(userlist) })
  }
  disconnect(){
    if(this.socket){
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }
  }

}
