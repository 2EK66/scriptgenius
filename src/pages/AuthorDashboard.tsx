import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, BookOpen, Crown, TrendingUp, AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Header from "@/components/Header";
import AuthModal from "@/components/AuthModal";
import AuthorEarnings from "@/components/AuthorEarnings";
import PremiumScriptManager from "@/components/PremiumScriptManager";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { isSupabaseReady } from "@/integrations/supabase/client";

const AuthorDashboard = () => {
  const { user, loading } = useAuth();

  // Debug: afficher l'état d'authentification
  console.log('AuthorDashboard - user:', user, 'loading:', loading, 'isSupabaseReady:', isSupabaseReady());

  // Afficher un loader pendant le chargement de l'authentification
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Chargement...</p>
        </div>
      </div>
    );
  }

  // Vérifier si Supabase est configuré
  if (!isSupabaseReady()) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
        <Header />
        <main className="container mx-auto px-4 pt-24 pb-12">
          <div className="max-w-6xl mx-auto">
            <Alert className="mb-6">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                Supabase n'est pas encore configuré. Vous devez être connecté pour accéder à l'espace auteur.
              </AlertDescription>
            </Alert>
            <div className="text-center">
              <h1 className="text-3xl font-bold gradient-text mb-4">Espace Auteur</h1>
              <p className="text-slate-600 mb-6">Connectez-vous pour gérer vos œuvres et suivre vos gains</p>
              <AuthModal>
                <button className="btn-primary">Se connecter</button>
              </AuthModal>
            </div>
          </div>
        </main>
      </div>
    );
  }

  // Rediriger seulement après que le chargement soit terminé
  if (!user) {
    return <Navigate to="/" replace />;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-white">
      <Header />
      
      <main className="container mx-auto px-4 pt-24 pb-12">
        <div className="max-w-6xl mx-auto">
          {/* En-tête */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold gradient-text mb-2">
              Espace Auteur
            </h1>
            <p className="text-slate-600">
              Gérez vos œuvres premium et suivez vos gains
            </p>
          </div>

          {/* Onglets principaux */}
          <Tabs defaultValue="earnings" className="space-y-6">
            <TabsList className="grid w-full grid-cols-2 lg:w-[400px]">
              <TabsTrigger value="earnings" className="flex items-center">
                <DollarSign className="h-4 w-4 mr-2" />
                Mes Gains
              </TabsTrigger>
              <TabsTrigger value="premium-works" className="flex items-center">
                <Crown className="h-4 w-4 mr-2" />
                Œuvres Premium
              </TabsTrigger>
            </TabsList>

            {/* Onglet Gains */}
            <TabsContent value="earnings" className="space-y-6">
              <AuthorEarnings />
            </TabsContent>

            {/* Onglet Œuvres Premium */}
            <TabsContent value="premium-works" className="space-y-6">
              <PremiumScriptManager />
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default AuthorDashboard;