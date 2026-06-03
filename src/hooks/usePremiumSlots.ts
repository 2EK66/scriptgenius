import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';

export interface PremiumSlot {
  id: string;
  user_id: string;
  slot_type: 'script' | 'comic';
  price_paid: number;
  purchased_at: string;
  expires_at: string;
  is_active: boolean;
  is_used: boolean;
  used_for_id?: string;
}

export interface SlotPackage {
  type: 'script' | 'comic';
  price: number;
  duration_months: number;
  max_slots: number;
}

const SLOT_PACKAGES: SlotPackage[] = [
  {
    type: 'script',
    price: 500,
    duration_months: 2,
    max_slots: 3
  },
  {
    type: 'comic',
    price: 1000,
    duration_months: 2,
    max_slots: 3
  }
];

export const usePremiumSlots = () => {
  const { user } = useAuth();
  const [slots, setSlots] = useState<PremiumSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [availableScriptSlots, setAvailableScriptSlots] = useState(0);
  const [availableComicSlots, setAvailableComicSlots] = useState(0);

  const fetchSlots = async () => {
    if (!user) {
      setSlots([]);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase
        .from('premium_slots')
        .select('*')
        .eq('user_id', user.id)
        .order('expires_at', { ascending: false });

      if (error) throw error;
      setSlots((data || []) as PremiumSlot[]);

      // Compter les slots disponibles
      const scriptSlots = data?.filter(
        s => s.slot_type === 'script' && s.is_active && !s.is_used && new Date(s.expires_at) > new Date()
      ).length || 0;
      
      const comicSlots = data?.filter(
        s => s.slot_type === 'comic' && s.is_active && !s.is_used && new Date(s.expires_at) > new Date()
      ).length || 0;

      setAvailableScriptSlots(scriptSlots);
      setAvailableComicSlots(comicSlots);
    } catch (error) {
      console.error('Error fetching slots:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSlots();
  }, [user]);

  const canBuySlot = (slotType: 'script' | 'comic') => {
    const currentSlots = slots.filter(
      s => s.slot_type === slotType && s.is_active && new Date(s.expires_at) > new Date()
    ).length;
    
    const maxSlots = SLOT_PACKAGES.find(p => p.type === slotType)?.max_slots || 3;
    return currentSlots < maxSlots;
  };

  const getSlotPrice = (slotType: 'script' | 'comic') => {
    return SLOT_PACKAGES.find(p => p.type === slotType)?.price || 0;
  };

  const purchaseSlot = async (slotType: 'script' | 'comic') => {
    if (!user) throw new Error('User not authenticated');
    if (!canBuySlot(slotType)) throw new Error('Maximum slots reached');

    const packageInfo = SLOT_PACKAGES.find(p => p.type === slotType);
    if (!packageInfo) throw new Error('Invalid slot type');

    const expiresAt = new Date();
    expiresAt.setMonth(expiresAt.getMonth() + packageInfo.duration_months);

    const { data, error } = await supabase
      .from('premium_slots')
      .insert({
        user_id: user.id,
        slot_type: slotType,
        price_paid: packageInfo.price,
        expires_at: expiresAt.toISOString()
      })
      .select()
      .single();

    if (error) throw error;
    await fetchSlots();
    return data;
  };

  const useSlot = async (slotType: 'script' | 'comic', itemId: string) => {
    if (!user) throw new Error('User not authenticated');

    const { data, error } = await supabase.rpc('use_premium_slot', {
      p_user_id: user.id,
      p_slot_type: slotType,
      p_item_id: itemId
    });

    if (error) throw error;
    await fetchSlots();
    return data;
  };

  return {
    slots,
    loading,
    availableScriptSlots,
    availableComicSlots,
    canBuySlot,
    getSlotPrice,
    purchaseSlot,
    useSlot,
    refreshSlots: fetchSlots,
    packages: SLOT_PACKAGES
  };
};
