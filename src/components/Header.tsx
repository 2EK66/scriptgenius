
import { Button } from "@/components/ui/button";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Film, User, Crown, LogOut, Palette, Trophy, Menu, Info, Star, Zap, DollarSign, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "./AuthModal";

const Header = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="fixed top-0 w-full z-50 backdrop-blur-lg bg-white/10 border-b border-white/20">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-script rounded-lg">
            <Film className="h-6 w-6 text-white" />
          </div>
          <h1 className="text-2xl font-bold gradient-text">ScriptGenius</h1>
        </Link>
        
        <nav className="hidden md:flex items-center space-x-6">
          <a href="#features" className="text-slate-600 hover:text-script-primary transition-colors">
            Fonctionnalités
          </a>
          <a href="#pricing" className="text-slate-600 hover:text-script-primary transition-colors">
            Tarifs
          </a>
          <a href="#about" className="text-slate-600 hover:text-script-primary transition-colors">
            À propos
          </a>
          <Link to="/comic-generator" className="text-slate-600 hover:text-script-primary transition-colors flex items-center">
            <Palette className="h-4 w-4 mr-1" />
            Créer BD
          </Link>
          <Link to="/series/create" className="text-slate-600 hover:text-script-primary transition-colors">
            Séries
          </Link>
          <Link to="/gallery" className="text-slate-600 hover:text-script-primary transition-colors">
            Galerie
          </Link>
          <Link to="/rewards" className="text-slate-600 hover:text-script-primary transition-colors flex items-center">
            <Trophy className="h-4 w-4 mr-1" />
            Récompenses
          </Link>
          <Link to="/premium-store" className="text-slate-600 hover:text-script-primary transition-colors flex items-center">
            <ShoppingBag className="h-4 w-4 mr-1" />
            Boutique Premium
          </Link>
        </nav>

        <div className="flex items-center space-x-3">
          {/* Menu déroulant pour mobile et liens rapides */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="text-slate-600">
                <Menu className="h-4 w-4 mr-2" />
                Menu
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56 bg-white/95 backdrop-blur-sm border border-white/20">
              <DropdownMenuItem asChild>
                <Link to="/comic-generator" className="flex items-center">
                  <Palette className="h-4 w-4 mr-2" />
                  Créer BD
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/series/create" className="flex items-center">
                  <Film className="h-4 w-4 mr-2" />
                  Créer Série
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/gallery" className="flex items-center">
                  <Star className="h-4 w-4 mr-2" />
                  Galerie
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/rewards" className="flex items-center">
                  <Trophy className="h-4 w-4 mr-2" />
                  Récompenses
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/author-dashboard" className="flex items-center">
                  <DollarSign className="h-4 w-4 mr-2" />
                  Mes Gains
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link to="/premium-store" className="flex items-center">
                  <ShoppingBag className="h-4 w-4 mr-2" />
                  Boutique Premium
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="#features" className="flex items-center">
                  <Zap className="h-4 w-4 mr-2" />
                  Fonctionnalités
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="#pricing" className="flex items-center">
                  <Crown className="h-4 w-4 mr-2" />
                  Tarifs
                </a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="#about" className="flex items-center">
                  <Info className="h-4 w-4 mr-2" />
                  À propos
                </a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {user ? (
            <>
              <span className="text-sm text-slate-600 hidden sm:block">
                {user.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={signOut}
                className="text-slate-600"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </>
          ) : (
            <AuthModal>
              <Button variant="ghost" size="sm" className="text-slate-600">
                <User className="h-4 w-4 mr-2" />
                Connexion
              </Button>
            </AuthModal>
          )}
          
          <Button size="sm" className="bg-gradient-premium text-white hover:opacity-90 transition-opacity">
            <Crown className="h-4 w-4 mr-2" />
            Premium+
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
