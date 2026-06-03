
import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Shield, AlertTriangle, CheckCircle, Eye } from "lucide-react";
import { usePlagiarismDetection } from '@/hooks/usePlagiarismDetection';

interface OriginalityCheckerProps {
  content: string;
  scriptId?: string;
  onResult?: (isOriginal: boolean) => void;
}

const OriginalityChecker = ({ content, scriptId, onResult }: OriginalityCheckerProps) => {
  const { checkPlagiarism, isChecking } = usePlagiarismDetection();
  const [result, setResult] = useState<any>(null);
  const [hasChecked, setHasChecked] = useState(false);

  const handleCheck = async () => {
    try {
      const plagiarismResult = await checkPlagiarism(content, scriptId);
      setResult(plagiarismResult);
      setHasChecked(true);
      onResult?.(plagiarismResult.is_original);
    } catch (error) {
      console.error('Error checking originality:', error);
    }
  };

  const getOriginalityBadge = () => {
    if (!result) return null;
    
    if (result.is_original) {
      return (
        <Badge className="bg-green-100 text-green-800">
          <CheckCircle className="h-3 w-3 mr-1" />
          100% Original
        </Badge>
      );
    }
    
    return (
      <Badge className="bg-red-100 text-red-800">
        <AlertTriangle className="h-3 w-3 mr-1" />
        Similarité: {result.similarity_score}%
      </Badge>
    );
  };

  return (
    <Card className="border-blue-200">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <div className="flex items-center">
            <Shield className="h-5 w-5 mr-2 text-blue-600" />
            Vérification d'Originalité
          </div>
          {result && getOriginalityBadge()}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {!hasChecked && (
            <div className="text-center">
              <p className="text-slate-600 mb-4">
                Vérifiez l'originalité de votre œuvre avant publication
              </p>
              <Button 
                onClick={handleCheck} 
                disabled={isChecking || !content.trim()}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isChecking ? 'Vérification...' : 'Vérifier l\'originalité'}
              </Button>
            </div>
          )}

          {result && (
            <div className="space-y-4">
              {result.is_original ? (
                <Alert className="border-green-200 bg-green-50">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                  <AlertDescription className="text-green-800">
                    <strong>Félicitations !</strong> Votre œuvre est 100% originale.
                    Elle est éligible pour les récompenses du classement.
                  </AlertDescription>
                </Alert>
              ) : (
                <Alert className="border-red-200 bg-red-50">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <AlertDescription className="text-red-800">
                    <strong>Attention !</strong> Des similarités ont été détectées ({result.similarity_score}%).
                    Cette œuvre ne pourra pas participer au classement des récompenses.
                  </AlertDescription>
                </Alert>
              )}

              {result.similar_scripts && result.similar_scripts.length > 0 && (
                <div>
                  <h5 className="font-medium mb-3">Œuvres similaires détectées :</h5>
                  <div className="space-y-2">
                    {result.similar_scripts.map((script: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <div className="font-medium">{script.title}</div>
                          <div className="text-sm text-slate-600">par {script.author_name}</div>
                        </div>
                        <Badge variant="outline">
                          {script.similarity_percentage}% similaire
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="text-center">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setResult(null);
                    setHasChecked(false);
                  }}
                >
                  Vérifier à nouveau
                </Button>
              </div>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default OriginalityChecker;
