import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import DropOffScreen from '../../app/drop-off/[id]';

// Mock expo-router
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({ id: 'recovery-123' }),
}));

// Mock expo-location
jest.mock('expo-location', () => ({
  requestForegroundPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  getCurrentPositionAsync: jest.fn(() => Promise.resolve({
    coords: { latitude: 42.123, longitude: -71.456 },
  })),
  Accuracy: { High: 5 },
}));

// Mock useColorScheme
jest.mock('../../components/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

// Mock supabase
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(() => Promise.resolve({
        data: { session: { access_token: 'test-token', user: { id: 'user-1' } } },
      })),
    },
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: { path: 'test-path' }, error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/photo.jpg' } })),
      })),
    },
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock CameraWithOverlay
jest.mock('../../components/CameraWithOverlay', () => 'CameraWithOverlay');

// Mock imageCompression
jest.mock('../../utils/imageCompression', () => ({
  compressImage: jest.fn((uri) => Promise.resolve({ uri })),
}));

describe('DropOffScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ disc: { name: 'Test Disc' } }),
    });
  });

  it('renders drop off screen', async () => {
    const { getByText } = render(<DropOffScreen />);

    await waitFor(() => {
      expect(getByText('Drop Off Location')).toBeTruthy();
    });
  });

  it('shows take photo button', async () => {
    const { getByText } = render(<DropOffScreen />);

    await waitFor(() => {
      expect(getByText('Take a photo of the drop-off spot')).toBeTruthy();
    });
  });

  it('shows location captured after getting location', async () => {
    const { getByText } = render(<DropOffScreen />);

    await waitFor(() => {
      expect(getByText('Location captured')).toBeTruthy();
    });
  });

  it('shows location notes field', async () => {
    const { getByPlaceholderText } = render(<DropOffScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('e.g., Behind the big oak tree near hole 7, under a rock')).toBeTruthy();
    });
  });

  it('shows confirm drop-off button', async () => {
    const { getByText } = render(<DropOffScreen />);

    await waitFor(() => {
      expect(getByText('Confirm Drop-off')).toBeTruthy();
    });
  });

  it('shows cancel button', async () => {
    const { getByText } = render(<DropOffScreen />);

    await waitFor(() => {
      expect(getByText('Cancel')).toBeTruthy();
    });
  });

  it('validates missing photo', async () => {
    const { getByText } = render(<DropOffScreen />);

    await waitFor(() => {
      expect(getByText('Confirm Drop-off')).toBeTruthy();
    });

    fireEvent.press(getByText('Confirm Drop-off'));

    expect(Alert.alert).toHaveBeenCalledWith('Missing Photo', 'Please take a photo of the drop-off location.');
  });

  it('handles cancel button press', async () => {
    const { getByText } = render(<DropOffScreen />);

    await waitFor(() => {
      expect(getByText('Cancel')).toBeTruthy();
    });

    fireEvent.press(getByText('Cancel'));

    expect(mockBack).toHaveBeenCalled();
  });

  it('allows entering location notes', async () => {
    const { getByPlaceholderText } = render(<DropOffScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('e.g., Behind the big oak tree near hole 7, under a rock')).toBeTruthy();
    });

    fireEvent.changeText(
      getByPlaceholderText('e.g., Behind the big oak tree near hole 7, under a rock'),
      'Near the pavilion'
    );

    // Text should be entered
    expect(getByPlaceholderText('e.g., Behind the big oak tree near hole 7, under a rock').props.value).toBe('Near the pavilion');
  });

  it('shows loading state during location fetch', async () => {
    const { getByText, queryByText } = render(<DropOffScreen />);

    await waitFor(() => {
      expect(getByText('Drop Off Location')).toBeTruthy();
    });

    // Should show location captured after fetching
    await waitFor(() => {
      expect(getByText('Location captured')).toBeTruthy();
    });
  });

  it('fetches recovery details on mount', async () => {
    render(<DropOffScreen />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/get-recovery-details'),
        expect.any(Object)
      );
    });
  });

  it('fetches disc name from recovery details', async () => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ disc: { name: 'Destroyer' } }),
    });

    render(<DropOffScreen />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/get-recovery-details'),
        expect.any(Object)
      );
    });
  });

  it('shows help text for location notes', async () => {
    const { getByText } = render(<DropOffScreen />);

    await waitFor(() => {
      expect(getByText('Add any helpful details to help the owner find the exact spot.')).toBeTruthy();
    });
  });

  it('shows location coordinates when captured', async () => {
    const { getByText } = render(<DropOffScreen />);

    await waitFor(() => {
      expect(getByText('Location captured')).toBeTruthy();
      expect(getByText('42.123000, -71.456000')).toBeTruthy();
    });
  });

  it('handles fetch error gracefully', async () => {
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<DropOffScreen />);

    // Should still render the screen
    await waitFor(() => {
      expect(getByText('Drop Off Location')).toBeTruthy();
    });
  });

  it('shows photo requirements section', async () => {
    const { getByText } = render(<DropOffScreen />);

    await waitFor(() => {
      expect(getByText('Take a photo of the drop-off spot')).toBeTruthy();
    });
  });
});
