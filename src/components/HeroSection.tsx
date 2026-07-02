import { Link } from "react-router-dom";
import { ArrowRight, Sparkles, Users, Eye } from "lucide-react";
import heroGallery from "@/assets/hero-gallery.jpg";

const HeroSection = () => {
  return (
    <section className="relative pt-28 pb-16 bg-background text-foreground overflow-hidden">
      {/* Editorial masthead */}
      <div className="container mx-auto px-4 md:px-8 mb-8">
        <div className="flex items-end justify-between border-b border-gold/20 pb-4">
          <div>
            <p className="editorial-eyebrow mb-2">N°01 · Édition Courante</p>
            <h1 className="font-serif text-5xl md:text-7xl leading-[0.95] text-foreground">
              L'atelier <span className="italic text-[hsl(var(--gold-light))]">éditorial</span>
              <br />de la bande dessinée.
            </h1>
          </div>
          <p className="hidden md:block max-w-xs text-sm text-muted-foreground italic font-serif">
            « Une revue vivante où chaque planche est un manifeste — lisez, forgez, publiez. »
          </p>
        </div>
      </div>

      {/* Bento */}
      <div className="container mx-auto px-4 md:px-8">
        <main className="grid grid-cols-1 md:grid-cols-4 md:grid-rows-3 gap-4 h-auto md:h-[720px]">

          {/* Galerie — grand bloc image */}
          <Link
            to="/gallery"
            className="md:col-span-2 md:row-span-2 bg-card rounded-3xl border border-gold/20 overflow-hidden group relative"
          >
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/40 to-transparent z-10" />
            <img
              src={heroGallery}
              alt="Galerie éditoriale ScriptGenius"
              width={1024}
              height={1024}
              className="absolute inset-0 h-full w-full object-cover opacity-60 grayscale group-hover:grayscale-0 group-hover:scale-105 transition-all duration-[900ms]"
            />
            <div className="relative z-20 h-full p-8 md:p-10 flex flex-col justify-end">
              <span className="editorial-eyebrow mb-3">Accès Libre</span>
              <h2 className="font-serif text-4xl md:text-6xl text-[hsl(var(--gold-light))] mb-4 leading-none">
                Galerie <span className="italic">d'Œuvres</span>
              </h2>
              <p className="text-muted-foreground max-w-sm mb-6">
                Explorez des milliers de planches signées par la communauté et nos artistes résidents.
              </p>
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-[hsl(var(--gold))] text-[hsl(var(--ink))] font-semibold rounded-full w-fit group-hover:bg-[hsl(var(--gold-light))] transition-colors">
                Découvrir la Galerie <ArrowRight className="h-4 w-4" />
              </span>
            </div>
          </Link>

          {/* Bibliothèque Premium */}
          <Link
            to="/premium-store"
            className="md:col-span-2 md:row-span-1 bg-card rounded-3xl border border-gold/40 p-8 flex flex-col justify-between relative overflow-hidden group hover:-translate-y-1 transition-transform"
          >
            <div className="absolute top-0 right-0 p-4">
              <div className="w-12 h-12 border border-gold/30 rounded-full flex items-center justify-center group-hover:border-gold transition-colors">
                <div className="w-2 h-2 bg-[hsl(var(--gold-light))] rounded-full animate-pulse" />
              </div>
            </div>
            <div>
              <span className="editorial-eyebrow">Tirages Limités</span>
              <h2 className="font-serif text-3xl md:text-4xl text-[hsl(var(--gold-light))] mt-2">
                Bibliothèque <span className="italic">Premium</span>
              </h2>
              <p className="text-muted-foreground mt-2 text-sm">Éditions limitées et tirages haute définition.</p>
            </div>
            <div className="flex items-center justify-between mt-4">
              <div className="flex -space-x-2">
                <div className="w-8 h-8 rounded-full border border-background bg-neutral-800 flex items-center justify-center text-[10px] text-muted-foreground">+</div>
                <div className="w-8 h-8 rounded-full border border-background bg-neutral-700" />
                <div className="w-8 h-8 rounded-full border border-background bg-neutral-600" />
              </div>
              <span className="text-[hsl(var(--gold))] text-sm font-semibold hover:text-[hsl(var(--gold-light))] underline underline-offset-4 flex items-center gap-1">
                Accéder au Store <ArrowRight className="h-3 w-3" />
              </span>
            </div>
          </Link>

          {/* Moteur IA */}
          <Link
            to="/scripts"
            className="md:col-span-1 md:row-span-1 bg-gradient-to-br from-card to-background rounded-3xl border border-gold/10 p-6 flex flex-col justify-center items-center text-center hover:border-gold/40 transition-colors group"
          >
            <Sparkles className="w-10 h-10 text-[hsl(var(--gold))] mb-4 group-hover:rotate-12 transition-transform" />
            <h3 className="font-serif text-2xl text-[hsl(var(--gold-light))]">
              Moteur de <span className="italic">Scénario</span>
            </h3>
            <p className="text-xs text-muted-foreground mt-2">L'IA au service de votre narration.</p>
          </Link>

          {/* Stats */}
          <div className="md:col-span-1 md:row-span-1 bg-card rounded-3xl border border-gold/10 p-6 flex flex-col justify-center">
            <span className="font-serif text-4xl text-[hsl(var(--gold-light))] font-light">1.2M+</span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground mt-1">Planches créées</span>
            <div className="h-px bg-gold/20 my-3" />
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Eye className="h-3 w-3 text-[hsl(var(--gold))]" /> 12.8k lecteurs actifs
            </div>
          </div>

          {/* Séries en cours — long bloc */}
          <Link
            to="/gallery"
            className="md:col-span-3 md:row-span-1 bg-card rounded-3xl border border-gold/10 p-6 md:p-8 flex items-center justify-between group cursor-pointer hover:bg-[hsl(0_0%_12%)] transition-colors"
          >
            <div className="flex items-center gap-6">
              <div className="w-16 h-20 bg-gradient-ink rounded-lg border border-gold/20 shrink-0 flex items-center justify-center">
                <span className="font-serif italic text-[hsl(var(--gold))]">04</span>
              </div>
              <div>
                <span className="editorial-eyebrow">Feuilleton</span>
                <h4 className="font-serif text-2xl text-[hsl(var(--gold-light))] mt-1">
                  Séries en Cours <span className="italic ml-2 opacity-50">Vol. 04</span>
                </h4>
                <p className="text-sm text-muted-foreground">Suivez les aventures hebdomadaires de nos créateurs stars.</p>
              </div>
            </div>
            <ArrowRight className="hidden md:block w-8 h-8 text-[hsl(var(--gold))] group-hover:translate-x-2 transition-transform" />
          </Link>

          {/* Créateurs — bloc doré */}
          <Link
            to="/rewards"
            className="md:col-span-1 md:row-span-1 bg-gradient-gold rounded-3xl p-6 flex flex-col justify-between group cursor-pointer hover:brightness-110 transition-all"
          >
            <h3 className="text-[hsl(var(--ink))] text-lg font-semibold leading-tight">
              Découvrir les<br />Créateurs Stars
            </h3>
            <div className="flex justify-end">
              <div className="w-10 h-10 bg-[hsl(var(--ink))] rounded-full flex items-center justify-center text-[hsl(var(--gold-light))] group-hover:scale-110 transition-transform">
                <Users className="w-5 h-5" />
              </div>
            </div>
          </Link>
        </main>
      </div>
    </section>
  );
};

export default HeroSection;
