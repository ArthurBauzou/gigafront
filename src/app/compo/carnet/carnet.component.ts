import { Component, OnInit } from '@angular/core';
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

  drawSub?: Subscription

  mouseUp = (evt: fabric.IEvent) => {
  };

  sendPath = (opt:any) => {
    this._socketioService.sendPath(opt.path)
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
    this.canvas.freeDrawingBrush.color = 'black';
    this.canvas.freeDrawingBrush.width = 4;
    this.canvas.isDrawingMode = true

    this.canvas.on('mouse:up', this.mouseUp);
    this.canvas.on('path:created', this.sendPath);
  }

}
