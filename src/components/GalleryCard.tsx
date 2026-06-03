
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Heart, Eye, BookOpen, Calendar, User } from "lucide-react";
import { PublicScript } from "@/types/database";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/components/ui/use-toast";
import SocialShareButtons from "@/components/SocialShareButtons";
import TopCreatorBadge from "@/components/TopCreatorBadge";

interface GalleryCardProps {
  script: PublicScript;
  onViewScript: (scriptId: string) => void;
  onToggleLike: (scriptId: string) => Promise<boolean>;
  authorRank?: number;
}

const GalleryCard = ({ script, onViewScript, onToggleLike, authorRank }: GalleryCardProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isLiking, setIsLiking] = useState(false);

  const handleLike = async () => {
    if (!user) {
      toast({
        title: "Connexion requise",
        description: "Vous devez être connecté pour aimer une œuvre.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLiking(true);
      const liked = await onToggleLike(script.id);
      toast({
        title: liked ? "Œuvre aimée !" : "Like retiré",
        description: liked ? "Vous avez aimé cette œuvre." : "Vous avez retiré votre like.",
      });
    } catch (error) {
      toast({
        title: "Erreur",
        description: "Impossible de traiter votre like.",
        variant: "destructive",
      });
    } finally {
      setIsLiking(false);
    }
  };

  const handleViewScript = () => {
    onViewScript(script.id);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const getAuthorInitials = (name: string) => {
    return name
      ?.split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2) || 'AU';
  };

  const isTopCreator = authorRank && authorRank <= 3;

  return (
    <Card className={`group hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 ${
      isTopCreator ? 'ring-2 ring-yellow-400 bg-gradient-to-br from-yellow-50 to-amber-50' : ''
    }`}>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg line-clamp-2 flex-1 mr-2">
            {script.title}
          </CardTitle>
          {authorRank && authorRank <= 3 && (
            <TopCreatorBadge rank={authorRank} size="sm" />
          )}
        </div>
        
        {/* Auteur avec badge spécial pour top 3 */}
        <div className="flex items-center space-x-2 mt-2">
          <Avatar className={`h-6 w-6 ${isTopCreator ? 'ring-2 ring-yellow-400' : ''}`}>
            <AvatarImage src={script.author_avatar} />
            <AvatarFallback className="text-xs">
              {getAuthorInitials(script.author_name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex items-center space-x-2">
            <span className={`text-sm ${isTopCreator ? 'font-semibold text-yellow-800' : 'text-slate-600'}`}>
              {script.author_name || 'Auteur anonyme'}
            </span>
            {isTopCreator && (
              <Badge variant="outline" className="text-xs text-yellow-700 border-yellow-400">
                Créateur vedette
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Badges */}
        <div className="flex flex-wrap gap-2">
          <Badge variant="outline" className="text-xs">
            <BookOpen className="h-3 w-3 mr-1" />
            {script.genre}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {script.age_range}
          </Badge>
          <Badge variant="outline" className="text-xs">
            {script.theme}
          </Badge>
        </div>

        {/* Extrait du contenu */}
        <p className="text-sm text-slate-600 line-clamp-3">
          {script.content.substring(0, 150)}...
        </p>

        {/* Statistiques */}
        <div className="flex items-center justify-between text-sm text-slate-500">
          <div className="flex items-center space-x-4">
            <div className="flex items-center">
              <Eye className="h-4 w-4 mr-1" />
              {script.view_count}
            </div>
            <div className="flex items-center">
              <Heart className="h-4 w-4 mr-1" />
              {script.likes_count}
            </div>
          </div>
          <div className="flex items-center">
            <Calendar className="h-4 w-4 mr-1" />
            {formatDate(script.created_at)}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2">
            <Dialog>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm" onClick={handleViewScript}>
                  <Eye className="h-4 w-4 mr-2" />
                  Lire
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle className="flex items-center space-x-2">
                    <span>{script.title}</span>
                    <div className="flex items-center space-x-2 text-sm text-slate-600">
                      <User className="h-4 w-4" />
                      <span>{script.author_name}</span>
                      {authorRank && authorRank <= 3 && (
                        <TopCreatorBadge rank={authorRank} size="sm" />
                      )}
                    </div>
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="outline">{script.genre}</Badge>
                    <Badge variant="outline">{script.age_range}</Badge>
                    <Badge variant="outline">{script.theme}</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-sm text-slate-500">
                      <div className="flex items-center">
                        <Eye className="h-4 w-4 mr-1" />
                        {script.view_count} vues
                      </div>
                      <div className="flex items-center">
                        <Heart className="h-4 w-4 mr-1" />
                        {script.likes_count} likes
                      </div>
                    </div>
                    <SocialShareButtons script={script} />
                  </div>
                  <pre className="whitespace-pre-wrap text-sm bg-slate-50 p-4 rounded-lg border font-mono leading-relaxed">
                    {script.content}
                  </pre>
                </div>
              </DialogContent>
            </Dialog>

            <SocialShareButtons script={script} />
          </div>

          <Button
            variant="ghost"
            size="sm"
            onClick={handleLike}
            disabled={isLiking}
            className="text-red-500 hover:text-red-600 hover:bg-red-50"
          >
            <Heart className={`h-4 w-4 mr-1 ${script.likes_count > 0 ? 'fill-current' : ''}`} />
            {script.likes_count}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default GalleryCard;
