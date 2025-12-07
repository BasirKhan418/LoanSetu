// apps/mobileapp/contexts/DatabaseContext.tsx
import React, { createContext, useContext, useEffect, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Network from 'expo-network';
import { database } from '../database/schema';
import { syncService, SyncResult } from '../services/syncservice';

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

  // Monitor network connectivity
  useEffect(() => {
    const checkConnectivity = async () => {
      try {
        const networkState = await Network.getNetworkStateAsync();
        setIsOnline((networkState.isConnected ?? false) && (networkState.isInternetReachable ?? false));
      } catch (error) {
        console.error('Network check error:', error);
        setIsOnline(false);
      }
    };

    checkConnectivity();

    // Check every 30 seconds
    const interval = setInterval(checkConnectivity, 30000);

    return () => clearInterval(interval);
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