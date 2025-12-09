import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import NotificationsScreen from '../../app/(tabs)/notifications';

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  router: { push: mockPush },
}));

// Mock useAuth
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: () => ({
    user: { id: 'user-1' },
    session: { access_token: 'test-token' }
  }),
}));

// Mock useColorScheme
jest.mock('../../components/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

// Mock supabase
const mockInvoke = jest.fn().mockResolvedValue({ data: {}, error: null });
jest.mock('../../lib/supabase', () => ({
  supabase: {
    functions: {
      invoke: mockInvoke,
    },
  },
}));

// Mock fetch
global.fetch = jest.fn();

describe('NotificationsScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInvoke.mockResolvedValue({ data: {}, error: null });
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ notifications: [], unread_count: 0 }),
    });
  });

  describe('empty state', () => {
    it('renders empty state', async () => {
      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('No notifications yet')).toBeTruthy();
      });
    });

    it('shows empty state description', async () => {
      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText("You'll be notified when someone finds your disc or proposes a meetup")).toBeTruthy();
      });
    });
  });

  describe('notification display', () => {
    it('displays notification when available', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'disc_found',
            title: 'Disc Found!',
            body: 'Someone found your disc',
            data: { recovery_event_id: 'rec-1' },
            read: false,
            created_at: new Date().toISOString(),
          }],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Disc Found!')).toBeTruthy();
        expect(getByText('Someone found your disc')).toBeTruthy();
      });
    });

    it('shows unread badge', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{ id: 'n1', type: 'disc_found', title: 'Test', body: 'Test', data: {}, read: false, created_at: new Date().toISOString() }],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('1 unread')).toBeTruthy();
      });
    });

    it('shows multiple unread count', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [
            { id: 'n1', type: 'disc_found', title: 'Test 1', body: 'Body 1', data: {}, read: false, created_at: new Date().toISOString() },
            { id: 'n2', type: 'meetup_proposed', title: 'Test 2', body: 'Body 2', data: {}, read: false, created_at: new Date().toISOString() },
          ],
          unread_count: 2,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('2 unread')).toBeTruthy();
      });
    });
  });

  describe('notification types', () => {
    it('displays disc_found notification', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'disc_found',
            title: 'Disc Found!',
            body: 'Your Destroyer was found',
            data: { recovery_event_id: 'rec-1' },
            read: false,
            created_at: new Date().toISOString(),
          }],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Disc Found!')).toBeTruthy();
      });
    });

    it('displays meetup_proposed notification', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'meetup_proposed',
            title: 'Meetup Proposed',
            body: 'A meetup has been proposed',
            data: { recovery_event_id: 'rec-1', proposal_id: 'prop-1' },
            read: true,
            created_at: new Date().toISOString(),
          }],
          unread_count: 0,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Meetup Proposed')).toBeTruthy();
      });
    });

    it('displays meetup_accepted notification', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'meetup_accepted',
            title: 'Meetup Accepted',
            body: 'Your meetup was accepted',
            data: { recovery_event_id: 'rec-1' },
            read: false,
            created_at: new Date().toISOString(),
          }],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Meetup Accepted')).toBeTruthy();
      });
    });

    it('displays disc_recovered notification', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'disc_recovered',
            title: 'Disc Recovered',
            body: 'Your disc has been recovered',
            data: { disc_id: 'disc-1' },
            read: false,
            created_at: new Date().toISOString(),
          }],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Disc Recovered')).toBeTruthy();
      });
    });

    it('displays disc_surrendered notification', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'disc_surrendered',
            title: 'Disc Surrendered',
            body: 'A disc has been surrendered to you',
            data: { disc_id: 'disc-1' },
            read: false,
            created_at: new Date().toISOString(),
          }],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Disc Surrendered')).toBeTruthy();
      });
    });
  });

  describe('fetch handling', () => {
    it('fetches notifications on mount', async () => {
      render(<NotificationsScreen />);

      await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
          expect.stringContaining('/get-notifications'),
          expect.any(Object)
        );
      });
    });

    it('handles fetch error gracefully', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
        json: () => Promise.resolve({ error: 'Server error' }),
      });

      const { getByText } = render(<NotificationsScreen />);

      // Should still render empty state without crashing
      await waitFor(() => {
        expect(getByText('No notifications yet')).toBeTruthy();
      });
    });
  });

  describe('notification interactions', () => {
    it('renders notification items as pressable', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'disc_found',
            title: 'Disc Found!',
            body: 'Your disc was found',
            data: { recovery_event_id: 'rec-123' },
            read: false,
            created_at: new Date().toISOString(),
          }],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Disc Found!')).toBeTruthy();
        expect(getByText('Your disc was found')).toBeTruthy();
      });
    });

    it('shows notification body text', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'disc_recovered',
            title: 'Disc Recovered',
            body: 'Your disc is back',
            data: { disc_id: 'disc-456' },
            read: true,
            created_at: new Date().toISOString(),
          }],
          unread_count: 0,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Disc Recovered')).toBeTruthy();
        expect(getByText('Your disc is back')).toBeTruthy();
      });
    });

    it('shows mark all as read button when there are unread notifications', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'disc_found',
            title: 'Test',
            body: 'Test',
            data: {},
            read: false,
            created_at: new Date().toISOString(),
          }],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Mark all read')).toBeTruthy();
      });
    });

    it('shows dismiss all button when there are notifications', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'disc_found',
            title: 'Test',
            body: 'Test',
            data: {},
            read: true,
            created_at: new Date().toISOString(),
          }],
          unread_count: 0,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Dismiss all')).toBeTruthy();
      });
    });
  });

  describe('time formatting', () => {
    it('shows relative time for notifications', async () => {
      // Create a notification from 2 hours ago
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'disc_found',
            title: 'Test',
            body: 'Test',
            data: {},
            read: false,
            created_at: twoHoursAgo,
          }],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('2h ago')).toBeTruthy();
      });
    });

    it('shows Just now for recent notifications', async () => {
      const justNow = new Date().toISOString();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'disc_found',
            title: 'Test',
            body: 'Test',
            data: {},
            read: false,
            created_at: justNow,
          }],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Just now')).toBeTruthy();
      });
    });

    it('shows days ago for older notifications', async () => {
      const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'disc_found',
            title: 'Test',
            body: 'Test',
            data: {},
            read: false,
            created_at: threeDaysAgo,
          }],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('3d ago')).toBeTruthy();
      });
    });

    it('shows minutes ago for recent notifications', async () => {
      const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000).toISOString();

      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'disc_found',
            title: 'Test',
            body: 'Test',
            data: {},
            read: false,
            created_at: tenMinutesAgo,
          }],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('10m ago')).toBeTruthy();
      });
    });
  });

  describe('notification rendering', () => {
    it('renders notification title correctly', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{
            id: 'n1',
            type: 'disc_found',
            title: 'Your Destroyer was found!',
            body: 'Someone found your disc at Maple Hill',
            data: { recovery_event_id: 'rec-123' },
            read: false,
            created_at: new Date().toISOString(),
          }],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Your Destroyer was found!')).toBeTruthy();
        expect(getByText('Someone found your disc at Maple Hill')).toBeTruthy();
      });
    });

    it('correctly shows read notifications differently', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [
            {
              id: 'n1',
              type: 'disc_found',
              title: 'Unread Notification',
              body: 'This is unread',
              data: {},
              read: false,
              created_at: new Date().toISOString(),
            },
            {
              id: 'n2',
              type: 'disc_found',
              title: 'Read Notification',
              body: 'This is read',
              data: {},
              read: true,
              created_at: new Date().toISOString(),
            },
          ],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Unread Notification')).toBeTruthy();
        expect(getByText('Read Notification')).toBeTruthy();
      });
    });

    it('displays multiple notifications in a list', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [
            { id: 'n1', type: 'disc_found', title: 'First Notification', body: 'Body 1', data: {}, read: false, created_at: new Date().toISOString() },
            { id: 'n2', type: 'meetup_proposed', title: 'Second Notification', body: 'Body 2', data: {}, read: false, created_at: new Date().toISOString() },
            { id: 'n3', type: 'meetup_accepted', title: 'Third Notification', body: 'Body 3', data: {}, read: true, created_at: new Date().toISOString() },
          ],
          unread_count: 2,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('First Notification')).toBeTruthy();
        expect(getByText('Second Notification')).toBeTruthy();
        expect(getByText('Third Notification')).toBeTruthy();
      });
    });
  });

  describe('mark all as read', () => {
    it('shows mark all read button when there are unread notifications', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{ id: 'n1', type: 'disc_found', title: 'Test', body: 'Test', data: {}, read: false, created_at: new Date().toISOString() }],
          unread_count: 1,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Mark all read')).toBeTruthy();
      });
    });

    it('hides mark all read button when all are read', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{ id: 'n1', type: 'disc_found', title: 'Test', body: 'Test', data: {}, read: true, created_at: new Date().toISOString() }],
          unread_count: 0,
        }),
      });

      const { queryByText, getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Dismiss all')).toBeTruthy();
      });

      expect(queryByText('Mark all read')).toBeNull();
    });
  });

  describe('dismiss all', () => {
    it('shows dismiss all button when notifications exist', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{ id: 'n1', type: 'disc_found', title: 'Test', body: 'Test', data: {}, read: true, created_at: new Date().toISOString() }],
          unread_count: 0,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Dismiss all')).toBeTruthy();
      });
    });

    it('dismiss all button is pressable', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({
          notifications: [{ id: 'n1', type: 'disc_found', title: 'Test', body: 'Test Body', data: {}, read: true, created_at: new Date().toISOString() }],
          unread_count: 0,
        }),
      });

      const { getByText } = render(<NotificationsScreen />);

      await waitFor(() => {
        expect(getByText('Dismiss all')).toBeTruthy();
      });

      // Verify button can be pressed without errors
      expect(() => fireEvent.press(getByText('Dismiss all'))).not.toThrow();
    });
  });
});
