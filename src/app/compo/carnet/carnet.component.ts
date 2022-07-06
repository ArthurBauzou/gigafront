import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { Path } from 'fabric/fabric-impl';
// import { fabric } from 'fabric';
// import { Path } from 'fabric/fabric-impl';
// import { Fabric } from 'fabric/dist';
import { Subscription } from 'rxjs';
import { FabricService } from 'src/app/services/fabric.service';
import { SocketioService } from 'src/app/services/socketio.service';

declare var fabric:any

@Component({
  selector: 'app-carnet',
  templateUrl: './carnet.component.html',
  styleUrls: ['./carnet.component.css']
})
export class CarnetComponent implements OnInit {

  canvas = this._fabricService.canvas
  palette = this._fabricService.palette01

  toolParam = {
    color: this._fabricService.randomColor(this._fabricService.palette01),
    type: 'Pinceau',
    size: "5"
  }

  @ViewChild('page') page!:ElementRef
  @ViewChild('sizeSlider') sizeSlider!:ElementRef

  // Abonnemanets
  drawSub?: Subscription

  // Callbacks des 'on'
  sendPath = (obj:any) => {
    this._socketioService.sendPath(obj.path)
  };

  constructor(
    protected _fabricService: FabricService,
    private _socketioService: SocketioService
  ) { 
    this.drawSub = this._socketioService.watchDraw().subscribe((path) => {
      let paths = [path]
      fabric.util.enlivenObjects(paths, (objects:Path[]) => {
        objects.forEach((o) => { this.canvas.add(o) });
      }, 'fabric');
      this.canvas.renderAll();
    })
  }

  ngOnInit(): void {

    this.canvas = this._fabricService.initCanvas('canvas1')

    this.canvas.freeDrawingBrush.color = this.toolParam.color;
    this.canvas.freeDrawingBrush.width = parseInt(this.toolParam.size);

    this.canvas.isDrawingMode = true

    this.canvas.on('path:created', this.sendPath);
  }

  ngAfterViewInit() {
    this.canvasResize()
    this.sizeSlider.nativeElement.value = this.toolParam.size;
  }
  canvasResize() {
    this.canvas.setHeight(this.page.nativeElement.clientHeight - 24)
    this.canvas.setWidth(this.page.nativeElement.clientWidth - 24)
  }

  changeToolTab(event:any) {
    event.currentTarget.querySelector('.active')?.classList.remove('active')
    if (!event.target.parentElement.classList.contains('outils')) {
      event.target.parentElement.classList.add('active')
    }
    else {event.target.classList.add('active')}
  }

  changeColor(col:string) {
    this.toolParam.color = col
    this.canvas.freeDrawingBrush.color = this.toolParam.color;
  }
  changeSize(el:HTMLInputElement) {
    this.toolParam.size = el.value
    this.canvas.freeDrawingBrush.width = parseInt(this.toolParam.size);
  }

  changeTool(el:HTMLSelectElement) {
    console.log(el.value);
    this.toolParam.type = el.value;
  }
  
  getEraser(type:string) {
    switch (type) {
      case 'Gomme': 
        this.canvas.freeDrawingBrush = new fabric.EraserBrush(this.canvas);
        break;
      case 'Pinceau':
        this.canvas.freeDrawingBrush = new fabric.PencilBrush();
        break;
    }
    this.canvas.isDrawingMode = true;
  }

}
