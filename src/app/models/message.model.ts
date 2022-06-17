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

}