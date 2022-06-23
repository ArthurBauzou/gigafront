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

  user:User = {id: '', name: '', color: ''}

  token:any = {}
  params:any = {
    autoreco: false,
    rolldef: [6,6]
  }
  
  constructor(
    private _jwtHelper: JwtHelperService,
    private _utilService: UtilService,
    private _socketService: SocketioService
  ) {
  }

  watchUser() {
    return this.user$.asObservable()
  }

  checkToken() {
    let tkn: string | null = localStorage.getItem('userToken')
    if (tkn) { this.token = this._jwtHelper.decodeToken(tkn) }
  }
  checkParams() {
    let newParams = localStorage.getItem('userParams')
    if (newParams) {
      let jpar = JSON.parse(newParams)
      for (let p in jpar) {this.params[p] = jpar[p]}
    }
  }

  updateParams(newPar:any) {
    for (let p in newPar) {this.params[p] = newPar[p]}
    localStorage.setItem('userParams', JSON.stringify(this.params))
  }

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
    this._socketService.setupSocketConnection(this.user);
  }
  purgeToken() {
    localStorage.removeItem('userToken')
    this.token = {}
    localStorage.setItem('userParams', '{"autoreco": false}')
    this.params.autoreco = false
  }



}
