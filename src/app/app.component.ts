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

  userid = ''
  userSub:Subscription;

  constructor(
    private _userService: UserService
  ) {   
    this.userSub = this._userService.watchUser().subscribe((user) => {
      this.userid = user.id
    })
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
