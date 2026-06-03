import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Package, Calendar, Sparkles, ShoppingCart } from 'lucide-react';
import { usePremiumSlots } from '@/hooks/usePremiumSlots';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

const PremiumSlotPurchase = () => {
  const { 
    packages, 
    availableScriptSlots, 
    availableComicSlots, 
    canBuySlot,
    refreshSlots 
  } = usePremiumSlots();
  
  const [purchasing, setPurchasing] = useState<string | null>(null);

  const handlePurchase = async (slotType: 'script' | 'comic') => {
    setPurchasing(slotType);
    
    try {
      const packageInfo = packages.find(p => p.type === slotType);
      if (!packageInfo) throw new Error('Package introuvable');

      // Appeler la fonction edge pour créer le paiement CinetPay
      const { data, error } = await supabase.functions.invoke('cinetpay-slot-purchase', {
        body: { 
          slotType,
          price: packageInfo.price 
        }
      });

      if (error) throw error;

      if (data.payment_url) {
        window.location.href = data.payment_url;
      } else {
        throw new Error('URL de paiement non disponible');
      }
    } catch (error: any) {
      console.error('Purchase error:', error);
      toast.error(error.message || 'Erreur lors de l\'achat');
    } finally {
      setPurchasing(null);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 text-center">
        <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
          Places Premium
        </h1>
        <p className="text-muted-foreground text-lg">
          Achetez des places premium pour vendre vos créations
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Places Scripts Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{availableScriptSlots} / 3</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Places BDs Disponibles</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{availableComicSlots} / 3</div>
          </CardContent>
        </Card>
      </div>

      {/* Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {packages.map((pkg) => {
          const isScript = pkg.type === 'script';
          const available = isScript ? availableScriptSlots : availableComicSlots;
          const canBuy = canBuySlot(pkg.type);
          
          return (
            <Card key={pkg.type} className="relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-primary/20 to-transparent rounded-bl-full" />
              
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-2xl">
                    {isScript ? 'Place Script' : 'Place BD'}
                  </CardTitle>
                  <Package className="h-8 w-8 text-primary" />
                </div>
                <CardDescription>
                  Vendez {isScript ? 'un scénario' : 'une bande dessinée'} en mode premium
                </CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-4">
                <div className="flex items-baseline gap-2">
                  <span className="text-4xl font-bold">{pkg.price}</span>
                  <span className="text-muted-foreground">XOF</span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    <Calendar className="h-4 w-4 text-primary" />
                    <span>Valable {pkg.duration_months} mois</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Sparkles className="h-4 w-4 text-primary" />
                    <span>Commission de 2% sur les ventes</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <ShoppingCart className="h-4 w-4 text-primary" />
                    <span>Maximum 3 places actives</span>
                  </div>
                </div>

                <div className="pt-4">
                  <Button 
                    className="w-full" 
                    disabled={!canBuy || purchasing !== null}
                    onClick={() => handlePurchase(pkg.type)}
                  >
                    {purchasing === pkg.type ? (
                      'Redirection...'
                    ) : !canBuy ? (
                      'Maximum atteint'
                    ) : (
                      `Acheter pour ${pkg.price} XOF`
                    )}
                  </Button>
                  
                  {available > 0 && (
                    <Badge variant="outline" className="w-full mt-2 justify-center">
                      {available} place{available > 1 ? 's' : ''} disponible{available > 1 ? 's' : ''}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Info */}
      <Card className="mt-8 border-primary/20 bg-primary/5">
        <CardHeader>
          <CardTitle className="text-lg">Comment ça marche ?</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-muted-foreground">
          <p>✨ Achetez une place premium pour 2 mois</p>
          <p>📝 Utilisez cette place pour mettre en vente un script ou une BD</p>
          <p>💰 Fixez votre prix et vendez votre création</p>
          <p>🏆 Gagnez des points et participez au classement des meilleurs créateurs</p>
          <p>⏱️ La place expire après 2 mois, achetez-en une nouvelle pour continuer</p>
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumSlotPurchase;
