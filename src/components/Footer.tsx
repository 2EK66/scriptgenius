
import { Film, Mail, Twitter, Github, Linkedin } from "lucide-react";

const Footer = () => {
  return (
    <footer className="bg-slate-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Logo et description */}
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-2 mb-4">
              <div className="p-2 bg-gradient-script rounded-lg">
                <Film className="h-6 w-6 text-white" />
              </div>
              <h3 className="text-2xl font-bold gradient-text">ScriptGenius</h3>
            </div>
            <p className="text-slate-400 mb-4 max-w-md">
              La plateforme de référence pour créer des scénarios professionnels 
              grâce à l'intelligence artificielle.
            </p>
            <div className="flex space-x-4">
              <Twitter className="h-5 w-5 text-slate-400 hover:text-script-accent cursor-pointer transition-colors" />
              <Github className="h-5 w-5 text-slate-400 hover:text-script-accent cursor-pointer transition-colors" />
              <Linkedin className="h-5 w-5 text-slate-400 hover:text-script-accent cursor-pointer transition-colors" />
              <Mail className="h-5 w-5 text-slate-400 hover:text-script-accent cursor-pointer transition-colors" />
            </div>
          </div>

          {/* Liens rapides */}
          <div>
            <h4 className="font-semibold mb-4">Produit</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Fonctionnalités</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Tarifs</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Démo</a></li>
              <li><a href="#" className="hover:text-white transition-colors">API</a></li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2 text-slate-400">
              <li><a href="#" className="hover:text-white transition-colors">Centre d'aide</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Contact</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Communauté</a></li>
              <li><a href="#" className="hover:text-white transition-colors">Statut</a></li>
            </ul>
          </div>
        </div>

        <div className="border-t border-slate-800 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
          <p className="text-slate-400 text-sm">
            © 2024 ScriptGenius. Tous droits réservés.
          </p>
          <div className="flex space-x-6 mt-4 md:mt-0">
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
              Confidentialité
            </a>
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
              Conditions
            </a>
            <a href="#" className="text-slate-400 hover:text-white text-sm transition-colors">
              Cookies
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
