import { Component, OnDestroy, OnInit } from '@angular/core';
import { SocketioService } from 'src/app/socketio.service';

@Component({
  selector: 'app-mainchat',
  templateUrl: './mainchat.component.html',
  styleUrls: ['./mainchat.component.css']
})
export class MainchatComponent implements OnInit, OnDestroy {

  constructor(private _socketService: SocketioService) { }

  ngOnInit(): void {
    this._socketService.setupSocketConnection();
  }
  ngOnDestroy(): void {
    this._socketService.disconnect()
  }

}
