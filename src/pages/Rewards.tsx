
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CreatorLeaderboard from "@/components/CreatorLeaderboard";
import UserBadges from "@/components/UserBadges";
import OriginalityChecker from "@/components/OriginalityChecker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Crown, Star, Gift, Shield, BookOpen, TrendingUp, DollarSign, Download, Eye } from "lucide-react";

const Rewards = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-purple-50">
      <Header />
      
      <main className="pt-24 pb-16">
        <div className="container mx-auto px-4">
          {/* Hero Section */}
          <div className="text-center mb-12">
            <div className="flex justify-center mb-4">
              <div className="p-4 bg-gradient-to-r from-yellow-400 to-orange-500 rounded-full">
                <Trophy className="h-12 w-12 text-white" />
              </div>
            </div>
            <h1 className="text-4xl md:text-5xl font-bold gradient-text mb-4">
              Système de Récompenses
            </h1>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Gagnez des points, débloquez des badges et monétisez vos œuvres !
            </p>
          </div>

          {/* Nouvelles conditions d'éligibilité */}
          <Card className="mb-8 border-blue-200 bg-blue-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-blue-800">
                <Shield className="h-6 w-6 mr-2" />
                Conditions d'Éligibilité pour les Récompenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-800">Conditions Obligatoires :</h4>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-center">
                      <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                      Être abonné Premium actif
                    </li>
                    <li className="flex items-center">
                      <BookOpen className="h-4 w-4 mr-2 text-green-500" />
                      Avoir au moins 1 création publique
                    </li>
                    <li className="flex items-center">
                      <Shield className="h-4 w-4 mr-2 text-blue-500" />
                      Toutes les œuvres 100% originales
                    </li>
                    <li className="flex items-center">
                      <TrendingUp className="h-4 w-4 mr-2 text-purple-500" />
                      Être dans le Top 10 du mois
                    </li>
                  </ul>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-blue-800">Nouveau Système de Monétisation (Top 3) :</h4>
                  <ul className="space-y-2 text-sm text-blue-700">
                    <li className="flex items-center">
                      <Crown className="h-4 w-4 mr-2 text-yellow-500" />
                      Œuvres passent en Premium le mois suivant
                    </li>
                    <li className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-2 text-green-500" />
                      75% des revenus par lecture/téléchargement
                    </li>
                    <li className="flex items-center">
                      <Eye className="h-4 w-4 mr-2 text-blue-500" />
                      Lecture complète payante pour les autres
                    </li>
                    <li className="flex items-center">
                      <Download className="h-4 w-4 mr-2 text-purple-500" />
                      Téléchargement payant pour les autres
                    </li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Système de monétisation */}
          <Card className="mb-8 border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center justify-center text-green-800">
                <DollarSign className="h-6 w-6 mr-2" />
                Système de Monétisation pour le Top 3
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h4 className="font-semibold text-green-800">Comment ça marche :</h4>
                  <div className="space-y-3 text-sm text-green-700">
                    <div className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                      <div className="bg-green-100 p-2 rounded-full">
                        <Trophy className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">1. Atteignez le Top 3</div>
                        <div className="text-xs">Soyez dans les 3 premiers créateurs du mois</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                      <div className="bg-green-100 p-2 rounded-full">
                        <Crown className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">2. Vos œuvres deviennent Premium</div>
                        <div className="text-xs">Le mois suivant, toutes vos œuvres passent en mode Premium</div>
                      </div>
                    </div>
                    <div className="flex items-start space-x-3 p-3 bg-white rounded-lg">
                      <div className="bg-green-100 p-2 rounded-full">
                        <DollarSign className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <div className="font-medium">3. Gagnez sur chaque interaction</div>
                        <div className="text-xs">75% des revenus de chaque lecture/téléchargement</div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-4">
                  <h4 className="font-semibold text-green-800">Tarification :</h4>
                  <div className="space-y-2 text-sm text-green-700">
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-2" />
                        <span>Lecture complète</span>
                      </div>
                      <span className="font-semibold">500 XOF</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-white rounded-lg">
                      <div className="flex items-center">
                        <Download className="h-4 w-4 mr-2" />
                        <span>Téléchargement PDF</span>
                      </div>
                      <span className="font-semibold">1000 XOF</span>
                    </div>
                    <div className="mt-3 p-3 bg-green-100 rounded-lg">
                      <div className="text-xs text-green-600">
                        <strong>Votre part :</strong> 75% des revenus<br />
                        <strong>Plateforme :</strong> 25% des revenus
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Points System Explanation */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Star className="h-6 w-6 mr-2 text-script-primary" />
                Comment gagner des points
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-3xl font-bold text-blue-600 mb-2">+10</div>
                  <div className="font-medium">Lecture complète</div>
                  <div className="text-sm text-slate-600">Quand quelqu'un lit votre œuvre en entier</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-3xl font-bold text-green-600 mb-2">+15</div>
                  <div className="font-medium">Commentaire reçu</div>
                  <div className="text-sm text-slate-600">Chaque commentaire sur vos œuvres</div>
                </div>
                <div className="text-center p-4 bg-red-50 rounded-lg">
                  <div className="text-3xl font-bold text-red-600 mb-2">+5</div>
                  <div className="font-medium">Like reçu</div>
                  <div className="text-sm text-slate-600">Chaque like sur vos œuvres</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly Rewards */}
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="flex items-center justify-center">
                <Gift className="h-6 w-6 mr-2 text-script-primary" />
                Récompenses Mensuelles
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center p-6 bg-gradient-to-r from-yellow-400 to-yellow-600 text-white rounded-lg">
                  <Crown className="h-12 w-12 mx-auto mb-4" />
                  <div className="text-2xl font-bold mb-2">1ère Place</div>
                  <div className="mb-2">Badge "Créateur du Mois"</div>
                  <div className="text-sm opacity-90">+ Œuvres Premium + visibilité maximale</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-r from-gray-300 to-gray-500 text-white rounded-lg">
                  <Trophy className="h-12 w-12 mx-auto mb-4" />
                  <div className="text-2xl font-bold mb-2">Top 3</div>
                  <div className="mb-2">Badge "Top 3 Créateur"</div>
                  <div className="text-sm opacity-90">+ Œuvres Premium + visibilité élevée</div>
                </div>
                <div className="text-center p-6 bg-gradient-to-r from-purple-400 to-purple-600 text-white rounded-lg">
                  <Star className="h-12 w-12 mx-auto mb-4" />
                  <div className="text-2xl font-bold mb-2">Top 10</div>
                  <div className="mb-2">Badge "Top 10 Créateur"</div>
                  <div className="text-sm opacity-90">Badge de reconnaissance</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Main Content - Updated layout */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Leaderboard */}
            <div className="lg:col-span-2 space-y-8">
              <CreatorLeaderboard />
            </div>
            
            {/* Sidebar */}
            <div className="space-y-8">
              <UserBadges />
              <OriginalityChecker 
                content="Testez l'originalité de vos œuvres ici..."
                onResult={(isOriginal) => {
                  console.log('Originalité:', isOriginal);
                }}
              />
            </div>
          </div>
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default Rewards;
