
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Trophy, Crown, Medal, Star, Award } from "lucide-react";
import { useRewards } from "@/hooks/useRewards";

const UserBadges = () => {
  const { userBadges, loading } = useRewards();

  const getBadgeIcon = (badgeType: string) => {
    switch (badgeType) {
      case 'monthly_winner':
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 'top_creator':
        return <Trophy className="h-5 w-5 text-script-primary" />;
      case 'rising_star':
        return <Star className="h-5 w-5 text-purple-500" />;
      default:
        return <Award className="h-5 w-5 text-slate-500" />;
    }
  };

  const getBadgeColor = (badgeType: string) => {
    switch (badgeType) {
      case 'monthly_winner':
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
      case 'top_creator':
        return 'bg-gradient-to-r from-script-primary to-script-secondary text-white';
      case 'rising_star':
        return 'bg-gradient-to-r from-purple-400 to-purple-600 text-white';
      default:
        return 'bg-slate-100 text-slate-700';
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Award className="h-5 w-5 mr-2 text-script-primary" />
            Mes Badges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-slate-200 rounded-lg"></div>
            ))}
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
            <Award className="h-5 w-5 mr-2 text-script-primary" />
            Mes Badges
          </div>
          <Badge variant="outline">{userBadges.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {userBadges.length === 0 ? (
          <div className="text-center py-8">
            <Award className="h-12 w-12 mx-auto mb-4 text-slate-300" />
            <p className="text-slate-600 mb-2">Aucun badge encore</p>
            <p className="text-sm text-slate-500">
              Publiez des œuvres et gagnez des points pour obtenir vos premiers badges !
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {userBadges.map((badge) => (
              <div
                key={badge.id}
                className="flex items-center space-x-4 p-3 rounded-lg border bg-white hover:shadow-sm transition-shadow"
              >
                <div className="flex-shrink-0">
                  {getBadgeIcon(badge.badge_type)}
                </div>
                
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-1">
                    <h4 className="font-medium text-slate-900">
                      {badge.badge_title}
                    </h4>
                    <Badge className={getBadgeColor(badge.badge_type)}>
                      {badge.badge_type === 'monthly_winner' && 'Gagnant'}
                      {badge.badge_type === 'top_creator' && 'Top Créateur'}
                      {badge.badge_type === 'rising_star' && 'Étoile Montante'}
                    </Badge>
                  </div>
                  
                  {badge.badge_description && (
                    <p className="text-sm text-slate-600">
                      {badge.badge_description}
                    </p>
                  )}
                  
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-slate-500">
                      Obtenu le {new Date(badge.earned_at).toLocaleDateString('fr-FR')}
                    </span>
                    {badge.month_year && (
                      <Badge variant="outline" className="text-xs">
                        {badge.month_year}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default UserBadges;
