import { Component, OnDestroy, OnInit } from '@angular/core';
import { SocketioService } from 'src/app/socketio.service';

@Component({
  selector: 'app-mainchat',
  templateUrl: './mainchat.component.html',
  styleUrls: ['./mainchat.component.css']
})
export class MainchatComponent implements OnInit, OnDestroy {

  userlist = [];
  user = {
    username: 'Arthur',
    avatar: '../assets/images/chatriste.jpg'
  };
  
  decoyMess1 = {
    auteur: "lebron",
    color: "#C70039",
    avatar: "../assets/images/LeBron_James.jpg",
    body: "C’est pas vrai il y a encore des fourmis !",
    date: "28 juin 2022, 10h13m15s"
  }
  decoyMess2 = {
    auteur: "waaaaluigi",
    color: "#6d29ba",
    avatar: "../assets/images/waluigi.jpg",
    body: "Je te l’avais bien dit de faire attention à pas renverser la confiture gros dégeulasse",
    date: "28 juin 2022, 10h13m15s"
  }
  decoyMess3 = {
    auteur: "lebron",
    color: "#C70039",
    avatar: "../assets/images/LeBron_James.jpg",
    body: "Mais j’ai du étaler la confiotte avec une de tes fourchettes, si tu faisais la vaisselle aussi",
    date: "28 juin 2022, 10h13m15s"
  }

  messages = [this.decoyMess1, this.decoyMess2, this.decoyMess3];

  constructor(private _socketService: SocketioService) { }

  ngOnInit(): void {
    this._socketService.setupSocketConnection();
  }
  ngOnDestroy(): void {
    this._socketService.disconnect()
  }

}
