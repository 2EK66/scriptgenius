import { Button } from "@/components/ui/button";
import { Sparkles, Images, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative pt-20 pb-10 flex items-center justify-center overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-script-primary/20 to-script-secondary/30"></div>
      <div className="absolute inset-0">
        <div className="absolute top-0 left-1/4 w-72 h-72 bg-script-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-script-accent/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>
      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="inline-flex items-center px-4 py-1.5 mb-3 glass-card rounded-full">
          <Sparkles className="h-4 w-4 text-accent mr-2" />
          <span className="text-sm text-foreground">IA de nouvelle génération</span>
        </div>
        <h1 className="text-2xl md:text-4xl font-bold mb-2 text-foreground leading-tight">
          Lisez, créez et publiez <span className="gradient-text">vos BD</span>
        </h1>
        <p className="text-sm md:text-base text-muted-foreground mb-6 max-w-xl mx-auto">
          Deux portes d'entrée selon votre envie : lecture libre ou œuvres exclusives.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl mx-auto">
          <Link to="/gallery" className="glass-card rounded-2xl p-5 text-left hover:scale-[1.02] transition-transform group">
            <Images className="h-7 w-7 text-accent mb-2" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Galerie</h3>
            <p className="text-xs text-muted-foreground mb-3">Lecture gratuite des BD publiées par la communauté.</p>
            <Button variant="outline" size="sm" className="group-hover:bg-accent group-hover:text-accent-foreground">
              Parcourir la galerie
            </Button>
          </Link>
          <Link to="/premium-store" className="glass-card rounded-2xl p-5 text-left hover:scale-[1.02] transition-transform group border-accent/30">
            <ShoppingBag className="h-7 w-7 text-accent mb-2" />
            <h3 className="text-lg font-semibold text-foreground mb-1">Bibliothèque Premium</h3>
            <p className="text-xs text-muted-foreground mb-3">Œuvres exclusives à acheter et soutenir leurs auteurs.</p>
            <Button size="sm" className="bg-gradient-premium text-white">
              Explorer la boutique
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
