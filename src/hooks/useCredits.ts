
import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface CreditPackage {
  id: string;
  name: string;
  credits: number;
  price_cents: number;
  currency: string;
  description: string;
}

export const useCredits = () => {
  const { user } = useAuth();
  const [credits, setCredits] = useState<number>(0);
  const [packages, setPackages] = useState<CreditPackage[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCredits = async () => {
    if (!user) return;
    // Fonctionnalité en attente - pas de crédits pour le moment
    setCredits(0);
  };

  const fetchPackages = async () => {
    // Packages simulés pour l'interface en attente
    setPackages([]);
    setLoading(false);
  };

  useEffect(() => {
    fetchCredits();
    fetchPackages();
  }, [user]);

  const refreshCredits = () => {
    fetchCredits();
  };

  return {
    credits,
    packages,
    loading,
    refreshCredits
  };
};
