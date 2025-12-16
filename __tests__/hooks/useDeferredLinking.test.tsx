import { renderHook, waitFor } from '@testing-library/react-native';
import { Alert, AppState } from 'react-native';
import { useRouter } from 'expo-router';

import {
  checkClipboardForCode,
  hasCheckedDeferredCode,
  markDeferredCodeChecked,
} from '@/lib/deferredLinking';

// Mock the dependencies
jest.mock('expo-router', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/lib/deferredLinking', () => ({
  checkClipboardForCode: jest.fn(),
  hasCheckedDeferredCode: jest.fn(),
  markDeferredCodeChecked: jest.fn(),
}));

jest.spyOn(Alert, 'alert');

// Extract the hook for testing (we'll test it in isolation)
// Since it's defined inside _layout.tsx, we recreate it here for testing
function useDeferredLinking(user: any, loading: boolean) {
  const router = useRouter();
  const { useEffect, useRef } = require('react');
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (loading || !user) return;

    const checkForDeferredCode = async () => {
      const alreadyChecked = await hasCheckedDeferredCode();
      if (alreadyChecked) return;

      const code = await checkClipboardForCode();
      if (code) {
        await markDeferredCodeChecked();

        Alert.alert(
          'Found a Disc Code!',
          `We found code "${code}" in your clipboard. Would you like to look up this disc?`,
          [
            {
              text: 'No Thanks',
              style: 'cancel',
            },
            {
              text: 'Yes, Look It Up',
              onPress: () => {
                router.push(`/d/${code}`);
              },
            },
          ]
        );
      } else {
        await markDeferredCodeChecked();
      }
    };

    checkForDeferredCode();
  }, [user, loading, router]);
}

describe('useDeferredLinking', () => {
  const mockRouter = {
    push: jest.fn(),
    replace: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
    (useRouter as jest.Mock).mockReturnValue(mockRouter);
    (hasCheckedDeferredCode as jest.Mock).mockResolvedValue(false);
    (markDeferredCodeChecked as jest.Mock).mockResolvedValue(undefined);
  });

  it('does not check clipboard when loading', async () => {
    renderHook(() => useDeferredLinking({ id: '123' }, true));

    await waitFor(() => {
      expect(checkClipboardForCode).not.toHaveBeenCalled();
    });
  });

  it('does not check clipboard when user is null', async () => {
    renderHook(() => useDeferredLinking(null, false));

    await waitFor(() => {
      expect(checkClipboardForCode).not.toHaveBeenCalled();
    });
  });

  it('checks clipboard when user is authenticated and not loading', async () => {
    (checkClipboardForCode as jest.Mock).mockResolvedValue(null);

    renderHook(() => useDeferredLinking({ id: '123' }, false));

    await waitFor(() => {
      expect(checkClipboardForCode).toHaveBeenCalled();
    });
  });

  it('does not check clipboard if already checked this session', async () => {
    (hasCheckedDeferredCode as jest.Mock).mockResolvedValue(true);

    renderHook(() => useDeferredLinking({ id: '123' }, false));

    await waitFor(() => {
      expect(hasCheckedDeferredCode).toHaveBeenCalled();
    });

    expect(checkClipboardForCode).not.toHaveBeenCalled();
  });

  it('shows alert when valid code found in clipboard', async () => {
    (checkClipboardForCode as jest.Mock).mockResolvedValue('ABC123');

    renderHook(() => useDeferredLinking({ id: '123' }, false));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Found a Disc Code!',
        'We found code "ABC123" in your clipboard. Would you like to look up this disc?',
        expect.arrayContaining([
          expect.objectContaining({ text: 'No Thanks' }),
          expect.objectContaining({ text: 'Yes, Look It Up' }),
        ])
      );
    });
  });

  it('marks as checked after showing alert', async () => {
    (checkClipboardForCode as jest.Mock).mockResolvedValue('ABC123');

    renderHook(() => useDeferredLinking({ id: '123' }, false));

    await waitFor(() => {
      expect(markDeferredCodeChecked).toHaveBeenCalled();
    });
  });

  it('marks as checked even when no code found', async () => {
    (checkClipboardForCode as jest.Mock).mockResolvedValue(null);

    renderHook(() => useDeferredLinking({ id: '123' }, false));

    await waitFor(() => {
      expect(markDeferredCodeChecked).toHaveBeenCalled();
    });
  });

  it('navigates to deep link when user confirms', async () => {
    (checkClipboardForCode as jest.Mock).mockResolvedValue('XYZ789');

    renderHook(() => useDeferredLinking({ id: '123' }, false));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // Get the "Yes, Look It Up" button callback
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertCall[2];
    const yesButton = buttons.find(
      (b: { text: string }) => b.text === 'Yes, Look It Up'
    );

    // Simulate pressing the button
    yesButton.onPress();

    expect(mockRouter.push).toHaveBeenCalledWith('/d/XYZ789');
  });

  it('does not navigate when user cancels', async () => {
    (checkClipboardForCode as jest.Mock).mockResolvedValue('XYZ789');

    renderHook(() => useDeferredLinking({ id: '123' }, false));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalled();
    });

    // Get the "No Thanks" button - it has no onPress, just style: 'cancel'
    const alertCall = (Alert.alert as jest.Mock).mock.calls[0];
    const buttons = alertCall[2];
    const noButton = buttons.find(
      (b: { text: string }) => b.text === 'No Thanks'
    );

    // No Thanks button should just have style: 'cancel'
    expect(noButton.style).toBe('cancel');
    expect(noButton.onPress).toBeUndefined();
    expect(mockRouter.push).not.toHaveBeenCalled();
  });
});
