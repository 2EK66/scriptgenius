import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Loader2, TrendingUp, DollarSign, Clock, CheckCircle } from 'lucide-react';

interface AuthorEarnings {
  total_earnings: number;
  pending_earnings: number;
  paid_earnings: number;
  payment_threshold: number;
  last_payment_request: string | null;
}

interface PaymentRequest {
  id: string;
  amount_requested: number;
  status: string;
  payment_method: string;
  created_at: string;
}

export const AuthorEarnings = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [earnings, setEarnings] = useState<AuthorEarnings | null>(null);
  const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRequestingPayment, setIsRequestingPayment] = useState(false);

  useEffect(() => {
    if (user) {
      fetchEarnings();
      fetchPaymentRequests();
    }
  }, [user]);

  const fetchEarnings = async () => {
    // Données simulées pour l'interface en attente
    setEarnings({
      total_earnings: 0,
      pending_earnings: 0,
      paid_earnings: 0,
      payment_threshold: 1000000, // 10000 XOF
      last_payment_request: null
    });
  };

  const fetchPaymentRequests = async () => {
    // Données vides pour l'interface en attente
    setPaymentRequests([]);
    setIsLoading(false);
  };

  const handlePaymentRequest = async () => {
    toast({
      title: "Fonctionnalité à venir",
      description: "Le système de paiement des auteurs est en cours de développement",
      variant: "default",
    });
  };

  const formatCurrency = (amount: number) => {
    return `${(amount / 100).toLocaleString()} XOF`;
  };

  const getStatusBadge = (status: string) => {
    const statusMap = {
      pending: { label: 'En attente', variant: 'secondary' as const },
      processing: { label: 'En traitement', variant: 'default' as const },
      completed: { label: 'Payé', variant: 'default' as const },
      rejected: { label: 'Rejeté', variant: 'destructive' as const }
    };

    const statusInfo = statusMap[status as keyof typeof statusMap] || statusMap.pending;
    return <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Résumé des gains */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Gains totaux</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(earnings?.total_earnings || 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En attente</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(earnings?.pending_earnings || 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Seuil: {formatCurrency(earnings?.payment_threshold || 1000000)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Déjà payés</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {formatCurrency(earnings?.paid_earnings || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Bouton de demande de paiement */}
      <Card>
        <CardHeader>
          <CardTitle>Demander un paiement</CardTitle>
          <CardDescription>
            Vous pouvez demander un paiement quand vous avez au moins {formatCurrency(earnings?.payment_threshold || 1000000)} de gains en attente.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button 
            onClick={handlePaymentRequest}
            disabled={
              isRequestingPayment || 
              !earnings || 
              earnings.pending_earnings < earnings.payment_threshold
            }
            className="flex items-center gap-2"
          >
            {isRequestingPayment ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <DollarSign className="h-4 w-4" />
            )}
            Demander un paiement
          </Button>
        </CardContent>
      </Card>

      {/* Historique des demandes */}
      <Card>
        <CardHeader>
          <CardTitle>Historique des demandes</CardTitle>
        </CardHeader>
        <CardContent>
          {paymentRequests.length === 0 ? (
            <p className="text-muted-foreground">Aucune demande de paiement pour le moment.</p>
          ) : (
            <div className="space-y-3">
              {paymentRequests.map((request) => (
                <div key={request.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div>
                    <p className="font-medium">{formatCurrency(request.amount_requested)}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(request.created_at).toLocaleDateString('fr-FR')}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AuthorEarnings;