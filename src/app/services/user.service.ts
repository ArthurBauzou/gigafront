import { Injectable } from '@angular/core';
import { JwtHelperService } from '@auth0/angular-jwt';
import { Subject } from 'rxjs';
import { SocketioService } from './socketio.service';
import { UtilService } from './util.service';

interface User {
  id:string;
  name:string;
  color:string;
}

@Injectable({
  providedIn: 'root'
})
export class UserService {

  private user$ = new Subject<User>()

  DEFAULTPARAMS = {
    autoreco: 'non',
    rolldef: [6,6]
  }

  user:User = {id: '', name: '', color: ''}
  token:any = {}
  params:any = {}
  
  constructor(
    private _jwtHelper: JwtHelperService,
    private _utilService: UtilService,
    private _socketService: SocketioService
  ) {
    this.params = this.DEFAULTPARAMS
  }

  watchUser() {
    return this.user$.asObservable()
  }

  // GESTION LOCAL STORAGE
  checkToken() {
    let tkn: string | null = localStorage.getItem('userToken')
    if (tkn) { 
      this.token = this._jwtHelper.decodeToken(tkn)
      return true
    } else {
      return false
    }
  }
  checkParams() {
    let newParams = localStorage.getItem('userParams')
    if (newParams) {
      let jpar = JSON.parse(newParams)
      for (let p in jpar) {this.params[p] = jpar[p]}
    }
    return this.params
  }
  updateParams(newPar:any) {
    for (let p in newPar) {this.params[p] = newPar[p]}
    localStorage.setItem('userParams', JSON.stringify(this.params))
  }

  // INTERACTIONS SOCKET
  loguser(username:string) {
    this.user.name = username
    this.user.id = this._utilService.generateId()
    this.user.color = this._utilService.randomColor()
    this.user$.next(this.user)
    this._socketService.setupSocketConnection(this.user);  
  }
  reconnect() {
    this.user.name = this.token.name;
    this.user.color = this.token.color;
    this.user.id = this.token.id;
    this.user$.next(this.user)
    this._socketService.setupSocketConnection(this.user);
  }
  purgeToken() {
    localStorage.removeItem('userToken')
    localStorage.removeItem('userParams')
    this.token = {}
    this.params = this.DEFAULTPARAMS
  }

  disconnect() {
    this.user = {id: '', name: '', color: ''}
    this.updateParams({autoreco: 'hack'})
    this.user$.next(this.user)
  }
}
