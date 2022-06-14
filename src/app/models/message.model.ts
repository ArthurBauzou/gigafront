export class Message {
    public auteur: string;
    public couleur: string;
    public contenu: string;
    public date: Date;

    constructor(auteur:string, couleur:string, contenu:string, date: Date = new Date) {
        this.auteur = auteur;
        this.couleur = couleur;
        this.contenu = contenu;
        this.date = date;
    }

}