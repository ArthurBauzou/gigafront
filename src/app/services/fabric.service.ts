import { Injectable } from '@angular/core';
import { fabric } from 'fabric';

@Injectable({
  providedIn: 'root'
})
export class FabricService {

  public canvas!: fabric.Canvas;

  constructor() { }

  initCanvas(id:string) {
    let can = new fabric.Canvas(id, {
      backgroundColor: '#ebebef',
      selection: false,
      preserveObjectStacking: true,
    });
    return can
  }

}
