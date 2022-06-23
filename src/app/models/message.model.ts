export class Message {
    public auteur: string;
    public auteurID: string;
    public couleur: string;
    public contenu: any;
    public style: string;
    public info: string;
    public date: Date;

    constructor(auteur:string, auteurID: string, couleur:string, contenu:any, style = '', info = '', date: Date = new Date()) {
        this.auteur = auteur;
        this.auteurID = auteurID
        this.couleur = couleur;
        this.contenu = contenu;
        this.style = style;
        this.info = info;
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