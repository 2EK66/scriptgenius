
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface CreatorPoints {
  user_id: string;
  full_name: string;
  avatar_url?: string;
  total_points: number;
  complete_reads: number;
  comments_received: number;
  likes_received: number;
  scripts_published: number;
  rank: number;
  last_calculated_at: string;
}

export interface UserBadge {
  id: string;
  badge_type: string;
  badge_title: string;
  badge_description?: string;
  earned_at: string;
  month_year?: string;
}

export const useRewards = () => {
  const { user } = useAuth();
  const [leaderboard, setLeaderboard] = useState<CreatorPoints[]>([]);
  const [userBadges, setUserBadges] = useState<UserBadge[]>([]);
  const [userPoints, setUserPoints] = useState<CreatorPoints | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Récupérer le leaderboard
  const fetchLeaderboard = async (limit: number = 10) => {
    // Données vides pour l'interface en attente
    setLeaderboard([]);
  };

  // Récupérer les badges de l'utilisateur
  const fetchUserBadges = async () => {
    if (!user) return;
    // Données vides pour l'interface en attente
    setUserBadges([]);
  };

  // Récupérer les points de l'utilisateur
  const fetchUserPoints = async () => {
    if (!user) return;
    // Données vides pour l'interface en attente
    setUserPoints(null);
  };

  // Mettre à jour les points d'un créateur
  const updateCreatorPoints = async (userId: string) => {
    // Fonctionnalité en attente
    console.log('Updating creator points for:', userId);
  };

  // Attribuer les badges mensuels (fonction admin)
  const awardMonthlyBadges = async () => {
    // Fonctionnalité en attente
    console.log('Awarding monthly badges');
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        await Promise.all([
          fetchLeaderboard(),
          fetchUserBadges(),
          fetchUserPoints()
        ]);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user]);

  return {
    leaderboard,
    userBadges,
    userPoints,
    loading,
    error,
    fetchLeaderboard,
    updateCreatorPoints,
    awardMonthlyBadges,
  };
};
