let monitoringInterval: NodeJS.Timeout | null = null;

export interface MonitorConfig {
  intervalMinutes: number;
  enabled: boolean;
}

export function startLedgerMonitoring(config: MonitorConfig = { intervalMinutes: 10, enabled: true }) {
  if (!config.enabled) {
    console.log('📊 Ledger monitoring is disabled');
    return;
  }

  if (monitoringInterval) {
    console.log('📊 Ledger monitoring already running');
    return;
  }

  const intervalMs = config.intervalMinutes * 60 * 1000;

  monitoringInterval = setInterval(async () => {
    try {
      console.log('🔍 Running scheduled ledger verification...');
      
      const cronSecret = process.env.CRON_SECRET || 'your-secret-key';
      const apiUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      
      const response = await fetch(`${apiUrl}/api/cron/verify-ledgers`, {
        headers: {
          'Authorization': `Bearer ${cronSecret}`,
        },
      });

      const result = await response.json();
      
      if (result.success) {
        console.log('✅ Scheduled verification complete:', result.results);
      } else {
        console.error('❌ Scheduled verification failed:', result.error);
      }
    } catch (error) {
      console.error('Error in scheduled verification:', error);
    }
  }, intervalMs);

  console.log(`📊 Ledger monitoring started - checking every ${config.intervalMinutes} minutes`);
}

/**
 * Stop background monitoring
 */
export function stopLedgerMonitoring() {
  if (monitoringInterval) {
    clearInterval(monitoringInterval);
    monitoringInterval = null;
    console.log('📊 Ledger monitoring stopped');
  }
}
