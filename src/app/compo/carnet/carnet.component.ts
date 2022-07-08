import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { fabric } from 'fabric';
import { IEvent, Path } from 'fabric/fabric-impl';
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

  groups :Map<string,fabric.Group> = new Map
  palette = ['#000000','#6f6776','#9a9a97','#c5ccb8','#8b5580','#c38890','#a593a5','#666092','#9a4f50','#c28d75','#7ca1c0','#416aa3','#8d6268','#be955c','#68aca9','#387080','#6e6962','#93a167','#6eaa78','#557064','#9d9f7f','#7e9e99','#5d6872','#433455']
  sizePalette = [1,2,3,5,8,12,16,24,32,64]

  tool = {
    color: this.randomColor(this.palette),
    type: 'Brush',
    size: 4
  }

  @ViewChild('page') page!:ElementRef
  @ViewChild('sizeInfo') sizeInfo!:ElementRef

  // Abonnemanets
  drawSub?: Subscription
  modifSub?: Subscription

  // Callbacks des 'on'
  sendPath = (obj:any) => {
    let paquet = {
      userid: this._userService.user.id,
      path: obj.path
    }
    this._socketioService.sendPath(paquet)
    this.groups.get(this._userService.user.id)!.addWithUpdate(obj.path)
    this.canvas.remove(obj.path)
    
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
      if (!this.groups.get(userid)) {
        this.groups.set(userid,new fabric.Group([],{}))
        this.groups.get(userid)!.set('selectable', false)
        this.canvas.add(this.groups.get(userid)!)
      }
      let paths = [paq.path]
      fabric.util.enlivenObjects(paths, (objects:Path[]) => {
        objects.forEach((o) => { 
          this.groups.get(userid)!.addWithUpdate(o) 
        });
      }, 'fabric');
   
      this.canvas.renderAll();
    })

    this.modifSub = this._socketioService.watchModif().subscribe((paq) => {
      console.log(paq.userid)
    })
  }

  ngOnInit(): void {
    this.canvas = this.initCanvas('canvas1')
    this.canvas.freeDrawingBrush.color = this.tool.color;
    
    
    this.groups.set(this._userService.user.id, new fabric.Group([],{}))
    this.canvas.add(this.groups.get(this._userService.user.id)!)
    
    this.canvas.on('path:created', this.sendPath);
    this.canvas.on('object:modified', this.sendModif);
  }
  ngAfterViewInit() {
    this.canvasResize();
    this.changeTool('Brush');
    this.canvas.freeDrawingBrush.width = this.sizePalette[this.tool.size-1];

  }

  initCanvas(id:string) {
    let can = new fabric.Canvas(id, {
      backgroundColor: 'beige',
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
    // nettoyage des listeners d’outils
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
        this.canvas.setActiveObject(this.groups.get(this._userService.user.id)!)
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
  }
}
