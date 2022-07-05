import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { fabric } from 'fabric';
import { Path } from 'fabric/fabric-impl';
import { Subscription } from 'rxjs';
import { FabricService } from 'src/app/services/fabric.service';
import { SocketioService } from 'src/app/services/socketio.service';

@Component({
  selector: 'app-carnet',
  templateUrl: './carnet.component.html',
  styleUrls: ['./carnet.component.css']
})
export class CarnetComponent implements OnInit {


  canvas = this._fabricService.canvas 

  @ViewChild('page') page!:ElementRef

  // Abonnemanets
  drawSub?: Subscription

  // Callbacks des 'on'
  mouseUp = (event: fabric.IEvent) => {
  };
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
    this.canvas.backgroundColor = 'rgba(0,0,0,0)';

    this.canvas.freeDrawingBrush.color = 'black';
    this.canvas.freeDrawingBrush.width = 2;
    this.canvas.isDrawingMode = true

    this.canvas.on('mouse:up', this.mouseUp);
    this.canvas.on('path:created', this.sendPath);
  }

  ngAfterViewInit() {
    this.canvasResize()
  }
  
  canvasResize() {
    this.canvas.setHeight(this.page.nativeElement.clientHeight - 24)
    this.canvas.setWidth(this.page.nativeElement.clientWidth - 24)
  }

  changeTool(event:any) {
    let outils = event.currentTarget
    outils.querySelector('.active')?.classList.remove('active')
    if (!event.target.parentElement.classList.contains('outils')) {
      event.target.parentElement.classList.add('active')
    }
    else {
      console.log('clicdemerde')
      event.target.classList.add('active')
    }
  }

}
