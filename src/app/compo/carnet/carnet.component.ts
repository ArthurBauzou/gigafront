import { ThisReceiver } from '@angular/compiler';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { fabric } from 'fabric';
// import { Path } from 'fabric/fabric-impl';
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
  localuser = this._userService.user.id

  canvas:fabric.Canvas = new fabric.Canvas('canvas01')
  groups :Map<string,fabric.Group[]> = new Map
  layers:any[] = []
  indexActive:number = 0
  
  tool = {
    color: this.randomColor(this.palette3),
    type: 'Brush',
    size: 5
  }
  undotable:any = []
  editObjects:fabric.Object[] = []

  @ViewChild('page') page!:ElementRef
  @ViewChild('brushOptions') brushOptions!:ElementRef
  @ViewChild('selectOptions') selectOptions!:ElementRef
  @ViewChild('cutterOptions') cutterOptions!:ElementRef
  // @ViewChild('cutterDel') cutterDel!:ElementRef

  // Abonnements
  drawSub?: Subscription
  modifSub?: Subscription
  layersSub?: Subscription
  delSub?: Subscription

  // FONCTIONS CALLBACKS DES LISTENERS
  targetLayer = (e:any) => {
    switch (this.tool.type) {
      case 'Select':
        let index = 0
        this.groups.get(this.localuser)?.forEach((g,i)=>{ if (g == e.selected[0]) {index = i} })
        this.indexActive = index
      break;
      case 'Cutter':
        this.editObjects.forEach(o=>{
          o.opacity = 0.7
        })
        this.canvas.getActiveObject().opacity = 1
      break;
    }
  }
  clearSelect = (e:any) => {
    this.editObjects.forEach(o=>{ o.opacity = 1 })
  }
  addObjectFromCanvas = (obj:any) => {
    this.sendObj(obj.path, this.indexActive)
    this.groups.get(this.localuser)![this.indexActive].addWithUpdate(obj.path)
    this.canvas.remove(obj.path)
    this.saveMyDocs()
    this.canvas.renderAll();
  }
  applyModif = (mod:fabric.IEvent) => {
    this.sendModif(mod.target!, this.indexActive)
    this.saveMyDocs()
  }

  globalDelete = (e:KeyboardEvent) => {
    if (e.key == 'Delete' && this.tool.type == 'Cutter') {
      this._socketioService.sendDeletion({
        type: 'cutter',
        userid: this.localuser,
        index: this.indexActive,
        obj_i: this.getObjIndex()
      })
      // this.undotable.push(this.canvas.getActiveObject()) // HACK DEGEULASSE > CTRL+Y POUR RECUP L’OBJ
      this.groups.get(this.localuser)![this.indexActive].removeWithUpdate(this.canvas.getActiveObject())
      this.canvas.remove(this.canvas.getActiveObject())
      this.canvas.discardActiveObject()
    }
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
    let grp = this.groups.get(this.localuser)![this.indexActive]
    if (e.key == 'z' && e.ctrlKey && grp._objects.length > 0) {
      let rmobj = grp._objects[grp._objects.length-1]
      this.undotable.push(rmobj)
      grp.removeWithUpdate(rmobj)
      if (this.undotable.length > 20) {this.undotable.shift()}
      grp.dirty = true
      this._socketioService.sendDeletion({
        type: 'undo',
        userid: this.localuser,
        index: this.indexActive
      })
    }
    if (e.key == 'y' && e.ctrlKey && this.undotable.length > 0) {
      let addobj = this.undotable.pop()
      this.sendObj(addobj, this.indexActive)
      grp.addWithUpdate(addobj)
      grp.dirty = true
    }
    this.saveMyDocs()
    this.canvas.renderAll()
  }

  constructor(
    private _socketioService: SocketioService,
    private _userService: UserService
  ) {
    // RECEPTION DES AJOUTS AUX CALQUES
    this.drawSub = this._socketioService.watchDraw().subscribe((paq) => {
      this.checkGroup(paq.userid, paq.index)
      fabric.util.enlivenObjects([paq.object], (objects:any) => {
        objects.forEach((o:fabric.Object) => { 
          this.groups.get(paq.userid)![paq.index].addWithUpdate(o)
        });
      }, 'fabric');
      this.canvas.renderAll();
    })

    // RECEPTION DES MODIFICATIONS DES CALQUES
    this.modifSub = this._socketioService.watchModif().subscribe((paq) => {
      this.checkGroup(paq.userid, paq.index)
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
    this.layersSub = this._socketioService.watchLayers().subscribe((layersobj) => {
      this.layers = layersobj
      this.layers.forEach((l:any,i:number)=>{
        this.checkGroup(l.userid, l.index)
        this.groups.get(l.userid)![l.index].moveTo(i)
      })
    })

    // RECEPTION DES SUPPRESSIONS
    this.delSub = this._socketioService.watchDeletion().subscribe((delobj) => {
      let grps = this.groups.get(delobj.userid)
      if (!grps) {console.log('rien a suppr'); return}
      switch(delobj.type) {
        case 'all':
          grps.forEach(g=>{ this.canvas.remove(g) })
          this.groups.set(delobj.userid, [])
          break;
        case 'undo':
          let rmobj = grps![delobj.index]._objects[grps![delobj.index]._objects.length-1]
          grps[delobj.index].removeWithUpdate(rmobj)
          break;
        case 'cutter':
          let cutobj = grps[delobj.index]._objects[delobj.obj_i]
          grps[delobj.index].removeWithUpdate(cutobj)
          break;
        case 'movez':
          grps[delobj.index]._objects[delobj.obj_i].moveTo(delobj.targ)
          let uRect = new fabric.Rect()
          grps[delobj.index].add(uRect);grps[delobj.index].removeWithUpdate(uRect)
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
    this.canvas.on('selection:created', this.targetLayer)
    this.canvas.on('selection:updated', this.targetLayer)
    this.canvas.on('selection:cleared', this.clearSelect)
    fabric.Object.prototype.set({ 
      borderColor: 'gray',
      cornerColor: 'gray',
      cornerSize: 8,
      transparentCorners: false
    })
  }
  ngAfterViewInit() {
    this.canvasResize();
    this._socketioService.requestIni(this.localuser)
    this.initMyDocs();
    this.sendMyDocs();
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
    let newdocs:fabric.Group[] = []
    let ndoc = new fabric.Group([],{})
    ndoc.padding = 4
    if (!localStorage.getItem('myDocs')) {
      newdocs.push(ndoc)
    }
    else {
      let myDocs = JSON.parse(localStorage.getItem('myDocs')!)
      fabric.util.enlivenObjects(myDocs, (docs:fabric.Group[]) => {
        docs.forEach(g=>{ newdocs.push(g) })
      }, 'fabric');
    }
    this.groups.set(this.localuser, newdocs)
    this.groups.get(this.localuser)!.forEach((g)=>{
      this.canvas.add(g) 
    })
  }
  newMyDoc() {
    let index = this.groups.get(this.localuser)!.length
    this.groups.get(this.localuser)![index] = new fabric.Group()
    this.canvas.add(this.groups.get(this.localuser)![index])
    this._socketioService.editLayers({type:'new',userid:this.localuser,index:index})
    this.indexActive = index
    this.changeTool('Brush')
  }
  saveMyDocs() {
    let doctable:fabric.Group[] = []
    this.groups.get(this.localuser)!.forEach((g)=>{
      if (g._objects.length != 0) {doctable.push(g.toJSON())}
    })
    localStorage.setItem('myDocs',JSON.stringify(doctable))
  }
  delMyDocs() {
    localStorage.removeItem('myDocs')
    this.groups.get(this.localuser)?.forEach(g=>{ this.canvas.remove(g) })
    this.groups.set(this.localuser, [])
    this._socketioService.sendDeletion({ userid:this.localuser, type:'all' })
    this._socketioService.editLayers({ type: 'new', userid: this.localuser, index: 0 })
    this.initMyDocs()
    this.indexActive = 0
    this.changeTool('Brush')
  }
  sendMyDocs() {
    let mydocs = this.groups.get(this.localuser)
    mydocs!.forEach((d,i)=>{
      this._socketioService.editLayers({ type: 'new', userid: this.localuser, index: i })
      d._objects.forEach(o=>{ this.sendObj(o,i) })
      this.sendModif(d,i)
    })
  }

  // UTILITAIRES DE SYNCHRONISATION
  checkGroup(userid:string, index:number) {
    if (!this.groups.get(userid)) {this.groups.set(userid, [])}
    if (this.groups.get(userid)![index] == undefined) {
      let newdoc:fabric.Group = new fabric.Group([],{})
      newdoc.selectable = false
      this.groups.get(userid)![index] = newdoc
      this.canvas.add(this.groups.get(userid)![index])
      console.log('document crée position ', index)
    }
  }
  sendObj(obj:fabric.Object, index:number) {
    let paquet = {
      userid: this.localuser,
      index: index,
      object: obj
    }
    this._socketioService.sendPath(paquet)
  };
  sendModif(grp:fabric.Object, index:number) {
    let modif = {
      top: grp.top,
      left: grp.left,
      angle: grp.angle,
      scaleX: grp.scaleX,
      scaleY: grp.scaleY,
      flipX: grp.flipX,
      flipY: grp.flipY
    }
    let paquet = {
      userid: this.localuser,
      index: index,
      modif: modif
    }
    this._socketioService.sendModif(paquet)
  }


  // OUTILS
  changeTool(type:string) {
    // nettoyage fenêtre otpions
    this.brushOptions.nativeElement.style.display = "none"
    this.cutterOptions.nativeElement.style.display = "none"
    this.selectOptions.nativeElement.style.display = "none"
    // nettoyage brush
    this.page.nativeElement.removeEventListener('wheel', this.changeSize)
    document.removeEventListener('keydown', this.undoRedo)
    this.canvas.isDrawingMode = false
    // nottoyage select
    this.canvas.preserveObjectStacking = true
    this.canvas.discardActiveObject();
    this.canvas.off('object:modified', this.applyModif)
    // nettoyage ciseaux
    this.canvas.selection = false
    this.groups.get(this.localuser)![this.indexActive].visible = true
    for (let usr of this.groups) { usr[1].forEach(g=>{
      g.opacity = 1
      if (usr[0] == this.localuser) {g.selectable = true}
    })}
    this.editObjects.forEach((o)=>{
      o.opacity = 1
      this.canvas.remove(o) 
    })
    document.removeEventListener('keydown', this.globalDelete)    

    // chargement de l’outil
    this.tool.type = type;
    switch (type) {
      case 'Brush':
        this.brushOptions.nativeElement.style.display = "flex"
        this.canvas.isDrawingMode = true
        this.page.nativeElement.addEventListener('wheel', this.changeSize)
        document.addEventListener('keydown', this.undoRedo)
        break;
      case 'Select': 
        this.selectOptions.nativeElement.style.display = "flex"
        this.canvas.preserveObjectStacking = false
        this.canvas.setActiveObject(this.groups.get(this.localuser)![this.indexActive])
        this.canvas.drawControls(this.canvas.getContext())
        this.canvas.on('object:modified', this.applyModif)
        break;
      case 'Cutter':
        this.canvas.preserveObjectStacking = false
        this.cutterOptions.nativeElement.style.display = "flex"
        this.editObjects = this.groups.get(this.localuser)![this.indexActive]._objects
        for (let usr of this.groups) { usr[1].forEach((g,i)=>{
          g.opacity = 0.2
          if (usr[0] == this.localuser) { g.selectable = false }
        })}
        this.groups.get(this.localuser)![this.indexActive].opacity = 1
        this.groups.get(this.localuser)![this.indexActive].visible = false
        this.editObjects.forEach((o:any)=>{
          this.canvas.add(o)
          o.hasControls = false
          o.lockMovementX = o.lockMovementY = true
        })
        document.addEventListener('keydown', this.globalDelete)
        break;
    }
    this.canvas.renderAll();
  }
  changeColor(col:string) {
    this.tool.color = col
    this.canvas.freeDrawingBrush.color = this.tool.color;
    this.changeTool('Brush');
  }
  changeActiveLayer(layer:any) {
    if(layer.userid == this.localuser) { 
      if (this.tool.type == 'Cutter') { this.groups.get(this.localuser)![this.indexActive].visible = true }
      this.indexActive = layer.index 
      this.changeTool('Select')
    }
  }
  manualChangeSize(e:MouseEvent) {
    let rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    let clicpos:number =  (e.clientX - rect.left) / (e.currentTarget as HTMLElement).clientWidth
    if (clicpos >= 0.5 && this.tool.size < 10) { this.tool.size += 1 }
    else if (clicpos < 0.5 && this.tool.size > 1) { this.tool.size -= 1 }
    this.canvas.freeDrawingBrush.width = this.sizePalette[this.tool.size-1]
  }
  manualUndoRedo(e:MouseEvent) {
    let grp = this.groups.get(this.localuser)![this.indexActive]
    if ((e.target as HTMLElement).classList.contains('fa-rotate-left') && grp._objects.length > 0) {
      let rmobj = grp._objects[grp._objects.length-1]
      this.undotable.push(rmobj)
      grp.removeWithUpdate(rmobj)
      if (this.undotable.length > 20) {this.undotable.shift()}
      grp.dirty = true
      this._socketioService.sendDeletion({
        type: 'undo',
        userid: this.localuser,
        index: this.indexActive
      })
    }
    if ((e.target as HTMLElement).classList.contains('fa-rotate-right') && this.undotable.length > 0) {
      let addobj = this.undotable.pop()
      this.sendObj(addobj, this.indexActive)
      grp.addWithUpdate(addobj)
      grp.dirty = true
    }
    this.saveMyDocs()
    this.canvas.renderAll()
  }
  cutterAction(e:MouseEvent) {
    let grp = this.groups.get(this.localuser)![this.indexActive]
    let uRect = new fabric.Rect()
    if (this.canvas.getActiveObject() == null) { console.log('pas d’objet selectionné') ; return }
    let delobj:any = {userid: this.localuser, index: this.indexActive, obj_i: this.getObjIndex()}
    if ((e.target as HTMLElement).classList.contains('fa-trash-can')) {
      delobj.type = 'cutter'
      // this.undotable.push(this.canvas.getActiveObject()) // HACK DEGEULASSE > CTRL+Y POUR RECUP L’OBJ
      grp.remove(this.canvas.getActiveObject())
      this.canvas.remove(this.canvas.getActiveObject())
    }
    if ((e.target as HTMLElement).classList.contains('fa-angles-up')) {
      delobj.type = 'movez'
      delobj.targ = grp._objects.length-1
      this.canvas.getActiveObject().moveTo(grp._objects.length-1)
    }
    if ((e.target as HTMLElement).classList.contains('fa-angles-down')) {
      delobj.type = 'movez'
      delobj.targ = 0
      this.canvas.getActiveObject().moveTo(0)
    }

    this._socketioService.sendDeletion(delobj)
    this.canvas.discardActiveObject()
    grp.add(uRect);grp.removeWithUpdate(uRect)
    this.editObjects.forEach((o)=>{ this.canvas.remove(o) })
    this.editObjects = grp._objects
    this.editObjects.forEach((o)=>{ this.canvas.add(o) })
  }
  selectAction(e:MouseEvent) {

  }


  // UTILITAIRES
  getObjIndex() {
    let objs = this.groups.get(this.localuser)![this.indexActive]._objects
    let index = -1
    objs.forEach((o,i)=>{
      if (this.canvas.getActiveObject() == o) { index = i }
    })
    return index
  }
  canvasResize() {
    this.canvas.setHeight(this.page.nativeElement.clientHeight - 48)
    this.canvas.setWidth(this.page.nativeElement.clientWidth - 48)
    this.canvas.calcOffset()
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
