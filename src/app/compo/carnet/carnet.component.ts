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

  palette = ['#000000','#6f6776','#9a9a97','#c5ccb8','#8b5580','#c38890','#a593a5','#666092','#9a4f50','#c28d75','#7ca1c0','#416aa3','#8d6268','#be955c','#68aca9','#387080','#6e6962','#93a167','#6eaa78','#557064','#9d9f7f','#7e9e99','#5d6872','#433455']
  palette2 = ['#175145','#2e8065','#51b341','#9bd547','#fff971','#ff7f4f','#ff4f4f','#ee3046','#df426e','#a62654','#621b52','#371848','#0c082a','#261152','#272573','#4876bb','#7fd3e6','#c7f7f2','#ffffff','#d29c8a','#9e4d4d','#712835','#5d1835','#35082a']
  palette3 = ['#2c4941','#66a650','#b9d850','#82dcd7','#208cb2','#253348','#1d1b24','#3a3a41','#7a7576','#b59a66','#cec7b1','#edefe2','#d78b98','#a13d77','#6d2047','#3c1c43','#2c2228','#5e3735','#885a44','#b8560f','#dc9824','#efcb84','#e68556','#c02931']
  sizePalette = [1,2,3,5,8,12,16,24,32,64]

  canvas:fabric.Canvas = new fabric.Canvas('canvas01')
  groups :Map<string,fabric.Group[]> = new Map
  layers:any[] = []
  indexActive:number = 0
  tool = {
    color: this.randomColor(this.palette3),
    type: 'Brush',
    size: 4
  }
  undotable:any = []

  @ViewChild('page') page!:ElementRef
  @ViewChild('sizeInfo') sizeInfo!:ElementRef

  // Abonnements
  drawSub?: Subscription
  modifSub?: Subscription
  layersSub?: Subscription
  delSub?: Subscription

  // FONCTIONS CALLBACKS DES LISTENERS
  addObjectFromCanvas = (obj:any) => {
    this.sendObj(obj.path)
    this.groups.get(this._userService.user.id)![this.indexActive].addWithUpdate(obj.path)
    this.canvas.remove(obj.path)
    this.saveMyDocs()
    this.canvas.renderAll();
  }
  sendModif = (doc:fabric.IEvent) => {
    if (!doc.target) {return}
    let modif = {
      type: doc.e.type,
      top: doc.target.top,
      left: doc.target.left,
      angle: doc.target.angle,
      scaleX: doc.target.scaleX,
      scaleY: doc.target.scaleY,
      flipX: doc.target.flipX,
      flipY: doc.target.flipY
    }
    let paquet = {
      userid: this._userService.user.id,
      index: this.indexActive,
      modif: modif
    }
    this._socketioService.sendModif(paquet)
    this.saveMyDocs()
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
  undoRedo = (e:KeyboardEvent) => {
    let grp = this.groups.get(this._userService.user.id)![this.indexActive]
    if (e.key == 'z' && e.ctrlKey && grp._objects.length > 0) {
      let rmobj = grp._objects[grp._objects.length-1]
      this.undotable.push(rmobj)
      grp.removeWithUpdate(rmobj)
      if (this.undotable.length > 20) {this.undotable.shift()}
      grp.dirty = true
      this._socketioService.sendDeletion({
        type: 'undo',
        userid: this._userService.user.id,
        index: this.indexActive
      })
    }
    if (e.key == 'y' && e.ctrlKey && this.undotable.length > 0) {
      let addobj = this.undotable.pop()
      this.sendObj(addobj)
      grp.addWithUpdate(addobj)
      grp.dirty = true
    }
    this.canvas.renderAll()
  }

  constructor(
    private _socketioService: SocketioService,
    private _userService: UserService
  ) {
    // RECEPTION DES AJOUTS AUX CALQUES
    this.drawSub = this._socketioService.watchDraw().subscribe((paq) => {
      fabric.util.enlivenObjects([paq.object], (objects:Path[]) => {
        objects.forEach((o) => { 
          this.groups.get(paq.userid)![paq.index].addWithUpdate(o) 
        });
      }, 'fabric');
      this.canvas.renderAll();
    })

    // RECEPTION DES MODIFICATIONS DES CALQUES
    this.modifSub = this._socketioService.watchModif().subscribe((paq) => {
      let amod = this.groups.get(paq.userid)![paq.index];
      amod.top = paq.modif.top
      amod.left = paq.modif.left
      amod.angle = paq.modif.angle
      amod.scaleX = paq.modif.scaleX
      amod.scaleY = paq.modif.scaleY
      amod.flipX = paq.modif.flipX
      amod.flipY = paq.modif.flipY
      this.canvas.renderAll();
    })

    // RECEPTION DE LA LISTE DES CALQUES
    this.layersSub = this._socketioService.watchLayers().subscribe((layers) => {
      this.layers = layers
      // création des documents en fonction des layers reçus
      layers.forEach((l:any,i:number)=>{
        if (!this.groups.get(l.userid) || this.groups.get(l.userid)!.length < i) {
          let newdoc:any = new fabric.Group([],{})
          newdoc.selectable = false
          if (!this.groups.get(l.userid)) {
            this.groups.set(l.userid, [newdoc])
          }
          else {
            this.groups.get(l.userid)![l.index] = newdoc
          }
          this.canvas.add(this.groups.get(l.userid)![l.index])
          console.log('newdoc')
        }
        // synchronisation de l‘ordre des calques
        this.groups.get(l.userid)![l.index].moveTo(i)
      })
    })

    // RECEPTION DES SUPPRESSIONS
    this.delSub = this._socketioService.watchDeletion().subscribe((delobj) => {
      let grps = this.groups.get(delobj.userid)
      if (!grps) {console.log('pas de groupes');return}
      switch(delobj.type) {
        case 'all':
          for (let i = grps.length-1; i > 0; i--) {
            this.canvas.remove(grps[i])
            grps.pop()
          }
          grps[0]._objects = []
          grps[0].dirty = true
          break;
        case 'undo':
          let rmobj = grps[delobj.index]._objects[grps[delobj.index]._objects.length-1]
          grps[delobj.index].removeWithUpdate(rmobj)
          break;
      }
      this.canvas.renderAll();
    })

  }

  // INITIALISATIONS
  ngOnInit(): void {
    this.canvas = this.initCanvas('canvas1')
    this.canvas.freeDrawingBrush.color = this.tool.color;
    this.canvas.on('path:created', this.addObjectFromCanvas);
    this.canvas.on('object:modified', this.sendModif);
  }
  ngAfterViewInit() {
    this.canvasResize();
    this.initMyDocs()
    this.changeTool('Brush');
    this.canvas.freeDrawingBrush.width = this.sizePalette[this.tool.size-1];
  }
  initCanvas(id:string) {
    let can = new fabric.Canvas(id, {
      backgroundColor: this.palette3[11],
      selection: false,
      preserveObjectStacking: true
    });
    return can
  }

  // GESTION DOCUMENTS LOCAUX
  initMyDocs() {
    // if (!localStorage.getItem('myDocs')) {
    //   let newdoc = new fabric.Group([],{})
    //   this.groups.set(this._userService.user.id, [newdoc])
    //   this.canvas.add(this.groups.get(this._userService.user.id)![0])
    // }
    // else {
    //   let myDocs = JSON.parse(localStorage.getItem('myDocs')!)
    //   fabric.util.enlivenObjects(myDocs, (objects:fabric.Group[]) => {
    //     this.groups.set(this._userService.user.id, objects)
    //   }, 'fabric');
    //   this.canvas.add(this.groups.get(this._userService.user.id)![0])
    // }
    let newdoc = new fabric.Group([],{})
    this.groups.set(this._userService.user.id, [newdoc])
    this.canvas.add(this.groups.get(this._userService.user.id)![0])
  }
  saveMyDocs() {
    let doctable = []
    doctable[0] = this.groups.get(this._userService.user.id)![0].toJSON()
    localStorage.setItem('myDocs',JSON.stringify(doctable))
  }
  delMyDocs() {
    localStorage.removeItem('myDocs')
    let grps = this.groups.get(this._userService.user.id)
    if (!grps) {console.log('pas de groupes');return}

    for (let i = grps.length-1; i > 0; i--) {
      this.canvas.remove(grps[i])
      grps.pop()
    }
    grps[0]._objects = []
    grps[0].dirty = true

    this._socketioService.sendDeletion({
      userid:this._userService.user.id,
      type:'all'
    })
    this.canvas.renderAll();
    this.changeTool('Brush')
  }

  // sendMyDoc(doc:any) {
  //   let groupObj = doc._objects
  //   doc._objects = []
  //   console.log(groupObj, doc)
  // }


  sendObj(obj:any) {
    let paquet = {
      userid: this._userService.user.id,
      index: this.indexActive,
      object: obj
    }
    this._socketioService.sendPath(paquet)
  };


  // OUTILS
  changeTool(type:string) {
    // nettoyage
    this.page.nativeElement.removeEventListener('wheel', this.changeSize)
    document.removeEventListener('keydown', this.undoRedo)
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
        document.addEventListener('keydown', this.undoRedo)
        break;
      case 'Select': 
        this.canvas.setActiveObject(this.groups.get(this._userService.user.id)![0])
        this.canvas.drawControls(this.canvas.getContext())
        break;
      case 'Cutter':
        this.canvas.selection = true
        break;
    }
    this.canvas.renderAll();
  }
  changeColor(col:string) {
    this.tool.color = col
    this.canvas.freeDrawingBrush.color = this.tool.color;
    this.changeTool('Brush');
  }

  // UTILITAIRES
  canvasResize() {
    this.canvas.setHeight(this.page.nativeElement.clientHeight - 24)
    this.canvas.setWidth(this.page.nativeElement.clientWidth - 24)
  }
  randomColor(list:string[]):string {
    let col:string = list[Math.floor(Math.random()*list.length)]
    return col
  }
  // choisir du noir ou du blanc en fonction de la couleur d’arrière plan
  getColorByBgColor(bgColor:string) {
    return (parseInt(bgColor.replace('#', ''), 16) > 0xffffff / 2) ? '#000' : '#fff';
  }
}
