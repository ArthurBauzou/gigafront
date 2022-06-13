import { Injectable } from '@angular/core';
import { io } from 'socket.io-client'
import { environment } from 'src/environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SocketioService {

  socket:any;
  constructor() { }

  setupSocketConnection() {
    this.socket = io(environment.SOCKET_ENDPOINT)
    this.socket.emit('message0', 'message sortant du client')
    this.socket.on('emission0', (data:string) => {
      console.log(data)
    })
  }
  disconnect(){
    if(this.socket){this.socket.disconnect()}
  }

}
