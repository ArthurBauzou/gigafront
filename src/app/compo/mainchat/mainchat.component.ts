import { Component, ElementRef, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { Message } from 'src/app/models/message.model';
import { SocketioService } from 'src/app/socketio.service';


@Component({
  selector: 'app-mainchat',
  templateUrl: './mainchat.component.html',
  styleUrls: ['./mainchat.component.css']
})
export class MainchatComponent implements OnInit, OnDestroy {

  messages: Message[] = [];
  userlist = [];
  username= 'Arthur'
  usercolor= ''

  @ViewChild('picker') colorPickerWindow!: ElementRef
  
  decoyMess1 = {
    auteur: "lebron",
    couleur: "#C70039",
    contenu: "MESSAGE CONTENU LOL",
    date: new Date
  }
  // decoyMess2 = {
  //   auteur: "waaaaluigi",
  //   color: "#6d29ba",
  //   body: "Je te l’avais bien dit de faire attention à pas renverser la confiture gros dégeulasse",
  //   date: "28 juin 2022, 10h13m15s"
  // }
  // decoyMess3 = {
  //   auteur: "lebron",
  //   color: "#C70039",
  //   body: "Mais j’ai du étaler la confiotte avec une de tes fourchettes, si tu faisais la vaisselle aussi",
  //   date: "28 juin 2022, 10h13m15s"
  // }

  constructor(private _socketService: SocketioService) { }

  colorpick() {
    console.log(this.usercolor)
    this.colorPickerWindow.nativeElement.style.display = "flex"
  }

  iniColorPick() {
    const colordivs = document.querySelectorAll("#colorpicker .color")
    let colors: string[] = [];
    colordivs.forEach((el:Element) => {
      let code = el.getAttribute('colorCode')!;
      (el as HTMLElement).style.backgroundColor = code;
      colors.push(code);
    })
    this.usercolor = colors[Math.floor(Math.random()*8)]
  }

  ngAfterViewInit() {
    if (this.usercolor === '') {this.iniColorPick()}
    document.getElementById("colorpicker")!.style.backgroundColor = this.usercolor
  }
  ngOnInit(): void {
    this._socketService.setupSocketConnection();
    this.messages.push(this.decoyMess1)
  }
  ngOnDestroy(): void {
    this._socketService.disconnect()
  }

}
