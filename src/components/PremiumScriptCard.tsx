import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { BookOpen, Calendar, Eye, Lock, Crown, Star, ShoppingCart } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

interface PremiumScript {
  id: string;
  title: string;
  content: string;
  genre: string;
  age_range: string;
  theme: string;
  created_at: string;
  price: number;
  author_name: string;
  user_id: string;
  preview_content?: string;
  word_count?: number;
  is_purchased?: boolean;
}

interface PremiumScriptCardProps {
  script: PremiumScript;
  onPurchase?: (scriptId: string) => void;
}

const PremiumScriptCard = ({ script, onPurchase }: PremiumScriptCardProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isPurchasing, setIsPurchasing] = useState(false);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(price / 100);
  };

  const handlePurchase = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour acheter une œuvre premium.",
        variant: "destructive"
      });
      return;
    }

    if (script.user_id === user.id) {
      toast({
        title: "Achat impossible",
        description: "Vous ne pouvez pas acheter votre propre œuvre.",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsPurchasing(true);

      // Fonctionnalité en attente - pas de vérification pour le moment
      const existingPurchase = null;

      if (existingPurchase) {
        toast({
          title: "Déjà acheté",
          description: "Vous possédez déjà cette œuvre premium.",
          variant: "destructive"
        });
        return;
      }

      // Créer une transaction d'achat via CinetPay
      const { createScriptPurchase } = await import('@/services/cinetpayService');
      
      const response = await createScriptPurchase({
        scriptId: script.id,
        price: script.price,
      });

      if (response.success && response.payment_url) {
        // Rediriger vers la page de paiement CinetPay
        window.location.href = response.payment_url;
      } else {
        throw new Error(response.error || 'Erreur lors de la création du paiement');
      }

      onPurchase?.(script.id);
    } catch (error) {
      console.error('Purchase error:', error);
      toast({
        title: "Erreur d'achat",
        description: "Impossible de procéder à l'achat. Veuillez réessayer.",
        variant: "destructive"
      });
    } finally {
      setIsPurchasing(false);
    }
  };

  const previewContent = script.preview_content || script.content.substring(0, 300) + "...";
  const canPurchase = user && script.user_id !== user.id && !script.is_purchased;

  return (
    <Card className="group hover:shadow-lg transition-all duration-200 border-2 border-amber-200 bg-gradient-to-br from-amber-50 to-orange-50">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-2">
              <Crown className="h-5 w-5 text-amber-600" />
              <Badge className="bg-gradient-premium text-white">
                Premium
              </Badge>
            </div>
            <CardTitle className="text-lg line-clamp-2 flex-1 mr-2">
              {script.title}
            </CardTitle>
            <p className="text-sm text-slate-600">Par {script.author_name}</p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-amber-600">
              {formatPrice(script.price)}
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            {script.genre}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {script.age_range}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {script.theme}
          </Badge>
          {script.word_count && (
            <Badge variant="outline" className="text-xs">
              {script.word_count} mots
            </Badge>
          )}
        </div>

        {/* Prévisualisation */}
        <div className="bg-white p-4 rounded-lg border border-amber-200">
          <h4 className="font-medium mb-2 flex items-center">
            <Eye className="h-4 w-4 mr-2 text-amber-600" />
            Aperçu gratuit
          </h4>
          <p className="text-sm text-slate-600 line-clamp-4">
            {previewContent}
          </p>
          {script.content.length > 300 && (
            <div className="mt-2 text-xs text-amber-600 flex items-center">
              <Lock className="h-3 w-3 mr-1" />
              Contenu complet disponible après achat
            </div>
          )}
        </div>

        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(script.created_at)}
          </div>
        </div>

        {/* Boutons d'action */}
        <div className="flex gap-2">
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" className="flex-1">
                <Eye className="h-4 w-4 mr-2" />
                Aperçu
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Crown className="h-5 w-5 text-amber-600" />
                  {script.title}
                  <Badge className="bg-gradient-premium text-white">Premium</Badge>
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Badge variant="outline">{script.genre}</Badge>
                  <Badge variant="outline">{script.age_range}</Badge>
                  <Badge variant="outline">{script.theme}</Badge>
                </div>
                <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                  <h4 className="font-medium mb-2 text-amber-800">Aperçu gratuit</h4>
                  <pre className="whitespace-pre-wrap text-sm font-mono leading-relaxed">
                    {previewContent}
                  </pre>
                  {script.content.length > 300 && (
                    <div className="mt-4 p-3 bg-amber-100 rounded border-l-4 border-amber-400">
                      <p className="text-amber-800 font-medium flex items-center">
                        <Lock className="h-4 w-4 mr-2" />
                        Contenu complet disponible après achat
                      </p>
                      <p className="text-sm text-amber-700 mt-1">
                        Prix: {formatPrice(script.price)}
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </DialogContent>
          </Dialog>

          {script.is_purchased ? (
            <Button className="flex-1 bg-green-600 hover:bg-green-700">
              <Star className="h-4 w-4 mr-2" />
              Possédé
            </Button>
          ) : canPurchase ? (
            <Button 
              onClick={handlePurchase} 
              disabled={isPurchasing}
              className="flex-1 bg-gradient-premium hover:opacity-90"
            >
              <ShoppingCart className="h-4 w-4 mr-2" />
              {isPurchasing ? 'Achat...' : `Acheter ${formatPrice(script.price)}`}
            </Button>
          ) : (
            <Button disabled className="flex-1">
              <Lock className="h-4 w-4 mr-2" />
              {!user ? 'Connexion requise' : 'Non disponible'}
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PremiumScriptCard;