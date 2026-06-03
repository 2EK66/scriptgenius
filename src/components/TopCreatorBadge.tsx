
import { Crown, Star, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface TopCreatorBadgeProps {
  rank: number;
  size?: 'sm' | 'md' | 'lg';
}

const TopCreatorBadge = ({ rank, size = 'md' }: TopCreatorBadgeProps) => {
  if (rank > 3) return null;

  const getIcon = () => {
    if (rank === 1) return <Crown className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />;
    if (rank === 2) return <Trophy className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />;
    return <Star className={`${size === 'sm' ? 'h-3 w-3' : size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'}`} />;
  };

  const getColor = () => {
    if (rank === 1) return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    if (rank === 2) return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
  };

  const getText = () => {
    if (rank === 1) return 'Top 1';
    if (rank === 2) return 'Top 2';
    return 'Top 3';
  };

  return (
    <Badge className={`${getColor()} font-semibold ${size === 'sm' ? 'text-xs px-2 py-0.5' : size === 'lg' ? 'text-sm px-3 py-1' : 'text-xs px-2 py-1'}`}>
      {getIcon()}
      <span className="ml-1">{getText()}</span>
    </Badge>
  );
};

export default TopCreatorBadge;
