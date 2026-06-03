
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Trophy, Crown, Medal, Star, TrendingUp, Eye, Heart } from "lucide-react";
import { useRewards } from "@/hooks/useRewards";

const CreatorLeaderboard = () => {
  const { leaderboard, loading, error } = useRewards();

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Medal className="h-5 w-5 text-amber-600" />;
      default:
        return <Star className="h-4 w-4 text-slate-400" />;
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank <= 3) {
      return (
        <Badge className={`
          ${rank === 1 ? 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white' : ''}
          ${rank === 2 ? 'bg-gradient-to-r from-gray-300 to-gray-500 text-white' : ''}
          ${rank === 3 ? 'bg-gradient-to-r from-amber-400 to-amber-600 text-white' : ''}
        `}>
          #{rank}
        </Badge>
      );
    }
    return <Badge variant="outline">#{rank}</Badge>;
  };

  const getAuthorInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AU';
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-script-primary" />
            Classement des Créateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-script-primary border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-slate-600">Chargement du classement...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-script-primary" />
            Classement des Créateurs
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600">Erreur: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Trophy className="h-5 w-5 mr-2 text-script-primary" />
            Top 10 des Créateurs
          </div>
          <Badge variant="outline" className="text-xs">
            <TrendingUp className="h-3 w-3 mr-1" />
            Ce mois
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {leaderboard.length === 0 ? (
            <div className="text-center py-8">
              <Trophy className="h-12 w-12 mx-auto mb-4 text-slate-300" />
              <p className="text-slate-600">Aucun créateur classé pour le moment</p>
            </div>
          ) : (
            leaderboard.map((creator) => (
              <div
                key={creator.user_id}
                className={`flex items-center justify-between p-4 rounded-lg border transition-all hover:shadow-md ${
                  creator.rank <= 3 ? 'bg-gradient-to-r from-slate-50 to-white border-script-accent/20' : 'bg-white'
                }`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex items-center">
                    {getRankIcon(creator.rank)}
                    <span className="ml-2">
                      {getRankBadge(creator.rank)}
                    </span>
                  </div>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={creator.avatar_url} />
                    <AvatarFallback>
                      {getAuthorInitials(creator.full_name)}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h4 className="font-medium text-slate-900">
                      {creator.full_name || 'Créateur anonyme'}
                    </h4>
                    <div className="flex items-center space-x-3 text-sm text-slate-500">
                      <span className="flex items-center">
                        <Eye className="h-3 w-3 mr-1" />
                        {creator.complete_reads} lectures
                      </span>
                      <span className="flex items-center">
                        <Heart className="h-3 w-3 mr-1" />
                        {creator.likes_received} likes
                      </span>
                      <span>{creator.scripts_published} œuvres</span>
                    </div>
                  </div>
                </div>
                
                <div className="text-right">
                  <div className="font-bold text-lg text-script-primary">
                    {creator.total_points.toLocaleString()} pts
                  </div>
                  {creator.rank <= 3 && (
                    <Badge variant="outline" className="text-xs mt-1">
                      <Crown className="h-3 w-3 mr-1" />
                      Récompensé
                    </Badge>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
        
        <div className="mt-6 p-4 bg-slate-50 rounded-lg">
          <h5 className="font-medium mb-2 text-sm">Comment gagner des points :</h5>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-xs text-slate-600">
            <div>📖 Lecture complète : +10 pts</div>
            <div>💬 Commentaire reçu : +15 pts</div>
            <div>❤️ Like reçu : +5 pts</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CreatorLeaderboard;
