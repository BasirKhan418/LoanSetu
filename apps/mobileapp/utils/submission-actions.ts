/**
 * Submission Manager UI Component
 * Add this to your debug/settings screen to manage submissions
 */

import { Alert } from 'react-native';
import { SubmissionManager } from '../scripts/manage-submissions';

export const SubmissionActions = {
  /**
   * View all submissions in console
   */
  async viewSubmissions() {
    const submissions = await SubmissionManager.viewAllSubmissions();
    Alert.alert(
      'Submissions',
      `Total: ${submissions?.length || 0} submissions\nCheck console for details`,
      [{ text: 'OK' }]
    );
  },

  /**
   * Delete all pending submissions
   */
  async deletePending() {
    Alert.alert(
      'Delete Pending Submissions',
      'This will delete all submissions that have not been synced. Continue?',
      [
        { text: 'Cancel', style: 'cancel' as const },
        {
          text: 'Delete',
          style: 'destructive' as const,
          onPress: async () => {
            await SubmissionManager.deletePendingSubmissions();
            Alert.alert('Success', 'Pending submissions deleted');
          },
        },
      ]
    );
  },

  /**
   * Delete ALL submissions (dangerous!)
   */
  async deleteAll() {
    Alert.alert(
      'Delete ALL Submissions',
      'WARNING: This will delete ALL submissions including synced ones. This action cannot be undone!',
      [
        { text: 'Cancel', style: 'cancel' as const },
        {
          text: 'Delete All',
          style: 'destructive' as const,
          onPress: async () => {
            await SubmissionManager.deleteAllSubmissions();
            Alert.alert('Success', 'All submissions deleted');
          },
        },
      ]
    );
  },

  /**
   * Reset retry count for failed submissions
   */
  async resetRetries() {
    await SubmissionManager.resetRetryCount();
    Alert.alert('Success', 'Retry count reset for failed submissions');
  },
};

// Usage in your React Native screen:
//
// import { SubmissionActions } from '../utils/submission-actions';
//
// <Button title="View Submissions" onPress={SubmissionActions.viewSubmissions} />
// <Button title="Delete Pending" onPress={SubmissionActions.deletePending} />
// <Button title="Reset Retries" onPress={SubmissionActions.resetRetries} />
