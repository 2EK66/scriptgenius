import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Crown, Star, Eye, DollarSign, TrendingUp, Settings } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";
import TopCreatorBadge from "./TopCreatorBadge";

interface PremiumScript {
  id: string;
  script_id: string;
  price: number;
  is_auto_promoted: boolean;
  sales_count: number;
  total_revenue: number;
  title: string;
  genre: string;
  view_count: number;
  likes_count: number;
  created_at: string;
}

interface UserScript {
  id: string;
  title: string;
  genre: string;
  view_count: number;
  likes_count: number;
  is_public: boolean;
  status: string;
}

const PremiumScriptManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [premiumScripts, setPremiumScripts] = useState<PremiumScript[]>([]);
  const [userScripts, setUserScripts] = useState<UserScript[]>([]);
  const [userRank, setUserRank] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [newScriptPrice, setNewScriptPrice] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    setLoading(true);
    try {
      await Promise.all([
        fetchPremiumScripts(),
        fetchUserScripts(),
        fetchUserRank()
      ]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPremiumScripts = async () => {
    // Données vides pour l'interface en attente
    setPremiumScripts([]);
  };

  const fetchUserScripts = async () => {
    try {
      const { data, error } = await supabase
        .from('scripts')
        .select('id, title, genre, view_count, likes_count, is_public, status')
        .eq('user_id', user?.id)
        .eq('is_public', true)
        .eq('status', 'published')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      // Filtrer les scripts qui ne sont pas déjà premium
      const nonPremiumScripts = data?.filter(script => 
        !premiumScripts.find(premium => premium.script_id === script.id)
      ) || [];
      
      setUserScripts(nonPremiumScripts);
    } catch (err) {
      console.error('Error fetching user scripts:', err);
    }
  };

  const fetchUserRank = async () => {
    // Rang simulé pour l'interface en attente
    setUserRank(null);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount / 100);
  };

  const handlePromoteToPremium = async (scriptId: string) => {
    const priceInput = newScriptPrice[scriptId];
    if (!priceInput) {
      toast({
        title: "Prix requis",
        description: "Veuillez saisir un prix pour votre œuvre.",
        variant: "destructive"
      });
      return;
    }

    const price = parseFloat(priceInput) * 100; // Conversion en centimes
    if (price < 100000) { // Minimum 1000 XOF
      toast({
        title: "Prix trop bas",
        description: "Le prix minimum est de 1000 XOF.",
        variant: "destructive"
      });
      return;
    }

    toast({
      title: "Fonctionnalité à venir",
      description: "La promotion premium sera bientôt disponible !",
    });
  };

  const handleUpdatePrice = async (premiumScriptId: string, newPrice: number) => {
    toast({
      title: "Fonctionnalité à venir",
      description: "La modification des prix sera bientôt disponible !",
    });
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardContent className="p-6">
              <div className="animate-pulse space-y-4">
                <div className="h-6 bg-slate-200 rounded w-1/3"></div>
                <div className="h-4 bg-slate-200 rounded w-1/2"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statut du créateur */}
      {userRank && userRank <= 10 && (
        <Card className="border-script-primary bg-gradient-to-r from-script-primary/5 to-script-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center">
                <Star className="h-5 w-5 mr-2 text-script-primary" />
                Statut Créateur
              </div>
              <TopCreatorBadge rank={userRank} size="lg" />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-slate-700">
              {userRank <= 3 
                ? "🎉 Félicitations ! Vos œuvres publiques ont été automatiquement promues en premium !"
                : `Vous êtes dans le Top ${userRank} ! Continuez vos efforts pour accéder au Top 3 et bénéficier de la promotion automatique.`
              }
            </p>
          </CardContent>
        </Card>
      )}

      {/* Œuvres Premium Actuelles */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Crown className="h-5 w-5 mr-2 text-script-primary" />
            Mes Œuvres Premium ({premiumScripts.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {premiumScripts.length === 0 ? (
            <div className="text-center py-8">
              <Crown className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 mb-2">Aucune œuvre premium encore</p>
              <p className="text-sm text-slate-500">
                Promouvez vos œuvres ci-dessous ou atteignez le Top 3 pour une promotion automatique !
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {premiumScripts.map((script) => (
                <div
                  key={script.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-white hover:shadow-sm transition-shadow"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="font-medium text-slate-900">
                        {script.title}
                      </h4>
                      {script.is_auto_promoted && (
                        <Badge className="bg-gradient-premium text-white text-xs">
                          Auto-promu Top 3
                        </Badge>
                      )}
                      <Badge variant="outline" className="text-xs">
                        {script.genre}
                      </Badge>
                    </div>
                    
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {script.view_count} vues
                      </span>
                      <span className="flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        {script.likes_count} likes
                      </span>
                      <span className="flex items-center">
                        <TrendingUp className="h-3 w-3 mr-1" />
                        {script.sales_count} ventes
                      </span>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-bold text-script-primary">
                        {formatCurrency(script.price)}
                      </span>
                      <Button variant="ghost" size="sm">
                        <Settings className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-green-600 font-medium">
                      {formatCurrency(script.total_revenue)} générés
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Promouvoir de nouvelles œuvres */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-script-primary" />
            Promouvoir en Premium
          </CardTitle>
        </CardHeader>
        <CardContent>
          {userScripts.length === 0 ? (
            <div className="text-center py-8">
              <DollarSign className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600 mb-2">Aucune œuvre disponible</p>
              <p className="text-sm text-slate-500">
                Publiez des œuvres publiques pour pouvoir les promouvoir en premium
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {userScripts.map((script) => (
                <div
                  key={script.id}
                  className="flex items-center justify-between p-4 rounded-lg border bg-slate-50"
                >
                  <div className="flex-1">
                    <h4 className="font-medium text-slate-900 mb-1">
                      {script.title}
                    </h4>
                    <div className="flex items-center gap-4 text-sm text-slate-600">
                      <Badge variant="outline" className="text-xs">
                        {script.genre}
                      </Badge>
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {script.view_count}
                      </span>
                      <span className="flex items-center">
                        <Star className="h-3 w-3 mr-1" />
                        {script.likes_count}
                      </span>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        placeholder="Prix (XOF)"
                        className="w-32"
                        min="1000"
                        value={newScriptPrice[script.id] || ''}
                        onChange={(e) => setNewScriptPrice(prev => ({
                          ...prev,
                          [script.id]: e.target.value
                        }))}
                      />
                      <Button
                        onClick={() => handlePromoteToPremium(script.id)}
                        className="bg-script-primary hover:bg-script-primary/90"
                        disabled={!newScriptPrice[script.id]}
                      >
                        Promouvoir
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PremiumScriptManager;