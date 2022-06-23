import { Component, OnInit } from '@angular/core';
import { SocketioService } from 'src/app/services/socketio.service';
import { UserService } from 'src/app/services/user.service';
import { UtilService } from 'src/app/services/util.service';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css']
})
export class HomeComponent implements OnInit {

  user = {id: '', name: '', color: ''}

  params:any = {}

  constructor(
    private _utilService: UtilService,
    private _socketService: SocketioService,
    private _userService: UserService
  ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit() {
    this._userService.checkToken();
    this._userService.checkParams();
    if (this._userService.params.autoreco) { this._userService.reconnect() }
  }

  login(form:any) {
    if (form.value.username != '') {
      this._userService.loguser(form.value.username)
    }
  }

  switchAutocoParam() {
    if (!this.params.autoreco) {
      this.params.autoreco = true
      localStorage.setItem('userParams', JSON.stringify(this.params))
    }
    else {
      this.params.autoreco = false
      localStorage.setItem('userParams', JSON.stringify(this.params))
    }
  }

}
