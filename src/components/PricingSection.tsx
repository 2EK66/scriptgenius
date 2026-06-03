
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Crown, Zap, X, Users } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import { createCinetPayPayment } from "@/services/cinetpayService";
import AuthModal from "./AuthModal";

const PricingSection = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);

  const handlePremiumSubscription = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour souscrire à Premium+.",
        variant: "destructive",
      });
      return;
    }

    setIsProcessingPayment(true);
    
    try {
      const result = await createCinetPayPayment({ plan: 'premium' });
      
      if (result.success && result.payment_url) {
        // Ouvrir CinetPay dans une nouvelle fenêtre
        window.open(result.payment_url, '_blank');
        
        toast({
          title: "Redirection vers CinetPay",
          description: "Une nouvelle fenêtre s'est ouverte pour finaliser votre paiement.",
        });
      } else {
        throw new Error(result.error || 'Erreur lors de la création du paiement');
      }
    } catch (error) {
      console.error('Erreur paiement CinetPay:', error);
      toast({
        title: "Erreur",
        description: error instanceof Error ? error.message : "Une erreur est survenue lors du paiement.",
        variant: "destructive",
      });
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const features = [
    { name: "Scénarios générés", free: "1 par jour", premium: "Illimités" },
    { name: "Personnages", free: "3 max", premium: "+10 personnages" },
    { name: "Crédits images", free: false, premium: "1000 crédits inclus" },
    { name: "Export PDF", free: false, premium: true },
    { name: "Lecture vocale", free: false, premium: true },
    { name: "Génération prioritaire", free: false, premium: true },
    { name: "Création de BD", free: false, premium: true },
    { name: "Personnalisation avancée", free: false, premium: "Âge/Genre" },
    { name: "Templates avancés", free: false, premium: true },
    { name: "Support prioritaire", free: false, premium: true },
    { name: "Historique", free: "7 jours", premium: "Illimité" },
    { name: "Collaboration", free: false, premium: true }
  ];

  return (
    <section id="pricing" className="py-20 bg-gradient-to-br from-slate-900 to-slate-800">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
            Choisissez votre plan
          </h2>
          <p className="text-lg text-slate-300 max-w-2xl mx-auto">
            Commencez gratuitement, puis passez au Premium+ pour débloquer tout le potentiel de ScriptGenius.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-4xl mx-auto">
          {/* Plan Gratuit */}
          <Card className="border border-slate-700 bg-slate-800/50 backdrop-blur-sm">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-16 h-16 bg-slate-700 rounded-full flex items-center justify-center mb-4">
                <Zap className="h-8 w-8 text-slate-300" />
              </div>
              <CardTitle className="text-2xl text-white">Version Gratuite</CardTitle>
              <div className="text-4xl font-bold text-white mt-4">
                0€
                <span className="text-lg font-normal text-slate-400">/mois</span>
              </div>
              <p className="text-slate-400 mt-2">Parfait pour découvrir ScriptGenius</p>
            </CardHeader>
            <CardContent>
              <Button className="w-full mb-6 bg-slate-700 hover:bg-slate-600 text-white">
                Commencer gratuitement
              </Button>
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-slate-300">{feature.name}</span>
                    <span className="text-right">
                      {typeof feature.free === 'boolean' ? (
                        feature.free ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-slate-500" />
                        )
                      ) : (
                        <span className="text-slate-400 text-sm">{feature.free}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          {/* Plan Premium+ */}
          <Card className="border-2 border-script-accent bg-slate-800/50 backdrop-blur-sm premium-glow relative">
            <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
              <Badge className="bg-gradient-premium text-white px-4 py-1">
                <Crown className="h-4 w-4 mr-1" />
                Le plus populaire
              </Badge>
            </div>
            
            <CardHeader className="text-center pb-8">
              <div className="mx-auto w-16 h-16 bg-gradient-premium rounded-full flex items-center justify-center mb-4">
                <Crown className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-2xl text-white">Premium+</CardTitle>
              <div className="text-4xl font-bold text-white mt-4">
                6,50€
                <span className="text-lg font-normal text-slate-400">/mois</span>
              </div>
              <p className="text-slate-400 mt-2">Pour les créateurs ambitieux</p>
            </CardHeader>
            <CardContent>
              {user ? (
                <Button 
                  onClick={handlePremiumSubscription}
                  disabled={isProcessingPayment}
                  className="w-full mb-6 bg-gradient-premium text-white hover:opacity-90 transition-opacity"
                >
                  <Crown className="h-4 w-4 mr-2" />
                  {isProcessingPayment ? 'Traitement...' : 'Passer au Premium+'}
                </Button>
              ) : (
                <AuthModal>
                  <Button className="w-full mb-6 bg-gradient-premium text-white hover:opacity-90 transition-opacity">
                    <Crown className="h-4 w-4 mr-2" />
                    Se connecter pour souscrire
                  </Button>
                </AuthModal>
              )}
              
              <ul className="space-y-3">
                {features.map((feature, index) => (
                  <li key={index} className="flex items-center justify-between">
                    <span className="text-slate-300">{feature.name}</span>
                    <span className="text-right">
                      {typeof feature.premium === 'boolean' ? (
                        feature.premium ? (
                          <Check className="h-5 w-5 text-green-500" />
                        ) : (
                          <X className="h-5 w-5 text-slate-500" />
                        )
                      ) : (
                        <span className="text-script-accent text-sm font-medium">{feature.premium}</span>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
              
              <div className="mt-6 p-4 bg-script-accent/10 rounded-lg border border-script-accent/20">
                <div className="flex items-center mb-2">
                  <Users className="h-4 w-4 text-script-accent mr-2" />
                  <span className="text-script-accent font-medium">Personnalisation avancée</span>
                </div>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Personnaliser l'âge de vos personnages</li>
                  <li>• Choisir le genre (masculin/féminin)</li>
                  <li>• Définir l'apparence physique</li>
                  <li>• Traits de personnalité détaillés</li>
                </ul>
              </div>
              
              <div className="mt-4 p-4 bg-script-accent/10 rounded-lg border border-script-accent/20">
                <div className="flex items-center mb-2">
                  <Crown className="h-4 w-4 text-script-accent mr-2" />
                  <span className="text-script-accent font-medium">Bonus Premium+</span>
                </div>
                <ul className="text-sm text-slate-300 space-y-1">
                  <li>• Accès anticipé aux nouvelles fonctionnalités</li>
                  <li>• Templates exclusifs chaque mois</li>
                  <li>• Formation vidéo incluse</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="text-center mt-12">
          <p className="text-slate-400 mb-4">
            💳 Paiement sécurisé CinetPay • 🔄 Annulation à tout moment • 💯 Garantie 14 jours
          </p>
          <div className="flex justify-center items-center space-x-4">
            <img src="/api/placeholder/40/25" alt="Orange Money" className="opacity-60" />
            <img src="/api/placeholder/40/25" alt="MTN Money" className="opacity-60" />
            <img src="/api/placeholder/40/25" alt="Visa" className="opacity-60" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default PricingSection;
