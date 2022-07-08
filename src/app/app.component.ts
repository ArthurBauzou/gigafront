import { Component, HostListener } from '@angular/core';
import { Subscription } from 'rxjs';
import { UserService } from './services/user.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'gigachat';
  logo = {
    main: '',
    fr: ''
  }

  userid:string = this._userService.user.id
  userSub:Subscription

  constructor(
    private _userService: UserService
  ) {
    this.userSub = this._userService.watchUser().subscribe((user) => {
      this.userid = user.id
    })
    this.getRandomLogo()
  }

  getRandomLogo(){
    let logorandom = `glublogo${this.getRandom00(17)}.svg`
    let pointfrrandom = `pointfr${this.getRandom00(8)}.svg`
    this.logo.main = `../assets/glublogo/${logorandom}`
    this.logo.fr = `../assets/glublogo/${pointfrrandom}`
  }

  getRandom00(x:number):string{
    let n = Math.ceil(Math.random()*x)
    let n2:string = n.toString().padStart(2,'0')
    return n2
  }

  // Fonction d’afficahge / dissimulation
  @HostListener('document:click', ['$event.target'])
  @HostListener('window:keydown.escape')
  hidd(elt: any) {
    if (elt.classList.contains('nohidd')) {
      return
    }
    let tglbtns = document.querySelectorAll('.hid-container')
    tglbtns.forEach((btn) => {
      if (!btn.contains(elt)) {
        btn.querySelector('.hid-element')?.classList.add('hidd')
      }
    })
  }

}
