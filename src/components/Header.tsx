
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Film, User, Crown, LogOut, Briefcase, ShoppingBag, Images, Tag, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import AuthModal from "./AuthModal";

const Header = () => {
  const { user, signOut } = useAuth();

  const initial = user?.email?.[0]?.toUpperCase() || "U";
  return (
    <header className="fixed top-0 w-full z-50 backdrop-blur-xl bg-background/70 border-b border-gold/15">
      <div className="container mx-auto px-4 py-4 flex items-center justify-between">
        <Link to="/" className="flex items-center space-x-2">
          <div className="p-2 bg-gradient-gold rounded-lg">
            <Film className="h-5 w-5 text-[hsl(var(--ink))]" />
          </div>
          <h1 className="font-serif text-2xl text-foreground tracking-tight">Script<span className="italic text-[hsl(var(--gold-light))]">Genius</span></h1>
        </Link>

        <nav className="hidden md:flex items-center space-x-6">
          <Link to="/gallery" className="text-muted-foreground hover:text-[hsl(var(--gold-light))] transition-colors flex items-center text-sm">
            <Images className="h-4 w-4 mr-1" /> Galerie
          </Link>
          <Link to="/premium-store" className="text-muted-foreground hover:text-[hsl(var(--gold-light))] transition-colors flex items-center text-sm">
            <ShoppingBag className="h-4 w-4 mr-1" /> Bibliothèque Premium
          </Link>
          <a href="/#pricing" className="text-muted-foreground hover:text-[hsl(var(--gold-light))] transition-colors flex items-center text-sm">
            <Tag className="h-4 w-4 mr-1" /> Tarifs
          </a>
          <a href="/#about" className="text-muted-foreground hover:text-[hsl(var(--gold-light))] transition-colors flex items-center text-sm">
            <Info className="h-4 w-4 mr-1" /> À propos
          </a>
        </nav>

        <div className="flex items-center space-x-3">
          {user ? (
            <>
              <Button asChild size="sm" className="bg-gradient-gold text-[hsl(var(--ink))] hover:brightness-110 font-semibold rounded-full">
                <Link to="/workplace" className="flex items-center">
                  <Briefcase className="h-4 w-4 mr-2" /> Mon Espace
                </Link>
              </Button>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="px-2" aria-label="Compte">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gradient-gold text-[hsl(var(--ink))] text-sm font-semibold">{initial}</AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to="/workplace" className="flex items-center">
                      <Briefcase className="h-4 w-4 mr-2" /> Mon Espace
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={signOut}>
                    <LogOut className="h-4 w-4 mr-2" /> Déconnexion
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <AuthModal>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-[hsl(var(--gold-light))]">
                <User className="h-4 w-4 mr-2" />
                Connexion
              </Button>
            </AuthModal>
          )}

          <Button size="sm" className="bg-gradient-gold text-[hsl(var(--ink))] hover:brightness-110 font-semibold rounded-full hidden sm:inline-flex">
            <Crown className="h-4 w-4 mr-2" />
            Premium+
          </Button>
        </div>
      </div>
    </header>
  );
};

export default Header;
