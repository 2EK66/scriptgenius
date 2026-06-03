
import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { DollarSign, Users, TrendingUp, Star, Crown, Clock, Info } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/components/ui/use-toast";

interface FinancialReward {
  id: string;
  user_id: string;
  month_year: string;
  rank: number;
  reward_amount: number;
  premium_subscribers_count: number;
  status: 'pending' | 'paid' | 'cancelled';
  created_at: string;
}

interface RewardCalculation {
  base_amount: number;
  subscriber_bonus: number;
  total_amount: number;
  premium_subscribers: number;
}

const FinancialRewards = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rewards, setRewards] = useState<FinancialReward[]>([]);
  const [rewardCalculation, setRewardCalculation] = useState<RewardCalculation | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchUserRewards();
      calculatePotentialReward();
    }
  }, [user]);

  const fetchUserRewards = async () => {
    // Données vides pour l'interface en attente
    setRewards([]);
  };

  const calculatePotentialReward = async () => {
    // Données simulées pour l'interface en attente
    setRewardCalculation({
      base_amount: 50000,
      subscriber_bonus: 25000,
      total_amount: 75000,
      premium_subscribers: 10
    });
    setLoading(false);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <DollarSign className="h-5 w-5 mr-2 text-green-600" />
            Récompenses Financières
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-20 bg-slate-200 rounded-lg"></div>
            <div className="h-16 bg-slate-200 rounded-lg"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Notification - Fonctionnalité à venir */}
      <Card className="border-amber-200 bg-amber-50">
        <CardHeader>
          <CardTitle className="flex items-center text-amber-800">
            <Clock className="h-5 w-5 mr-2" />
            Récompenses Financières - Bientôt Disponibles
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-start space-x-3">
            <Info className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
            <div className="space-y-2 text-amber-700">
              <p className="font-medium">
                Les récompenses financières sont actuellement en développement.
              </p>
              <p className="text-sm">
                Cette fonctionnalité sera bientôt disponible pour récompenser les meilleurs créateurs premium de notre communauté. 
                Continuez à créer du contenu original et à gravir le classement !
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Calcul des récompenses potentielles */}
      {rewardCalculation && (
        <Card className="border-green-200 bg-green-50 opacity-75">
          <CardHeader>
            <CardTitle className="flex items-center text-green-800">
              <TrendingUp className="h-5 w-5 mr-2" />
              Aperçu des Futures Récompenses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(rewardCalculation.base_amount)}
                </div>
                <div className="text-sm text-green-700">Montant de base (Top 3)</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">
                  {formatCurrency(rewardCalculation.subscriber_bonus)}
                </div>
                <div className="text-sm text-green-700">
                  Bonus ({rewardCalculation.premium_subscribers} abonnés premium)
                </div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-800">
                  {formatCurrency(rewardCalculation.total_amount)}
                </div>
                <div className="text-sm text-green-700">Total potentiel</div>
              </div>
            </div>
            
            <div className="mt-4 p-3 bg-white rounded-lg border border-green-200">
              <h5 className="font-medium text-green-800 mb-2">Conditions d'éligibilité futures :</h5>
              <ul className="text-sm text-green-700 space-y-1">
                <li>✓ Être abonné Premium</li>
                <li>✓ Avoir au moins 1 création publique</li>
                <li>✓ Être dans le Top 3 du mois</li>
                <li>✓ Œuvres 100% originales (anti-plagiat)</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Historique des récompenses */}
      <Card className="opacity-75">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <DollarSign className="h-5 w-5 mr-2 text-green-600" />
              Historique des Gains (Prochainement)
            </div>
            <Badge variant="outline">{rewards.length}</Badge>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <Clock className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600 mb-2">Fonctionnalité en cours de développement</p>
            <p className="text-sm text-slate-500">
              Les récompenses financières seront bientôt disponibles pour les créateurs premium du top 3 !
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default FinancialRewards;
