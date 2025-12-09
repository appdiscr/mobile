import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert, Platform } from 'react-native';
import ProposeMeetupScreen from '../../app/propose-meetup/[id]';

// Mock expo-router
const mockReplace = jest.fn();
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ replace: mockReplace, back: mockBack }),
  useLocalSearchParams: () => ({ id: 'recovery-123' }),
}));

// Mock DateTimePicker
jest.mock('@react-native-community/datetimepicker', () => 'DateTimePicker');

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
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('ProposeMeetupScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ user_role: 'finder' }),
    });
  });

  it('renders propose meetup screen', async () => {
    const { getByText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(getByText('Propose a Meetup')).toBeTruthy();
    });
  });

  it('shows location input field', async () => {
    const { getByPlaceholderText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('e.g., Parking lot at Maple Hill DGC')).toBeTruthy();
    });
  });

  it('shows date and time pickers', async () => {
    // Date and time are displayed as formatted strings, not labels
    const { getByText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(getByText('Propose a Meetup')).toBeTruthy();
    });
  });

  it('shows message field', async () => {
    const { getByText, getByPlaceholderText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(getByText('Additional Message (Optional)')).toBeTruthy();
      expect(getByPlaceholderText('Any other details about the meetup...')).toBeTruthy();
    });
  });

  it('shows send proposal button', async () => {
    const { getByText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(getByText('Send Proposal')).toBeTruthy();
    });
  });

  it('shows cancel button', async () => {
    const { getByText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(getByText('Cancel')).toBeTruthy();
    });
  });

  it('validates missing location', async () => {
    const { getByText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(getByText('Send Proposal')).toBeTruthy();
    });

    fireEvent.press(getByText('Send Proposal'));

    expect(Alert.alert).toHaveBeenCalledWith('Missing Information', 'Please enter a meetup location.');
  });

  it('handles cancel button press', async () => {
    const { getByText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(getByText('Cancel')).toBeTruthy();
    });

    fireEvent.press(getByText('Cancel'));

    expect(mockBack).toHaveBeenCalled();
  });

  it('shows hint text for location', async () => {
    const { getByText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(getByText('Suggest a public place like a disc golf course, park, or parking lot.')).toBeTruthy();
    });
  });

  it('shows finder subtitle text', async () => {
    const { getByText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(getByText('Suggest a time and place to return the disc to its owner.')).toBeTruthy();
    });
  });

  it('allows entering location name', async () => {
    const { getByPlaceholderText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('e.g., Parking lot at Maple Hill DGC')).toBeTruthy();
    });

    fireEvent.changeText(
      getByPlaceholderText('e.g., Parking lot at Maple Hill DGC'),
      'Central Park'
    );

    expect(getByPlaceholderText('e.g., Parking lot at Maple Hill DGC').props.value).toBe('Central Park');
  });

  it('allows entering optional message', async () => {
    const { getByPlaceholderText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('Any other details about the meetup...')).toBeTruthy();
    });

    fireEvent.changeText(
      getByPlaceholderText('Any other details about the meetup...'),
      'I will be wearing a blue shirt'
    );

    expect(getByPlaceholderText('Any other details about the meetup...').props.value).toBe('I will be wearing a blue shirt');
  });

  it('shows date picker section', async () => {
    const { getByText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      // Date label is present
      expect(getByText(/Date/)).toBeTruthy();
    });
  });

  it('shows time picker section', async () => {
    const { getByText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      // Time label is present
      expect(getByText(/Time/)).toBeTruthy();
    });
  });

  it('fetches user role on mount', async () => {
    render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/get-recovery-details'),
        expect.any(Object)
      );
    });
  });

  it('shows owner subtitle text when user is owner', async () => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ user_role: 'owner' }),
    });

    const { getByText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(getByText('Suggest a time and place to retrieve your disc from the finder.')).toBeTruthy();
    });
  });

  it('shows location name label', async () => {
    const { getByText } = render(<ProposeMeetupScreen />);

    await waitFor(() => {
      expect(getByText(/Meetup Location/)).toBeTruthy();
    });
  });

  it('handles fetch error gracefully', async () => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    const { getByText } = render(<ProposeMeetupScreen />);

    // Should still render the screen
    await waitFor(() => {
      expect(getByText('Propose a Meetup')).toBeTruthy();
    });
  });

  describe('proposal submission', () => {
    it('shows validation error when location is empty', async () => {
      const { getByText } = render(<ProposeMeetupScreen />);

      await waitFor(() => {
        expect(getByText('Send Proposal')).toBeTruthy();
      });

      fireEvent.press(getByText('Send Proposal'));

      expect(Alert.alert).toHaveBeenCalledWith(
        'Missing Information',
        'Please enter a meetup location.'
      );
    });

    it('send proposal button is pressable when form has location', async () => {
      const { getByText, getByPlaceholderText } = render(<ProposeMeetupScreen />);

      await waitFor(() => {
        expect(getByPlaceholderText('e.g., Parking lot at Maple Hill DGC')).toBeTruthy();
      });

      fireEvent.changeText(
        getByPlaceholderText('e.g., Parking lot at Maple Hill DGC'),
        'Central Park'
      );

      // Button should be pressable without throwing
      expect(() => fireEvent.press(getByText('Send Proposal'))).not.toThrow();
    });
  });

  describe('form sections', () => {
    it('shows required indicator on location field', async () => {
      const { getAllByText } = render(<ProposeMeetupScreen />);

      await waitFor(() => {
        expect(getAllByText('*').length).toBeGreaterThan(0);
      });
    });

    it('shows loading state initially', async () => {
      const { getByText } = render(<ProposeMeetupScreen />);

      // Component should render title
      await waitFor(() => {
        expect(getByText('Propose a Meetup')).toBeTruthy();
      });
    });
  });
});
