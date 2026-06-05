import { useState, useCallback, useMemo, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SearchSecurityConfig {
  enableLogging: boolean;
  sanitizeInput: boolean;
  maxQueryLength: number;
  rateLimitMs: number;
  blockedTerms: string[];
}

interface SearchLog {
  timestamp: Date;
  userId?: string;
  query: string;
  results: number;
  blocked: boolean;
  reason?: string;
}

const DEFAULT_CONFIG: SearchSecurityConfig = {
  enableLogging: true,
  sanitizeInput: true,
  maxQueryLength: 100,
  rateLimitMs: 1000, // 1 seconde entre les recherches
  blockedTerms: [
    // Termes sensibles à bloquer
    'password', 'token', 'secret', 'api_key', 'private',
    'admin', 'system', 'debug', 'test', 'internal',
    // Injection SQL/XSS
    'script', 'iframe', 'onclick', 'onerror', 'onload',
    'javascript:', 'data:', 'vbscript:', 'expression(',
    'select ', 'insert ', 'update ', 'delete ', 'drop ',
    'union ', 'exec ', 'execute ', '--', ';--', '/*', '*/',
    '<script', '</script', '<iframe', '</iframe',
  ]
};

export const useSecureSearch = (config: Partial<SearchSecurityConfig> = {}) => {
  const { user } = useAuth();
  const lastSearchTimeRef = useRef(0);
  const [searchLogs, setSearchLogs] = useState<SearchLog[]>([]);
  
  const securityConfig = useMemo(() => ({
    ...DEFAULT_CONFIG,
    ...config
  }), [config]);

  // Fonction de nettoyage et validation de l'input
  const sanitizeQuery = useCallback((query: string): string => {
    if (!securityConfig.sanitizeInput) return query;
    
    // Supprimer les caractères dangereux
    return query
      .trim()
      .replace(/[<>'"]/g, '') // Supprimer caractères HTML/JS
      .replace(/\s+/g, ' ') // Normaliser les espaces
      .substring(0, securityConfig.maxQueryLength); // Limiter la longueur
  }, [securityConfig]);

  // Vérification des termes bloqués
  const containsBlockedTerms = useCallback((query: string): { blocked: boolean; term?: string } => {
    const lowerQuery = query.toLowerCase();
    
    for (const term of securityConfig.blockedTerms) {
      if (lowerQuery.includes(term.toLowerCase())) {
        return { blocked: true, term };
      }
    }
    
    return { blocked: false };
  }, [securityConfig.blockedTerms]);

  // Rate limiting
  const isRateLimited = useCallback((): boolean => {
    const now = Date.now();
    const timeSinceLastSearch = now - lastSearchTimeRef.current;

    if (timeSinceLastSearch < securityConfig.rateLimitMs) {
      return true;
    }

    lastSearchTimeRef.current = now;
    return false;
  }, [securityConfig.rateLimitMs]);

  // Logger sécurisé
  const logSearch = useCallback((
    query: string, 
    results: number, 
    blocked: boolean, 
    reason?: string
  ) => {
    if (!securityConfig.enableLogging) return;

    const log: SearchLog = {
      timestamp: new Date(),
      userId: user?.id,
      query: query.substring(0, 50), // Limiter les logs
      results,
      blocked,
      reason
    };

    setSearchLogs(prev => [...prev.slice(-99), log]); // Garder 100 derniers logs max
  }, [user?.id, securityConfig.enableLogging]);

  // Fonction principale de recherche sécurisée
  const secureSearch = useCallback((
    originalQuery: string,
    searchFunction: (query: string) => any[],
    additionalChecks?: (query: string) => { valid: boolean; reason?: string }
  ): { results: any[]; error?: string; blocked?: boolean } => {
    
    // 1. Rate limiting
    if (isRateLimited()) {
      const error = "Trop de recherches rapides. Veuillez patienter.";
      logSearch(originalQuery, 0, true, "Rate limit");
      return { results: [], error, blocked: true };
    }

    // 2. Nettoyage de l'input
    const cleanQuery = sanitizeQuery(originalQuery);
    
    // 3. Vérification des termes bloqués
    const { blocked, term } = containsBlockedTerms(cleanQuery);
    if (blocked) {
      const error = `Terme non autorisé détecté: "${term}"`;
      logSearch(cleanQuery, 0, true, `Blocked term: ${term}`);
      return { results: [], error, blocked: true };
    }

    // 4. Vérifications additionnelles spécifiques
    if (additionalChecks) {
      const { valid, reason } = additionalChecks(cleanQuery);
      if (!valid) {
        logSearch(cleanQuery, 0, true, reason);
        return { results: [], error: reason || "Recherche non valide", blocked: true };
      }
    }

    // 5. Exécution de la recherche
    try {
      const results = searchFunction(cleanQuery);
      logSearch(cleanQuery, results.length, false);
      return { results };
    } catch (error) {
      const errorMsg = "Erreur lors de la recherche";
      logSearch(cleanQuery, 0, true, "Search error");
      return { results: [], error: errorMsg };
    }
  }, [sanitizeQuery, containsBlockedTerms, isRateLimited, logSearch]);

  // Fonction pour obtenir les statistiques de sécurité
  const getSecurityStats = useCallback(() => {
    const totalSearches = searchLogs.length;
    const blockedSearches = searchLogs.filter(log => log.blocked).length;
    const recentSearches = searchLogs.filter(
      log => Date.now() - log.timestamp.getTime() < 60000 // 1 minute
    ).length;

    return {
      totalSearches,
      blockedSearches,
      blockRate: totalSearches > 0 ? (blockedSearches / totalSearches) * 100 : 0,
      recentSearches,
      lastBlockedTerms: searchLogs
        .filter(log => log.blocked && log.reason?.includes('Blocked term'))
        .slice(-5)
        .map(log => log.reason)
    };
  }, [searchLogs]);

  // Fonction pour nettoyer les logs anciens
  const clearOldLogs = useCallback(() => {
    const oneDayAgo = Date.now() - 24 * 60 * 60 * 1000;
    setSearchLogs(prev => prev.filter(log => log.timestamp.getTime() > oneDayAgo));
  }, []);

  return {
    secureSearch,
    sanitizeQuery,
    searchLogs: searchLogs.slice(-20), // Expose seulement les 20 derniers
    getSecurityStats,
    clearOldLogs,
    isBlocked: (query: string) => containsBlockedTerms(query).blocked
  };
};