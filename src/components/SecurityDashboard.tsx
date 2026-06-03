import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertTriangle, Shield, Search, Eye, FileText, Share, Clock, Users } from 'lucide-react';
import { useSecureSearch } from '@/hooks/useSecureSearch';
import { useDataProtection } from '@/hooks/useDataProtection';

interface SecurityDashboardProps {
  isAdmin?: boolean;
}

const SecurityDashboard = ({ isAdmin = false }: SecurityDashboardProps) => {
  const { searchLogs, getSecurityStats: getSearchStats, clearOldLogs: clearSearchLogs } = useSecureSearch();
  const { 
    accessLogs, 
    getSecurityStats: getDataStats, 
    clearOldLogs: clearDataLogs 
  } = useDataProtection();
  
  const [showDetails, setShowDetails] = useState(false);

  const searchStats = getSearchStats();
  const dataStats = getDataStats();

  const handleClearLogs = () => {
    clearSearchLogs();
    clearDataLogs();
    setShowDetails(false);
  };

  if (!isAdmin) {
    return (
      <Card className="w-full max-w-md mx-auto">
        <CardHeader>
          <div className="flex items-center space-x-2">
            <Shield className="h-5 w-5 text-green-600" />
            <CardTitle className="text-lg">Sécurité des Données</CardTitle>
          </div>
          <CardDescription>
            Vos données sont protégées par nos systèmes de sécurité avancés.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Chiffrement</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Activé
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Filtrage contenu</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Activé
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-slate-600">Protection partage</span>
              <Badge variant="outline" className="text-green-600 border-green-600">
                Activé
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Tableau de Bord Sécurité</h2>
          <p className="text-slate-600">Surveillance des accès et protection des données</p>
        </div>
        <Button variant="outline" onClick={handleClearLogs}>
          <Clock className="h-4 w-4 mr-2" />
          Nettoyer les logs
        </Button>
      </div>

      {/* Alertes de sécurité */}
      {(searchStats.blockRate > 10 || dataStats.recentDenied > 5) && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <div className="flex items-center space-x-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              <CardTitle className="text-orange-800">Alerte Sécurité</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-orange-700">
              Activité suspecte détectée. Surveillez les tentatives d'accès non autorisées.
            </p>
          </CardContent>
        </Card>
      )}

      {/* Statistiques générales */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Search className="h-4 w-4 text-blue-600" />
              <Badge variant="outline">{searchStats.totalSearches}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{searchStats.blockedSearches}</div>
            <p className="text-xs text-slate-600">Recherches bloquées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Eye className="h-4 w-4 text-green-600" />
              <Badge variant="outline">{dataStats.totalAccess}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataStats.deniedAccess}</div>
            <p className="text-xs text-slate-600">Accès refusés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Shield className="h-4 w-4 text-purple-600" />
              <Badge 
                variant="outline" 
                className={searchStats.blockRate < 5 ? 'text-green-600' : 'text-orange-600'}
              >
                {searchStats.blockRate.toFixed(1)}%
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {searchStats.blockRate < 5 ? 'Normal' : 'Élevé'}
            </div>
            <p className="text-xs text-slate-600">Taux de blocage</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <Users className="h-4 w-4 text-indigo-600" />
              <Badge variant="outline">{searchStats.recentSearches}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dataStats.recentDenied}</div>
            <p className="text-xs text-slate-600">Activité récente</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Recherches</TabsTrigger>
          <TabsTrigger value="access">Accès Données</TabsTrigger>
          <TabsTrigger value="threats">Menaces</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Search className="h-5 w-5" />
                <span>Logs de Recherche</span>
              </CardTitle>
              <CardDescription>
                Surveillance des requêtes de recherche et détection des termes suspects
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {searchLogs.slice(0, 10).map((log, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-2 rounded border ${
                      log.blocked ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={log.blocked ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {log.blocked ? 'BLOQUÉ' : 'OK'}
                      </Badge>
                      <span className="text-sm font-mono">"{log.query}"</span>
                    </div>
                    <div className="text-xs text-slate-500">
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="access" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Eye className="h-5 w-5" />
                <span>Accès aux Données</span>
              </CardTitle>
              <CardDescription>
                Surveillance des accès aux données sensibles et exports
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {accessLogs.slice(0, 10).map((log, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center justify-between p-2 rounded border ${
                      log.denied ? 'bg-red-50 border-red-200' : 'bg-blue-50 border-blue-200'
                    }`}
                  >
                    <div className="flex items-center space-x-2">
                      <Badge 
                        variant={log.denied ? 'destructive' : 'outline'}
                        className="text-xs"
                      >
                        {log.action.toUpperCase()}
                      </Badge>
                      <span className="text-sm">{log.dataType}</span>
                      {log.fieldName && (
                        <span className="text-xs text-slate-500">({log.fieldName})</span>
                      )}
                    </div>
                    <div className="text-xs text-slate-500">
                      {log.timestamp.toLocaleTimeString()}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="threats" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
                <span>Analyse des Menaces</span>
              </CardTitle>
              <CardDescription>
                Détection et analyse des tentatives d'accès malveillantes
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Top des raisons de blocage */}
                <div>
                  <h4 className="font-semibold mb-2">Principales menaces détectées :</h4>
                  <div className="space-y-2">
                    {Object.entries(dataStats.topDenialReasons)
                      .sort(([,a], [,b]) => b - a)
                      .slice(0, 5)
                      .map(([reason, count]) => (
                        <div key={reason} className="flex items-center justify-between">
                          <span className="text-sm">{reason}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                  </div>
                </div>

                {/* Recommandations */}
                <div className="bg-slate-50 p-4 rounded-lg">
                  <h4 className="font-semibold mb-2">Recommandations :</h4>
                  <ul className="text-sm text-slate-600 space-y-1">
                    <li>• Surveillez les tentatives d'accès répétées</li>
                    <li>• Vérifiez les requêtes contenant des termes suspects</li>
                    <li>• Activez les notifications d'alerte en temps réel</li>
                    <li>• Formez les utilisateurs aux bonnes pratiques</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SecurityDashboard;