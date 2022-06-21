export class Message {
    public auteur: string;
    public couleur: string;
    public contenu: string;
    public style: string;
    public date: Date;

    constructor(auteur:string, couleur:string, contenu:string, style = '', date: Date = new Date) {
        this.auteur = auteur;
        this.couleur = couleur;
        this.contenu = contenu;
        this.style = style;
        this.date = date;
    }

    parse() {
        let res = {command: '', body: ''}
        if (this.contenu.startsWith("/")) {
            let commandSize = this.contenu.indexOf(' ')
            if (commandSize == -1) { res.command = this.contenu.substring(1) }
            else {
              res.command = this.contenu.substring(1,commandSize)
              res.body = this.contenu.substring(commandSize+1)
            }
        }
        return res
    }

}