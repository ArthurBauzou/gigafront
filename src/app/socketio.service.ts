import { Injectable } from '@angular/core';
import { io } from 'socket.io-client'
import { environment } from 'src/environments/environment';
import { Message } from './models/message.model';
import { BehaviorSubject, Observable } from 'rxjs'

@Injectable({
  providedIn: 'root'
})
export class SocketioService {

  socket:any;

  private message$ = new BehaviorSubject<Message>(new Message('','',''))

  constructor() { }

  sendMessage(message:Message) {
    this.socket.emit('message0', message)
  }
  watchMessages() {
    return this.message$.asObservable()
  }

  setupSocketConnection() {
    this.socket = io(environment.SOCKET_ENDPOINT)
    this.socket.on('emission0', (data:any) => {
      // console.log(data)
      this.message$.next(data)
    })
  }
  disconnect(){
    if(this.socket){this.socket.disconnect()}
  }

}
