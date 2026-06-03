
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { ArrowLeft, AlertCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ComicCreator } from "@/components/ComicCreator";
import AuthModal from "@/components/AuthModal";

const ComicGenerator = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <Link to="/" className="inline-flex items-center text-script-primary hover:underline mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour à l'accueil
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold gradient-text mb-4">
            Générateur de Bandes Dessinées
          </h1>
          <p className="text-slate-600 text-lg">
            Transformez vos scénarios en magnifiques bandes dessinées avec l'IA
          </p>
        </div>

        {!user && (
          <Alert className="mb-6 border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              <div className="flex items-center justify-between">
                <span>
                  Connectez-vous pour sauvegarder vos BDs et accéder à tous vos scénarios.
                </span>
                <AuthModal>
                  <Button size="sm" variant="outline" className="ml-4 border-amber-300 text-amber-700 hover:bg-amber-100">
                    Se connecter
                  </Button>
                </AuthModal>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <ComicCreator />
      </div>
    </div>
  );
};

export default ComicGenerator;
