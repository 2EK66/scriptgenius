
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Coins, CreditCard, Crown, Check } from "lucide-react";
import { useCredits } from "@/hooks/useCredits";
import { useToast } from "@/components/ui/use-toast";
import { createCinetPayPayment } from "@/services/cinetpayService";

const CreditsPurchase = () => {
  const { credits, packages, loading } = useCredits();
  const { toast } = useToast();
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (packageId: string) => {
    setPurchasing(packageId);
    
    try {
      // For now, simulate purchase - in real implementation, integrate with your payment system
      toast({
        title: "Achat en cours",
        description: "Redirection vers le système de paiement...",
      });
      
      // Here you would integrate with CinetPay or another payment system
      // const result = await createCinetPayPayment({ plan: 'credits', package: packageId });
      
    } catch (error) {
      toast({
        title: "Erreur de paiement",
        description: "Impossible de traiter votre achat. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setPurchasing(null);
    }
  };

  const getPremiumFeatures = () => [
    "1000 crédits images",
    "Lecture vocale illimitée",
    "Export PDF illimité", 
    "Génération prioritaire",
    "Structure de script + BD automatique",
    "Jusqu'à +10 personnages",
    "Personnalisation avancée (âge/genre)"
  ];

  if (loading) {
    return <div>Chargement...</div>;
  }

  return (
    <div className="space-y-6">
      <Card className="border-amber-200 bg-amber-50/50">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-800">
            <Coins className="h-5 w-5 mr-2" />
            Vos Crédits
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center">
            <div className="text-3xl font-bold text-amber-800 mb-2">
              {credits}
            </div>
            <p className="text-sm text-amber-600">
              crédits restants
            </p>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {packages.map((pkg) => (
          <Card key={pkg.id} className={`relative ${pkg.name.includes('Premium+') ? 'border-2 border-script-accent bg-gradient-to-br from-script-accent/5 to-script-accent/10' : ''}`}>
            <CardHeader>
              <CardTitle className="text-lg flex items-center">
                {pkg.name.includes('Premium+') && <Crown className="h-5 w-5 mr-2 text-script-accent" />}
                {pkg.name}
              </CardTitle>
              {pkg.name.includes('Standard') && (
                <Badge className="absolute top-2 right-2 bg-green-100 text-green-800">
                  Populaire
                </Badge>
              )}
              {pkg.name.includes('Premium+') && (
                <Badge className="absolute top-2 right-2 bg-script-accent text-white">
                  <Crown className="h-3 w-3 mr-1" />
                  Premium
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-center">
                <div className="text-2xl font-bold">
                  {pkg.credits}
                </div>
                <p className="text-sm text-slate-600">crédits</p>
              </div>
              
              <div className="text-center">
                <div className="text-lg font-semibold">
                  {(pkg.price_cents / 100).toFixed(2)} €
                </div>
                <p className="text-xs text-slate-500">
                  {((pkg.price_cents / 100) / pkg.credits).toFixed(3)} € par crédit
                </p>
              </div>

              <p className="text-sm text-slate-600 text-center">
                {pkg.description}
              </p>

              {pkg.name.includes('Premium+') && (
                <div className="space-y-2">
                  <h4 className="font-medium text-sm text-script-accent">Fonctionnalités incluses :</h4>
                  <ul className="text-xs text-slate-600 space-y-1">
                    {getPremiumFeatures().map((feature, index) => (
                      <li key={index} className="flex items-center">
                        <Check className="h-3 w-3 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              <Button
                onClick={() => handlePurchase(pkg.id)}
                disabled={purchasing === pkg.id}
                className={`w-full ${pkg.name.includes('Premium+') ? 'bg-gradient-premium text-white hover:opacity-90' : ''}`}
              >
                {purchasing === pkg.id ? (
                  "Traitement..."
                ) : (
                  <>
                    <CreditCard className="h-4 w-4 mr-2" />
                    Acheter
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center text-sm text-slate-500">
        <p>1 crédit = 1 image générée</p>
        <p>Paiement sécurisé • Pas d'abonnement • Crédits sans expiration</p>
      </div>
    </div>
  );
};

export default CreditsPurchase;
