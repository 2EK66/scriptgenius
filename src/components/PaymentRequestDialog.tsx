import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Smartphone, CreditCard, Building } from "lucide-react";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from "@/hooks/use-toast";

interface PaymentRequestDialogProps {
  isOpen: boolean;
  onClose: () => void;
  availableAmount: number;
  onSuccess: () => void;
}

const PaymentRequestDialog = ({ isOpen, onClose, availableAmount, onSuccess }: PaymentRequestDialogProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('');
  const [paymentDetails, setPaymentDetails] = useState({
    phone: '',
    operator: '',
    bankName: '',
    accountNumber: '',
    accountName: '',
    notes: ''
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'XOF',
      minimumFractionDigits: 0
    }).format(amount / 100);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    // Simuler l'envoi pour l'interface en attente
    setTimeout(() => {
      toast({
        title: "Fonctionnalité à venir",
        description: "Le système de demande de paiement est en cours de développement.",
      });
      setLoading(false);
    }, 1000);
  };

  const handlePaymentDetailsChange = (field: string, value: string) => {
    setPaymentDetails(prev => ({
      ...prev,
      [field]: value
    }));
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <CreditCard className="h-5 w-5 mr-2 text-script-primary" />
            Demander un Paiement
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Montant à recevoir */}
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-center">
              <p className="text-sm text-green-700 mb-1">Montant à recevoir</p>
              <p className="text-2xl font-bold text-green-600">
                {formatCurrency(availableAmount)}
              </p>
            </div>
          </div>

          {/* Méthode de paiement */}
          <div className="space-y-3">
            <Label htmlFor="payment-method">Méthode de Paiement</Label>
            <Select value={paymentMethod} onValueChange={setPaymentMethod} required>
              <SelectTrigger>
                <SelectValue placeholder="Choisissez votre méthode de paiement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="mobile_money">
                  <div className="flex items-center">
                    <Smartphone className="h-4 w-4 mr-2" />
                    Mobile Money
                  </div>
                </SelectItem>
                <SelectItem value="bank_transfer">
                  <div className="flex items-center">
                    <Building className="h-4 w-4 mr-2" />
                    Virement Bancaire
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Détails Mobile Money */}
          {paymentMethod === 'mobile_money' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="operator">Opérateur</Label>
                <Select 
                  value={paymentDetails.operator} 
                  onValueChange={(value) => handlePaymentDetailsChange('operator', value)}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Choisissez votre opérateur" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="orange">Orange Money</SelectItem>
                    <SelectItem value="mtn">MTN Mobile Money</SelectItem>
                    <SelectItem value="moov">Moov Money</SelectItem>
                    <SelectItem value="wave">Wave</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="phone">Numéro de Téléphone</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={paymentDetails.phone}
                  onChange={(e) => handlePaymentDetailsChange('phone', e.target.value)}
                  placeholder="Ex: +225 01 02 03 04 05"
                  required
                />
              </div>
            </div>
          )}

          {/* Détails Virement Bancaire */}
          {paymentMethod === 'bank_transfer' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="bank-name">Nom de la Banque</Label>
                <Input
                  id="bank-name"
                  value={paymentDetails.bankName}
                  onChange={(e) => handlePaymentDetailsChange('bankName', e.target.value)}
                  placeholder="Ex: Société Générale"
                  required
                />
              </div>
              <div>
                <Label htmlFor="account-number">Numéro de Compte / RIB</Label>
                <Input
                  id="account-number"
                  value={paymentDetails.accountNumber}
                  onChange={(e) => handlePaymentDetailsChange('accountNumber', e.target.value)}
                  placeholder="Votre numéro de compte"
                  required
                />
              </div>
              <div>
                <Label htmlFor="account-name">Nom du Titulaire</Label>
                <Input
                  id="account-name"
                  value={paymentDetails.accountName}
                  onChange={(e) => handlePaymentDetailsChange('accountName', e.target.value)}
                  placeholder="Nom tel qu'il apparaît sur le compte"
                  required
                />
              </div>
            </div>
          )}

          {/* Notes additionnelles */}
          <div>
            <Label htmlFor="notes">Notes Additionnelles (Optionnel)</Label>
            <Textarea
              id="notes"
              value={paymentDetails.notes}
              onChange={(e) => handlePaymentDetailsChange('notes', e.target.value)}
              placeholder="Informations supplémentaires pour le paiement..."
              rows={3}
            />
          </div>

          {/* Boutons */}
          <div className="flex justify-end space-x-3">
            <Button type="button" variant="outline" onClick={onClose}>
              Annuler
            </Button>
            <Button 
              type="submit" 
              disabled={loading || !paymentMethod}
              className="bg-green-600 hover:bg-green-700"
            >
              {loading ? "Envoi..." : "Demander le Paiement"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default PaymentRequestDialog;