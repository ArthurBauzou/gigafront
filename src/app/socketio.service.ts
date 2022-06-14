import { Injectable } from '@angular/core';
import { io } from 'socket.io-client'
import { environment } from 'src/environments/environment';
import { Message } from './models/message.model';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {

  socket:any;


  constructor() { }

  sendMessage(message:Message) {
    this.socket.emit('message0', message.contenu)
  }

  setupSocketConnection() {
    this.socket = io(environment.SOCKET_ENDPOINT)
    this.socket.on('emission0', (data:string) => {
      console.log(data)
    })
  }
  disconnect(){
    if(this.socket){this.socket.disconnect()}
  }

}
