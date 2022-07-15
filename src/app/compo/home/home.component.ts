import { Component, OnInit } from '@angular/core';
import { UserService } from 'src/app/services/user.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  prevUser = {id: '', name: '', color: ''}
  params:any = {}

  constructor(
    private _userService: UserService
  ) { }

  ngOnInit(): void {
    if (this._userService.checkToken()) {this.prevUser = this._userService.token}
    this.params = this._userService.checkParams();
  }

  login(form:any) {
    if (form.value.username != '') {
      this._userService.loguser(form.value.username)
    }
  }

  reconnect() {
    this._userService.reconnect()
  }

  switchAutocoParam() {
    if (this.params.autoreco == 'non') { this.params.autoreco = 'oui' }
    else { this.params.autoreco = 'non' }
    this._userService.updateParams(this.params)
  }

  destroyToken() {
    this.prevUser = {id: '', name: '', color: ''}
    this.params = this._userService.DEFAULTPARAMS
    this._userService.purgeToken()
    localStorage.removeItem('myDocs')
  }

}
