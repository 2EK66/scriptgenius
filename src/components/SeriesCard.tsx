import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Eye, Heart, Users, Play, BookOpen } from "lucide-react";
import { Series } from "@/types/database";

interface SeriesCardProps {
  series: Series & {
    creator_name?: string;
    latest_episode?: {
      episode_number: number;
      title: string;
      published_at: string;
    };
  };
}

const SeriesCard = ({ series }: SeriesCardProps) => {
  const handleViewSeries = () => {
    // Navigate to series view
    window.location.href = `/series/${series.id}`;
  };

  const handleFollowSeries = () => {
    // Toggle follow status
    console.log("Toggle follow for series:", series.id);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 border-0 bg-white/80 backdrop-blur-sm overflow-hidden">
      <div className="aspect-video bg-gradient-to-br from-script-primary/20 to-script-secondary/20 relative overflow-hidden">
        <div className="absolute inset-0 flex items-center justify-center">
          <BookOpen className="h-12 w-12 text-script-primary/60" />
        </div>
        <div className="absolute top-2 left-2">
          <Badge className="bg-script-primary text-white">
            Série • {series.episode_count} épisode{series.episode_count > 1 ? 's' : ''}
          </Badge>
        </div>
        <div className="absolute top-2 right-2">
          <Badge variant={series.status === 'ongoing' ? 'default' : 'secondary'}>
            {series.status === 'ongoing' ? 'En cours' : 
             series.status === 'completed' ? 'Terminée' : 'Brouillon'}
          </Badge>
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
          <Button 
            onClick={handleViewSeries}
            className="bg-white/20 backdrop-blur-sm text-white border-white/30 hover:bg-white/30"
            variant="outline"
          >
            <Play className="h-4 w-4 mr-2" />
            Voir la série
          </Button>
        </div>
      </div>
      
      <CardContent className="p-4">
        <div className="space-y-3">
          <div>
            <h3 className="font-semibold text-lg line-clamp-1 group-hover:text-script-primary transition-colors">
              {series.title}
            </h3>
            {series.description && (
              <p className="text-sm text-slate-600 line-clamp-2 mt-1">
                {series.description}
              </p>
            )}
          </div>

          {series.latest_episode && (
            <div className="bg-slate-50 rounded-lg p-3">
              <div className="text-xs text-slate-500 mb-1">Dernier épisode</div>
              <div className="font-medium text-sm">
                Épisode {series.latest_episode.episode_number}: {series.latest_episode.title}
              </div>
              <div className="text-xs text-slate-500 mt-1">
                {new Date(series.latest_episode.published_at).toLocaleDateString()}
              </div>
            </div>
          )}

          <div className="flex flex-wrap gap-1">
            {series.genre && (
              <Badge variant="secondary" className="text-xs">
                {series.genre}
              </Badge>
            )}
            {series.art_style && (
              <Badge variant="outline" className="text-xs">
                {series.art_style}
              </Badge>
            )}
          </div>

          <div className="flex items-center justify-between text-sm text-slate-500">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {series.view_count}
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {series.like_count}
              </span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3" />
                {series.follow_count}
              </span>
            </div>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleFollowSeries}
              className="text-xs"
            >
              + Suivre
            </Button>
          </div>

          {series.creator_name && (
            <div className="pt-2 border-t">
              <span className="text-xs text-slate-500">
                Par {series.creator_name}
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default SeriesCard;