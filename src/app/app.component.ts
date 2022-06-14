import { Component, HostListener } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'gigafront';

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
