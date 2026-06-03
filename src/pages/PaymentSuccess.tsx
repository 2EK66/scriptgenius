
import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, Crown, ArrowRight, RefreshCw } from "lucide-react";
import { checkPaymentStatus } from "@/services/cinetpayService";
import { useAuth } from "@/contexts/AuthContext";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [paymentStatus, setPaymentStatus] = useState<'loading' | 'success' | 'pending' | 'failed'>('loading');
  const [transactionId, setTransactionId] = useState<string>('');

  useEffect(() => {
    const checkStatus = async () => {
      const transId = searchParams.get('transaction_id');
      if (!transId) {
        setPaymentStatus('failed');
        return;
      }

      setTransactionId(transId);

      try {
        const status = await checkPaymentStatus(transId);
        if (status.status === 'completed') {
          setPaymentStatus('success');
        } else if (status.status === 'pending') {
          setPaymentStatus('pending');
          // Vérifier à nouveau dans 5 secondes
          setTimeout(checkStatus, 5000);
        } else {
          setPaymentStatus('failed');
        }
      } catch (error) {
        console.error('Error checking payment status:', error);
        setPaymentStatus('failed');
      }
    };

    checkStatus();
  }, [searchParams]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {paymentStatus === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-500" />
              </div>
              <CardTitle className="text-2xl text-green-700">Paiement réussi !</CardTitle>
            </>
          )}
          
          {paymentStatus === 'pending' && (
            <>
              <div className="mx-auto w-16 h-16 bg-orange-100 rounded-full flex items-center justify-center mb-4">
                <RefreshCw className="h-10 w-10 text-orange-500 animate-spin" />
              </div>
              <CardTitle className="text-2xl text-orange-700">Vérification en cours...</CardTitle>
            </>
          )}
          
          {paymentStatus === 'loading' && (
            <>
              <div className="mx-auto w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <RefreshCw className="h-10 w-10 text-slate-500 animate-spin" />
              </div>
              <CardTitle className="text-2xl text-slate-700">Chargement...</CardTitle>
            </>
          )}
          
          {paymentStatus === 'failed' && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
                <Crown className="h-10 w-10 text-red-500" />
              </div>
              <CardTitle className="text-2xl text-red-700">Erreur de paiement</CardTitle>
            </>
          )}
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {paymentStatus === 'success' && (
            <>
              <Badge className="bg-gradient-premium text-white px-4 py-2">
                <Crown className="h-4 w-4 mr-2" />
                Bienvenue dans Premium+ !
              </Badge>
              <p className="text-slate-600">
                Félicitations {user?.user_metadata?.full_name || 'Utilisateur'} ! 
                Votre abonnement Premium+ est maintenant actif.
              </p>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Transaction ID: {transactionId}</p>
              </div>
              <div className="space-y-2">
                <Button asChild className="w-full bg-gradient-premium">
                  <Link to="/">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Commencer à créer des scénarios
                  </Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/scripts">Voir ma bibliothèque</Link>
                </Button>
              </div>
            </>
          )}
          
          {paymentStatus === 'pending' && (
            <>
              <p className="text-slate-600">
                Nous vérifions votre paiement. Cette opération peut prendre quelques minutes.
              </p>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-500">Transaction ID: {transactionId}</p>
              </div>
            </>
          )}
          
          {paymentStatus === 'failed' && (
            <>
              <p className="text-slate-600">
                Une erreur est survenue lors du traitement de votre paiement.
              </p>
              <div className="space-y-2">
                <Button asChild className="w-full">
                  <Link to="/#pricing">Réessayer</Link>
                </Button>
                <Button asChild variant="outline" className="w-full">
                  <Link to="/">Retour à l'accueil</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;
