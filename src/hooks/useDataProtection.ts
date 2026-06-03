import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface SensitiveField {
  field: string;
  level: 'low' | 'medium' | 'high' | 'critical';
  maskPattern?: string;
  accessRoles?: string[];
}

interface DataAccessLog {
  timestamp: Date;
  userId?: string;
  action: 'view' | 'search' | 'export' | 'share';
  dataType: string;
  fieldName?: string;
  denied: boolean;
  reason?: string;
}

// Configuration des champs sensibles
const SENSITIVE_FIELDS: SensitiveField[] = [
  { field: 'email', level: 'medium', maskPattern: '***@***.***' },
  { field: 'phone', level: 'medium', maskPattern: '***-***-****' },
  { field: 'password', level: 'critical', maskPattern: '••••••••' },
  { field: 'api_key', level: 'critical', maskPattern: '••••••••••••••••' },
  { field: 'token', level: 'critical', maskPattern: '••••••••••••••••' },
  { field: 'user_id', level: 'high', maskPattern: '••••••••-••••-••••' },
  { field: 'payment_details', level: 'high', maskPattern: '**** **** **** ****' },
  { field: 'content', level: 'low' }, // Contenu des scripts
  { field: 'author_name', level: 'low' },
  { field: 'script_id', level: 'medium' }
];

export const useDataProtection = () => {
  const { user } = useAuth();
  const [accessLogs, setAccessLogs] = useState<DataAccessLog[]>([]);

  // Fonction pour logger les accès aux données
  const logDataAccess = useCallback((
    action: DataAccessLog['action'],
    dataType: string,
    fieldName?: string,
    denied: boolean = false,
    reason?: string
  ) => {
    const log: DataAccessLog = {
      timestamp: new Date(),
      userId: user?.id,
      action,
      dataType,
      fieldName,
      denied,
      reason
    };

    setAccessLogs(prev => [...prev.slice(-99), log]); // Garder 100 derniers logs
  }, [user?.id]);

  // Vérifier si un utilisateur peut accéder à un champ
  const canAccessField = useCallback((
    fieldName: string,
    userRole: string = 'user'
  ): boolean => {
    const field = SENSITIVE_FIELDS.find(f => f.field === fieldName);
    
    if (!field) return true; // Champ non sensible
    
    // Règles d'accès par niveau
    switch (field.level) {
      case 'critical':
        return userRole === 'admin'; // Seulement admin
      case 'high':
        return ['admin', 'moderator'].includes(userRole);
      case 'medium':
        return user !== null; // Utilisateur connecté
      case 'low':
      default:
        return true; // Accès libre
    }
  }, [user]);

  // Masquer les données sensibles
  const maskSensitiveData = useCallback((
    data: Record<string, any>,
    userRole: string = 'user'
  ): Record<string, any> => {
    const maskedData = { ...data };

    Object.keys(maskedData).forEach(key => {
      const field = SENSITIVE_FIELDS.find(f => f.field === key);
      
      if (field && !canAccessField(key, userRole)) {
        if (field.maskPattern) {
          maskedData[key] = field.maskPattern;
        } else {
          delete maskedData[key]; // Supprimer complètement
        }
        
        logDataAccess('view', 'masked_field', key, false, 'Data masked');
      }
    });

    return maskedData;
  }, [canAccessField, logDataAccess]);

  // Filtrer les résultats de recherche selon les permissions
  const filterSearchResults = useCallback((
    results: any[],
    userRole: string = 'user',
    searchType: string = 'general'
  ): any[] => {
    return results.map(item => {
      const filtered = maskSensitiveData(item, userRole);
      
      // Règles spéciales pour différents types de recherche
      if (searchType === 'public_scripts') {
        // Pour les scripts publics, masquer certaines infos utilisateur
        if (filtered.user_id && userRole !== 'admin') {
          delete filtered.user_id;
        }
      }
      
      if (searchType === 'user_scripts' && !user) {
        // Scripts utilisateur : accès seulement si connecté
        logDataAccess('search', searchType, undefined, true, 'Unauthorized access attempt');
        return null;
      }
      
      return filtered;
    }).filter(Boolean); // Supprimer les éléments null
  }, [maskSensitiveData, user, logDataAccess]);

  // Vérifier les permissions d'export
  const canExportData = useCallback((
    dataType: string,
    userRole: string = 'user'
  ): { allowed: boolean; reason?: string } => {
    
    // Règles d'export par type de données
    switch (dataType) {
      case 'user_scripts':
        if (!user) {
          logDataAccess('export', dataType, undefined, true, 'User not authenticated');
          return { allowed: false, reason: 'Authentification requise' };
        }
        return { allowed: true };
        
      case 'public_scripts':
        // Export limité pour les scripts publics
        if (userRole === 'user') {
          logDataAccess('export', dataType, undefined, false, 'Limited export allowed');
          return { allowed: true };
        }
        return { allowed: true };
        
      case 'user_data':
      case 'payment_data':
        if (!['admin', 'moderator'].includes(userRole)) {
          logDataAccess('export', dataType, undefined, true, 'Insufficient permissions');
          return { allowed: false, reason: 'Permissions insuffisantes' };
        }
        return { allowed: true };
        
      default:
        return { allowed: true };
    }
  }, [user, logDataAccess]);

  // Vérifier les permissions de partage
  const canShareData = useCallback((
    data: any,
    shareType: 'social' | 'email' | 'link' = 'social'
  ): { allowed: boolean; reason?: string } => {
    
    // Vérifier si les données contiennent des informations sensibles
    const hasSensitiveData = Object.keys(data).some(key => {
      const field = SENSITIVE_FIELDS.find(f => f.field === key);
      return field && field.level === 'critical';
    });

    if (hasSensitiveData) {
      logDataAccess('share', shareType, undefined, true, 'Sensitive data detected');
      return { 
        allowed: false, 
        reason: 'Ces données contiennent des informations sensibles qui ne peuvent pas être partagées.' 
      };
    }

    // Vérifier si l'utilisateur est propriétaire des données
    if (data.user_id && data.user_id !== user?.id) {
      logDataAccess('share', shareType, undefined, true, 'Not data owner');
      return { 
        allowed: false, 
        reason: 'Vous ne pouvez partager que vos propres créations.' 
      };
    }

    // Vérifier si le partage est autorisé pour ce type de données
    if (data.allow_social_sharing === false && shareType === 'social') {
      logDataAccess('share', shareType, undefined, true, 'Social sharing disabled');
      return { 
        allowed: false, 
        reason: 'Le partage social est désactivé pour cette œuvre.' 
      };
    }

    logDataAccess('share', shareType, undefined, false, 'Sharing allowed');
    return { allowed: true };
  }, [user?.id, logDataAccess]);

  // Obtenir les statistiques de sécurité
  const getSecurityStats = useCallback(() => {
    const totalAccess = accessLogs.length;
    const deniedAccess = accessLogs.filter(log => log.denied).length;
    const recentDenied = accessLogs.filter(
      log => log.denied && Date.now() - log.timestamp.getTime() < 3600000 // 1 heure
    ).length;

    return {
      totalAccess,
      deniedAccess,
      denialRate: totalAccess > 0 ? (deniedAccess / totalAccess) * 100 : 0,
      recentDenied,
      topDenialReasons: accessLogs
        .filter(log => log.denied)
        .reduce((acc: Record<string, number>, log) => {
          const reason = log.reason || 'Unknown';
          acc[reason] = (acc[reason] || 0) + 1;
          return acc;
        }, {})
    };
  }, [accessLogs]);

  // Nettoyer les logs anciens
  const clearOldLogs = useCallback(() => {
    const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
    setAccessLogs(prev => prev.filter(log => log.timestamp.getTime() > oneWeekAgo));
  }, []);

  return {
    canAccessField,
    maskSensitiveData,
    filterSearchResults,
    canExportData,
    canShareData,
    getSecurityStats,
    clearOldLogs,
    accessLogs: accessLogs.slice(-20), // Expose seulement les 20 derniers
    logDataAccess
  };
};