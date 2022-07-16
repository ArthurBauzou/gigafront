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
    size: 4
  }
  undotable:any = []
  editObjects:fabric.Object[] = []

  @ViewChild('page') page!:ElementRef
  @ViewChild('brushOptions') brushOptions!:ElementRef
  @ViewChild('selectOptions') selectOptions!:ElementRef

  // Abonnements
  drawSub?: Subscription
  modifSub?: Subscription
  layersSub?: Subscription
  delSub?: Subscription

  // FONCTIONS CALLBACKS DES LISTENERS
  targetLayer = (e:any) => {
    let index = 0
    this.groups.get(this.localuser)?.forEach((g,i)=>{ if (g == e.selected[0]) {index = i} })
    this.indexActive = index
  }
  addObjectFromCanvas = (obj:any) => {
    this.sendObj(obj.path, this.indexActive)
    this.groups.get(this.localuser)![this.indexActive].addWithUpdate(obj.path)
    this.canvas.remove(obj.path)
    this.saveMyDocs()
    this.canvas.renderAll();
  }
  applyModif = (doc:fabric.IEvent) => {
    // if (!doc.target) {return}
    this.sendModif(doc.target!, this.indexActive)
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
      if (!this.groups.get(delobj.userid)) {console.log('rien a suppr'); return}
      switch(delobj.type) {
        case 'all':
          this.groups.get(delobj.userid)!.forEach(g=>{ this.canvas.remove(g) })
          this.groups.set(delobj.userid, [])
          break;
          case 'undo':
          let grps = this.groups.get(delobj.userid)
          let rmobj = grps![delobj.index]._objects[grps![delobj.index]._objects.length-1]
          grps![delobj.index].removeWithUpdate(rmobj)
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
    this.canvas.on('object:modified', this.applyModif);
  }
  ngAfterViewInit() {
    this.canvasResize();
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
    if (!localStorage.getItem('myDocs')) {
      newdocs.push(new fabric.Group([],{}))
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
    this.brushOptions.nativeElement.style.display = "none"
    this.selectOptions.nativeElement.style.display = "none"

    this.canvas.preserveObjectStacking = true
    this.page.nativeElement.removeEventListener('wheel', this.changeSize)
    document.removeEventListener('keydown', this.undoRedo)
    this.canvas.isDrawingMode = false
    this.canvas.selection = false
    this.canvas.discardActiveObject();
    this.canvas.off('selection:created', this.targetLayer)
    this.canvas.off('selection:updated', this.targetLayer)

    for (let usr of this.groups) { usr[1].forEach(g=>{
      g.opacity = 1
      if (usr[0] == this.localuser) {g.selectable = true}
    })}
    this.groups.get(this.localuser)![this.indexActive].visible = true
    this.editObjects.forEach((o)=>{
      this.canvas.remove(o)
    })
    console.log( 'avant' ,this.canvas._objects.length)

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
        this.canvas.on('selection:created', this.targetLayer)
        this.canvas.on('selection:updated', this.targetLayer)
        break;
      case 'Cutter':
        this.selectOptions.nativeElement.style.display = "flex"
        this.groups.get(this.localuser)![this.indexActive].clone((g:fabric.Group)=>{
          this.editObjects=g._objects
        })
        this.groups.get(this.localuser)![this.indexActive].visible = false
        for (let usr of this.groups) { usr[1].forEach(g=>{
          g.opacity = 0.3
          if (usr[0] == this.localuser) {g.selectable = false}
        })}
        
        this.editObjects.forEach((o)=>{
          this.canvas.add(o)
        })
        this.canvas.selection = true

        console.log( 'après' ,this.canvas._objects.length)

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


  // UTILITAIRES
  canvasResize() {
    this.canvas.setHeight(this.page.nativeElement.clientHeight - 48)
    this.canvas.setWidth(this.page.nativeElement.clientWidth - 48)
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
