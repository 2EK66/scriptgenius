import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Shield, 
  Search, 
  Eye, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  Lock,
  FileText,
  Share,
  Download
} from 'lucide-react';
import { useSecureSearch } from '@/hooks/useSecureSearch';
import { useDataProtection } from '@/hooks/useDataProtection';
import SecurityDashboard from '@/components/SecurityDashboard';
import Header from '@/components/Header';

const SecurityDemo = () => {
  const { secureSearch, isBlocked, sanitizeQuery } = useSecureSearch();
  const { 
    maskSensitiveData, 
    canExportData, 
    canShareData, 
    canAccessField 
  } = useDataProtection();

  const [testQuery, setTestQuery] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [testData, setTestData] = useState({
    id: 'script_123',
    title: 'Mon Super Scénario',
    content: 'Contenu du scénario...',
    user_id: 'user_456',
    email: 'user@example.com',
    api_key: 'sk-1234567890abcdef',
    password: 'mySecretPassword',
    author_name: 'John Doe',
    is_public: true,
    allow_social_sharing: true
  });

  // Exemples de requêtes pour tester
  const testQueries = [
    { query: 'aventure', safe: true, description: 'Recherche normale' },
    { query: 'password', safe: false, description: 'Terme sensible bloqué' },
    { query: '<script>alert("hack")</script>', safe: false, description: 'Tentative XSS' },
    { query: 'SELECT * FROM users', safe: false, description: 'Injection SQL' },
    { query: 'histoire fantastique', safe: true, description: 'Recherche valide' },
    { query: 'admin secret', safe: false, description: 'Mots-clés interdits' }
  ];

  const handleTestSearch = () => {
    const mockSearchFunction = (query: string) => [
      { id: 1, title: `Résultat pour "${query}"`, content: 'Contenu exemple' },
      { id: 2, title: 'Autre résultat', content: 'Autre contenu' }
    ];

    const result = secureSearch(testQuery, mockSearchFunction);
    setSearchResult(result);
  };

  const handleTestQuery = (query: string) => {
    setTestQuery(query);
    setSearchResult(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <Header />
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8 text-center">
          <div className="flex justify-center mb-4">
            <Shield className="h-16 w-16 text-blue-600" />
          </div>
          <h1 className="text-4xl font-bold gradient-text mb-4">
            Démonstration Sécurité
          </h1>
          <p className="text-lg text-slate-600 max-w-3xl mx-auto">
            Testez et visualisez nos systèmes de protection des données et de recherche sécurisée.
            Cette page démontre comment nous protégeons vos informations sensibles.
          </p>
        </div>

        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="search">Recherche Sécurisée</TabsTrigger>
            <TabsTrigger value="data">Protection Données</TabsTrigger>
            <TabsTrigger value="permissions">Permissions</TabsTrigger>
            <TabsTrigger value="dashboard">Tableau de Bord</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Search className="h-5 w-5" />
                  <span>Test de Recherche Sécurisée</span>
                </CardTitle>
                <CardDescription>
                  Testez comment notre système bloque les requêtes malveillantes et protège contre 
                  les injections SQL, XSS et autres attaques.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Exemples de requêtes */}
                <div>
                  <h4 className="font-semibold mb-3">Requêtes d'exemple :</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {testQueries.map((item, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        onClick={() => handleTestQuery(item.query)}
                        className={`justify-start text-left ${
                          item.safe ? 'border-green-200 hover:bg-green-50' : 'border-red-200 hover:bg-red-50'
                        }`}
                      >
                        <div className="flex items-center space-x-2 w-full">
                          {item.safe ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="font-mono text-xs truncate">{item.query}</div>
                            <div className="text-xs text-slate-500">{item.description}</div>
                          </div>
                        </div>
                      </Button>
                    ))}
                  </div>
                </div>

                {/* Test de recherche */}
                <div className="space-y-3">
                  <div className="flex gap-2">
                    <Input
                      placeholder="Tapez votre requête de recherche..."
                      value={testQuery}
                      onChange={(e) => setTestQuery(e.target.value)}
                      className="flex-1"
                    />
                    <Button onClick={handleTestSearch}>
                      Tester
                    </Button>
                  </div>

                  {/* Indicateur de sécurité */}
                  {testQuery && (
                    <Alert className={isBlocked(testQuery) ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
                      {isBlocked(testQuery) ? (
                        <AlertTriangle className="h-4 w-4 text-red-600" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      )}
                      <AlertDescription className={isBlocked(testQuery) ? 'text-red-700' : 'text-green-700'}>
                        {isBlocked(testQuery) 
                          ? '⚠️ Cette requête contient des termes bloqués et sera refusée'
                          : '✅ Cette requête est considérée comme sûre'
                        }
                      </AlertDescription>
                    </Alert>
                  )}

                  {/* Nettoyage automatique */}
                  {testQuery && (
                    <div className="text-sm text-slate-600">
                      <strong>Requête nettoyée :</strong> <code className="bg-slate-100 px-1 rounded">
                        {sanitizeQuery(testQuery)}
                      </code>
                    </div>
                  )}
                </div>

                {/* Résultats */}
                {searchResult && (
                  <div className="mt-4">
                    <h4 className="font-semibold mb-2">Résultat de la recherche :</h4>
                    {searchResult.error ? (
                      <Alert className="border-red-200 bg-red-50">
                        <XCircle className="h-4 w-4 text-red-600" />
                        <AlertDescription className="text-red-700">
                          {searchResult.error}
                        </AlertDescription>
                      </Alert>
                    ) : (
                      <div className="space-y-2">
                        <Badge variant="outline" className="text-green-600 border-green-600">
                          {searchResult.results.length} résultat(s) trouvé(s)
                        </Badge>
                        {searchResult.results.map((result: any, index: number) => (
                          <div key={index} className="p-3 bg-slate-50 rounded border">
                            <div className="font-medium">{result.title}</div>
                            <div className="text-sm text-slate-600">{result.content}</div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="data" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Lock className="h-5 w-5" />
                  <span>Masquage des Données Sensibles</span>
                </CardTitle>
                <CardDescription>
                  Découvrez comment nous masquons automatiquement les informations sensibles
                  selon le niveau d'accès de l'utilisateur.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Données originales */}
                  <div>
                    <h4 className="font-semibold mb-2 text-red-600">Données originales (sensibles) :</h4>
                    <pre className="text-xs bg-red-50 p-3 rounded border border-red-200 overflow-auto">
                      {JSON.stringify(testData, null, 2)}
                    </pre>
                  </div>

                  {/* Données masquées */}
                  <div>
                    <h4 className="font-semibold mb-2 text-green-600">Données masquées (sécurisées) :</h4>
                    <pre className="text-xs bg-green-50 p-3 rounded border border-green-200 overflow-auto">
                      {JSON.stringify(maskSensitiveData(testData, 'user'), null, 2)}
                    </pre>
                  </div>
                </div>

                {/* Niveaux d'accès */}
                <div>
                  <h4 className="font-semibold mb-2">Test des niveaux d'accès :</h4>
                  <div className="space-y-2">
                    {['email', 'password', 'api_key', 'user_id', 'content'].map(field => (
                      <div key={field} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                        <span className="font-mono text-sm">{field}</span>
                        <div className="flex space-x-2">
                          <Badge 
                            variant={canAccessField(field, 'user') ? 'outline' : 'destructive'}
                            className="text-xs"
                          >
                            Utilisateur: {canAccessField(field, 'user') ? 'Autorisé' : 'Refusé'}
                          </Badge>
                          <Badge 
                            variant={canAccessField(field, 'admin') ? 'outline' : 'destructive'}
                            className="text-xs"
                          >
                            Admin: {canAccessField(field, 'admin') ? 'Autorisé' : 'Refusé'}
                          </Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="permissions" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Eye className="h-5 w-5" />
                  <span>Système de Permissions</span>
                </CardTitle>
                <CardDescription>
                  Testez les permissions d'export et de partage selon différents types de données.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Test d'export */}
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center space-x-2">
                      <Download className="h-4 w-4" />
                      <span>Permissions d'Export</span>
                    </h4>
                    {['user_scripts', 'public_scripts', 'user_data', 'payment_data'].map(dataType => {
                      const permission = canExportData(dataType, 'user');
                      return (
                        <div key={dataType} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm">{dataType}</span>
                          <Badge 
                            variant={permission.allowed ? 'outline' : 'destructive'}
                            className="text-xs"
                          >
                            {permission.allowed ? 'Autorisé' : 'Refusé'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>

                  {/* Test de partage */}
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center space-x-2">
                      <Share className="h-4 w-4" />
                      <span>Permissions de Partage</span>
                    </h4>
                    {[
                      { data: { ...testData, allow_social_sharing: true }, label: 'Script public' },
                      { data: { ...testData, allow_social_sharing: false }, label: 'Script privé' },
                      { data: { password: 'secret' }, label: 'Données sensibles' }
                    ].map((test, index) => {
                      const permission = canShareData(test.data, 'social');
                      return (
                        <div key={index} className="flex items-center justify-between p-2 bg-slate-50 rounded">
                          <span className="text-sm">{test.label}</span>
                          <Badge 
                            variant={permission.allowed ? 'outline' : 'destructive'}
                            className="text-xs"
                          >
                            {permission.allowed ? 'Autorisé' : 'Refusé'}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>

                  {/* Recommandations */}
                  <div className="space-y-2">
                    <h4 className="font-semibold flex items-center space-x-2">
                      <FileText className="h-4 w-4" />
                      <span>Recommandations</span>
                    </h4>
                    <div className="text-sm text-slate-600 space-y-1">
                      <p>• Chiffrez les données sensibles</p>
                      <p>• Utilisez HTTPS pour toutes les communications</p>
                      <p>• Auditez régulièrement les accès</p>
                      <p>• Formez les utilisateurs</p>
                      <p>• Mettez à jour les systèmes de sécurité</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dashboard">
            <SecurityDashboard isAdmin={true} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default SecurityDemo;