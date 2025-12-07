// apps/mobileapp/contexts/DatabaseContext.tsx
import NetInfo from '@react-native-community/netinfo';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { database } from '../database/schema';
import { SyncResult, syncService } from '../services/syncservice';

interface DatabaseContextType {
  isInitialized: boolean;
  isSyncing: boolean;
  lastSyncResult: SyncResult | null;
  syncNow: () => Promise<SyncResult>;
  isOnline: boolean;
}

const DatabaseContext = createContext<DatabaseContextType | undefined>(undefined);

export function DatabaseProvider({ children }: { children: React.ReactNode }) {
  const [isInitialized, setIsInitialized] = useState(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null);
  const [isOnline, setIsOnline] = useState(true);

  // Initialize database
  useEffect(() => {
    const init = async () => {
      try {
        await database.init();
        setIsInitialized(true);
        console.log('Database initialized');
      } catch (error) {
        console.error('Failed to initialize database:', error);
      }
    };

    init();

    return () => {
      database.close();
    };
  }, []);

  // Monitor network connectivity with instant updates using NetInfo
  useEffect(() => {
    // Subscribe to network state changes (instant updates via native broadcast receiver)
    const unsubscribe = NetInfo.addEventListener(state => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable ?? false;
      const online = isConnected && isInternetReachable;
      
      console.log('Network status changed:', {
        isConnected,
        isInternetReachable,
        online,
        type: state.type,
      });
      
      setIsOnline(online);
    });

    // Get initial network state
    NetInfo.fetch().then(state => {
      const isConnected = state.isConnected ?? false;
      const isInternetReachable = state.isInternetReachable ?? false;
      const online = isConnected && isInternetReachable;
      
      console.log('Initial network status:', {
        isConnected,
        isInternetReachable,
        online,
        type: state.type,
      });
      
      setIsOnline(online);
    });

    return () => {
      unsubscribe();
    };
  }, []);

  // Start sync on initialization
  useEffect(() => {
    if (!isInitialized) return;

    // Start periodic sync
    syncService.startPeriodicSync();

    return () => {
      syncService.stopPeriodicSync();
    };
  }, [isInitialized]);

  // Sync on app foreground
  useEffect(() => {
    if (!isInitialized) return;

    const subscription = AppState.addEventListener('change', (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        console.log('App foregrounded, triggering sync');
        syncService.sync().then(setLastSyncResult);
      }
    });

    return () => {
      subscription.remove();
    };
  }, [isInitialized]);

  // Sync on network change (when coming back online)
  useEffect(() => {
    if (!isInitialized) return;

    if (isOnline) {
      console.log('Network restored, triggering sync');
      syncService.sync().then(setLastSyncResult);
    }
  }, [isOnline, isInitialized]);

  // Manual sync trigger
  const syncNow = async (): Promise<SyncResult> => {
    setIsSyncing(true);
    try {
      const result = await syncService.sync();
      setLastSyncResult(result);
      return result;
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <DatabaseContext.Provider
      value={{
        isInitialized,
        isSyncing,
        lastSyncResult,
        syncNow,
        isOnline,
      }}
    >
      {children}
    </DatabaseContext.Provider>
  );
}

export function useDatabase() {
  const context = useContext(DatabaseContext);
  if (context === undefined) {
    throw new Error('useDatabase must be used within a DatabaseProvider');
  }
  return context;
}