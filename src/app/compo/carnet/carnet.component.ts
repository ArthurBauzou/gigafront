import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { fabric } from 'fabric';
import { Path } from 'fabric/fabric-impl';
import { Subscription } from 'rxjs';
import { SocketioService } from 'src/app/services/socketio.service';
import { UserService } from 'src/app/services/user.service';


@Component({
  selector: 'app-carnet',
  templateUrl: './carnet.component.html',
  styleUrls: ['./carnet.component.css']
})
export class CarnetComponent implements OnInit {

  canvas:fabric.Canvas = new fabric.Canvas('canvas01')

  // dictionnaire des documents. Le document de chaque utilisateur en position [0] est le document actif
  groups :Map<string,fabric.Group[]> = new Map
  // Documents virtualisés afin de les manipuler plus simplement
  layers:any[] = []

  palette = ['#000000','#6f6776','#9a9a97','#c5ccb8','#8b5580','#c38890','#a593a5','#666092','#9a4f50','#c28d75','#7ca1c0','#416aa3','#8d6268','#be955c','#68aca9','#387080','#6e6962','#93a167','#6eaa78','#557064','#9d9f7f','#7e9e99','#5d6872','#433455']
  palette2 = ['#175145','#2e8065','#51b341','#9bd547','#fff971','#ff7f4f','#ff4f4f','#ee3046','#df426e','#a62654','#621b52','#371848','#0c082a','#261152','#272573','#4876bb','#7fd3e6','#c7f7f2','#ffffff','#d29c8a','#9e4d4d','#712835','#5d1835','#35082a']
  palette3 = ['#2c4941','#66a650','#b9d850','#82dcd7','#208cb2','#253348','#1d1b24','#3a3a41','#7a7576','#b59a66','#cec7b1','#edefe2','#d78b98','#a13d77','#6d2047','#3c1c43','#2c2228','#5e3735','#885a44','#b8560f','#dc9824','#efcb84','#e68556','#c02931']
  sizePalette = [1,2,3,5,8,12,16,24,32,64]

  tool = {
    color: this.randomColor(this.palette3),
    type: 'Brush',
    size: 4
  }

  // myDocs = [];

  @ViewChild('page') page!:ElementRef
  @ViewChild('sizeInfo') sizeInfo!:ElementRef

  // Abonnements
  drawSub?: Subscription
  modifSub?: Subscription
  layersSub?: Subscription

  // Callbacks des 'on'
  sendPath = (obj:any) => {
    let paquet = {
      userid: this._userService.user.id,
      path: obj.path
    }
    this._socketioService.sendPath(paquet)
    this.groups.get(this._userService.user.id)![0].addWithUpdate(obj.path)
    this.canvas.remove(obj.path)
    this.saveMyDocs()
    
    this.canvas.renderAll();
  };
  sendModif = (obj:fabric.IEvent) => {
    let paquet = {
      userid: this._userService.user.id,
      modif: obj
    }
    this._socketioService.sendModif(paquet)
  }
  erase = (obj:fabric.IEvent) => {
    console.log(obj)
  }
  changeSize = (e:WheelEvent) => {
    if (e.deltaY < 0 && this.tool.size < 10) {
      this.tool.size += 1
    }
    else if (e.deltaY > 0 && this.tool.size > 1) {
      this.tool.size -= 1
    }
    this.canvas.freeDrawingBrush.width = this.sizePalette[this.tool.size-1]
  }

  constructor(
    private _socketioService: SocketioService,
    private _userService: UserService
  ) { 
    this.drawSub = this._socketioService.watchDraw().subscribe((paq) => {
      let userid = paq.userid
      // Faire la création d’un objet pour les autres à leur connexion ?
      if (!this.groups.get(userid)) {
        let newdoc = new fabric.Group([],{})
        newdoc.selectable = false
        this.groups.set(userid,[newdoc])
        this.canvas.add(newdoc)
      }
      // jusque là
      fabric.util.enlivenObjects([paq.path], (objects:Path[]) => {
        objects.forEach((o) => { 
          this.groups.get(userid)![0].addWithUpdate(o) 
        });
      }, 'fabric');
   
      this.canvas.renderAll();
    })

    this.modifSub = this._socketioService.watchModif().subscribe((paq) => {
      console.log(paq)
    })

    this.layersSub = this._socketioService.watchLayers().subscribe((layers) => {
      this.layers = layers
    })
  }

  ngOnInit(): void {
    this.canvas = this.initCanvas('canvas1')
    this.canvas.freeDrawingBrush.color = this.tool.color;
    
    this.canvas.on('path:created', this.sendPath);
    this.canvas.on('object:modified', this.sendModif);
  }
  ngAfterViewInit() {
    this.canvasResize();
    this.initMyDocs()
    this.changeTool('Brush');
    this.canvas.freeDrawingBrush.width = this.sizePalette[this.tool.size-1];
  }

  initMyDocs() {
    if (!localStorage.getItem('myDocs')) {
      let newdoc = new fabric.Group([],{})
      this.groups.set(this._userService.user.id, [newdoc])
      this.canvas.add(this.groups.get(this._userService.user.id)![0])
    }
    else {
      let myDocs = JSON.parse(localStorage.getItem('myDocs')!)
      fabric.util.enlivenObjects(myDocs, (objects:fabric.Group[]) => {
        this.groups.set(this._userService.user.id, objects)
      }, 'fabric');
      this.canvas.add(this.groups.get(this._userService.user.id)![0])
    }
  }
  saveMyDocs() {
    let doctable = []
    doctable[0] = this.groups.get(this._userService.user.id)![0].toJSON()
    localStorage.setItem('myDocs',JSON.stringify(doctable))
  }
  delMyDocs() {
    localStorage.removeItem('myDocs')
    this.canvas.remove(this.groups.get(this._userService.user.id)![0])
    this.groups.delete(this._userService.user.id)
    // recréation d’un document vierge qui sera sauvegardé au premier coup de pinceau
    let newdoc = new fabric.Group([],{})
    this.groups.set(this._userService.user.id, [newdoc])
    this.canvas.add(this.groups.get(this._userService.user.id)![0])
    // A FAIRE = synchroniser la deletion
  }

  initCanvas(id:string) {
    let can = new fabric.Canvas(id, {
      backgroundColor: this.palette3[11],
      selection: false,
      preserveObjectStacking: true
    });
    return can
  }
  canvasResize() {
    this.canvas.setHeight(this.page.nativeElement.clientHeight - 24)
    this.canvas.setWidth(this.page.nativeElement.clientWidth - 24)
  }
  randomColor(list:string[]):string {
    let col:string = list[Math.floor(Math.random()*list.length)]
    return col
  }

  changeTool(type:string) {
    // nettoyage
    this.canvas.off('mouse:down', this.erase )
    this.page.nativeElement.removeEventListener('wheel', this.changeSize)
    this.canvas.isDrawingMode = false
    this.canvas.selection = false
    this.canvas.discardActiveObject();
    this.sizeInfo.nativeElement.style.display = "none"

    this.tool.type = type;
    switch (type) {
      case 'Brush':
        this.sizeInfo.nativeElement.style.display = "flex"
        this.canvas.isDrawingMode = true
        this.page.nativeElement.addEventListener('wheel', this.changeSize)
        break;
      case 'Select': 
        this.canvas.selection = true
        this.canvas.setActiveObject(this.groups.get(this._userService.user.id)![0])
        this.canvas.drawControls(this.canvas.getContext())
        break;
      case 'Eraser':
        this.canvas.on('mouse:down', this.erase )
        break;
    }
    this.canvas.renderAll();
  }

  changeColor(col:string) {
    this.tool.color = col
    this.canvas.freeDrawingBrush.color = this.tool.color;
    this.changeTool('Brush');
  }

  // choisir du noir ou du blanc en fonction de la couleur d’arrière plan
  getColorByBgColor(bgColor:string) {
    return (parseInt(bgColor.replace('#', ''), 16) > 0xffffff / 2) ? '#000' : '#fff';
  }
}
