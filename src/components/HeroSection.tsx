
import { Button } from "@/components/ui/button";
import { Sparkles, Play, Zap, Images, Palette } from "lucide-react";
import { Link } from "react-router-dom";

const HeroSection = () => {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-slate-900 via-script-primary/20 to-script-secondary/30"></div>
      
      {/* Animated background elements */}
      <div className="absolute inset-0">
        <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-script-primary/10 rounded-full blur-3xl animate-float"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-script-accent/10 rounded-full blur-3xl animate-float" style={{animationDelay: '1s'}}></div>
      </div>

      <div className="relative z-10 container mx-auto px-4 text-center">
        <div className="animate-fade-in">
          <div className="inline-flex items-center px-4 py-2 mb-6 glass-card rounded-full">
            <Sparkles className="h-4 w-4 text-accent mr-2" />
            <span className="text-sm text-foreground">IA de nouvelle génération</span>
          </div>
          
          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold mb-6 text-foreground leading-tight">
            Créez des scénarios
            <span className="block gradient-text">extraordinaires</span>
            <span className="block text-foreground">en quelques clics</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto leading-relaxed">
            ScriptGenius transforme vos idées en scénarios professionnels grâce à l'intelligence artificielle. 
            Personnalisez, exportez et donnez vie à vos histoires.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-12">
            <Button size="lg" className="bg-gradient-script text-primary-foreground px-8 py-4 text-lg hover:scale-105 transition-transform">
              <Play className="h-5 w-5 mr-2" />
              Commencer gratuitement
            </Button>
            <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground px-8 py-4 text-lg">
              <Zap className="h-5 w-5 mr-2" />
              Voir la démo
            </Button>
            <Button size="lg" variant="outline" className="border-accent text-accent hover:bg-accent hover:text-accent-foreground px-8 py-4 text-lg border-2" asChild>
              <Link to="/comic-generator">
                <Palette className="h-5 w-5 mr-2" />
                Créer une BD
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="border-border text-foreground hover:bg-accent hover:text-accent-foreground px-8 py-4 text-lg" asChild>
              <Link to="/gallery">
                <Images className="h-5 w-5 mr-2" />
                Explorer la galerie
              </Link>
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
            <div className="glass-card p-6 rounded-xl text-center">
              <div className="text-3xl font-bold text-accent mb-2">1M+</div>
              <div className="text-muted-foreground">Scénarios générés</div>
            </div>
            <div className="glass-card p-6 rounded-xl text-center">
              <div className="text-3xl font-bold text-accent mb-2">50K+</div>
              <div className="text-muted-foreground">Utilisateurs actifs</div>
            </div>
            <div className="glass-card p-6 rounded-xl text-center">
              <div className="text-3xl font-bold text-accent mb-2">4.9/5</div>
              <div className="text-muted-foreground">Note moyenne</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
