import { Film, Mail, Twitter, Github, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-background text-foreground py-16 border-t border-gold/15">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-gradient-gold rounded-lg">
                <Film className="h-5 w-5 text-[hsl(var(--ink))]" />
              </div>
              <h3 className="font-serif text-2xl text-foreground">
                Script<span className="italic text-[hsl(var(--gold-light))]">Genius</span>
              </h3>
            </div>
            <p className="text-muted-foreground mb-4 max-w-md font-serif italic">
              « Une revue vivante où chaque planche est un manifeste. »
            </p>
            <div className="flex space-x-4">
              <Twitter className="h-5 w-5 text-muted-foreground hover:text-[hsl(var(--gold-light))] cursor-pointer transition-colors" />
              <Github className="h-5 w-5 text-muted-foreground hover:text-[hsl(var(--gold-light))] cursor-pointer transition-colors" />
              <Linkedin className="h-5 w-5 text-muted-foreground hover:text-[hsl(var(--gold-light))] cursor-pointer transition-colors" />
              <Mail className="h-5 w-5 text-muted-foreground hover:text-[hsl(var(--gold-light))] cursor-pointer transition-colors" />
            </div>
          </div>

          <div>
            <h4 className="editorial-eyebrow mb-4">Produit</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><a href="#" className="hover:text-[hsl(var(--gold-light))] transition-colors">Fonctionnalités</a></li>
              <li><a href="#" className="hover:text-[hsl(var(--gold-light))] transition-colors">Tarifs</a></li>
              <li><a href="#" className="hover:text-[hsl(var(--gold-light))] transition-colors">Démo</a></li>
              <li><a href="#" className="hover:text-[hsl(var(--gold-light))] transition-colors">API</a></li>
            </ul>
          </div>

          <div>
            <h4 className="editorial-eyebrow mb-4">Support</h4>
            <ul className="space-y-2 text-muted-foreground text-sm">
              <li><a href="#" className="hover:text-[hsl(var(--gold-light))] transition-colors">Centre d'aide</a></li>
              <li><a href="#" className="hover:text-[hsl(var(--gold-light))] transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-[hsl(var(--gold-light))] transition-colors">Communauté</a></li>
              <li><a href="#" className="hover:text-[hsl(var(--gold-light))] transition-colors">Statut</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-gold/15 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-muted-foreground text-xs uppercase tracking-widest">
            © 2026 ScriptGenius · Édition N°01
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0 text-sm">
            <a href="#" className="text-muted-foreground hover:text-[hsl(var(--gold-light))] transition-colors">Confidentialité</a>
            <a href="#" className="text-muted-foreground hover:text-[hsl(var(--gold-light))] transition-colors">Conditions</a>
            <a href="#" className="text-muted-foreground hover:text-[hsl(var(--gold-light))] transition-colors">Cookies</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;