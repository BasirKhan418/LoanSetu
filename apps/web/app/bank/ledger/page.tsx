'use client';

import { useState } from 'react';

interface LedgerEntry {
  id: string;
  loanId: string;
  sequenceNum: number;
  eventType: string;
  eventData: any;
  amount: number | null;
  performedBy: string;
  timestamp: string;
  currentHash: string;
  previousHash: string;
  ipAddress?: string;
}

interface VerificationResult {
  isValid: boolean;
  totalEntries: number;
  invalidEntries: number[];
  brokenChain: boolean;
  errors: string[];
}

export default function LedgerViewer() {
  const [loanId, setLoanId] = useState('');
  const [entries, setEntries] = useState<LedgerEntry[]>([]);
  const [verification, setVerification] = useState<VerificationResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const fetchEntries = async () => {
    if (!loanId.trim()) {
      setError('Please enter a Loan ID');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/ledger/read?loanId=${encodeURIComponent(loanId)}`);
      const data = await response.json();

      if (response.ok) {
        setEntries(data.entries || []);
        if (data.entries.length === 0) {
          setError('No ledger entries found for this loan ID');
        }
      } else {
        setError(data.error || 'Failed to fetch entries');
        setEntries([]);
      }
    } catch (err) {
      setError('Network error. Make sure your server is running.');
      setEntries([]);
    } finally {
      setLoading(false);
    }
  };

  const verifyChain = async () => {
    if (!loanId.trim()) {
      setError('Please enter a Loan ID');
      return;
    }

    setLoading(true);
    setError('');
    try {
      const response = await fetch(`/api/ledger/verify?loanId=${encodeURIComponent(loanId)}`);
      const data = await response.json();

      if (response.ok) {
        setVerification(data);
      } else {
        setError(data.error || 'Failed to verify chain');
      }
    } catch (err) {
      setError('Network error. Make sure your server is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-6 mb-6">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            🔗 Loan Ledger Viewer
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            View and verify the immutable blockchain-like ledger for any loan
          </p>

          {/* Input Section */}
          <div className="flex gap-4 mb-6">
            <input
              type="text"
              placeholder="Enter Loan ID (e.g., 675679e5d2f9447f64b84f69)"
              value={loanId}
              onChange={(e) => setLoanId(e.target.value)}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 dark:bg-gray-700 dark:text-white"
              onKeyPress={(e) => e.key === 'Enter' && fetchEntries()}
            />
            <button
              onClick={fetchEntries}
              disabled={loading}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? 'Loading...' : 'View Ledger'}
            </button>
            <button
              onClick={verifyChain}
              disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Verify Chain
            </button>
          </div>

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
              <p className="text-red-800 dark:text-red-400">{error}</p>
            </div>
          )}

          {/* Verification Result */}
          {verification && (
            <div className={`border rounded-lg p-4 mb-6 ${
              verification.isValid 
                ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800' 
                : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            }`}>
              <h2 className="text-xl font-bold mb-3 flex items-center gap-2">
                {verification.isValid ? 'Chain Valid' : 'Chain Invalid'}
              </h2>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-semibold">Total Entries:</span> {verification.totalEntries}
                </div>
                <div>
                  <span className="font-semibold">Invalid Entries:</span> {verification.invalidEntries.length || 'None'}
                </div>
                <div>
                  <span className="font-semibold">Chain Broken:</span> {verification.brokenChain ? '❌ Yes' : '✅ No'}
                </div>
              </div>
              {verification.errors.length > 0 && (
                <div className="mt-3">
                  <p className="font-semibold mb-1">Errors:</p>
                  <ul className="list-disc list-inside text-sm space-y-1">
                    {verification.errors.map((err, idx) => (
                      <li key={idx} className="text-red-700 dark:text-red-400">{err}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Entries List */}
        {entries.length > 0 && (
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              Ledger Entries ({entries.length})
            </h2>
            
            {entries.map((entry, index) => (
              <div
                key={entry.id}
                className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border-l-4 border-blue-500"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      #{entry.sequenceNum} - {entry.eventType}
                    </h3>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {new Date(entry.timestamp).toLocaleString()}
                    </p>
                  </div>
                  {entry.amount && (
                    <div className="text-right">
                      <p className="text-sm text-gray-500 dark:text-gray-400">Amount</p>
                      <p className="text-xl font-bold text-green-600 dark:text-green-400">
                        ₹{entry.amount.toLocaleString()}
                      </p>
                    </div>
                  )}
                </div>

                {/* Event Data */}
                <div className="bg-gray-50 dark:bg-gray-900 rounded p-4 mb-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 font-semibold">Event Data:</p>
                  <pre className="text-sm text-gray-700 dark:text-gray-300 overflow-x-auto">
                    {JSON.stringify(entry.eventData, null, 2)}
                  </pre>
                </div>

                {/* Metadata */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">Performed By:</span>
                    <p className="text-gray-600 dark:text-gray-400">{entry.performedBy}</p>
                  </div>
                  <div>
                    <span className="font-semibold text-gray-700 dark:text-gray-300">IP Address:</span>
                    <p className="text-gray-600 dark:text-gray-400">{entry.ipAddress || 'N/A'}</p>
                  </div>
                </div>

                {/* Hashes */}
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="space-y-2 text-xs font-mono">
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Current Hash:</span>
                      <p className="text-blue-600 dark:text-blue-400 break-all">{entry.currentHash}</p>
                    </div>
                    <div>
                      <span className="font-semibold text-gray-700 dark:text-gray-300">Previous Hash:</span>
                      <p className="text-purple-600 dark:text-purple-400 break-all">
                        {entry.previousHash === 'GENESIS' ? (
                          <span className="bg-purple-100 dark:bg-purple-900 px-2 py-1 rounded">GENESIS</span>
                        ) : (
                          entry.previousHash
                        )}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Chain Link Indicator */}
                {index < entries.length - 1 && (
                  <div className="mt-4 flex justify-center">
                    <div className="text-gray-400 dark:text-gray-600">
                      ↓ Chained to next entry
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Instructions */}
        {entries.length === 0 && !error && (
          <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
            <h3 className="text-lg font-bold text-blue-900 dark:text-blue-400 mb-3">
              How to Use:
            </h3>
            <ol className="list-decimal list-inside space-y-2 text-blue-800 dark:text-blue-300">
              <li>Create a loan using your existing loan creation form</li>
              <li>Copy the Loan ID from the response</li>
              <li>Paste it in the input field above and click "View Ledger"</li>
              <li>Click "Verify Chain" to check integrity</li>
            </ol>
            <div className="mt-4 p-4 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
              <p className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
                Or test with API directly:
              </p>
              <code className="text-xs text-gray-700 dark:text-gray-300 block">
                GET /api/ledger/read?loanId=YOUR_LOAN_ID
              </code>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
