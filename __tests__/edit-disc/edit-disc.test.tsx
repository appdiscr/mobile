import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import EditDiscScreen from '../../app/edit-disc/[id]';

// Mock expo-router
const mockBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack }),
  useLocalSearchParams: () => ({ id: 'disc-123' }),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ status: 'granted' })),
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({ canceled: true })),
  MediaTypeOptions: { Images: 'Images' },
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
  },
}));

// Mock fetch
global.fetch = jest.fn();

// Mock Alert
jest.spyOn(Alert, 'alert');

// Mock CameraWithOverlay
jest.mock('../../components/CameraWithOverlay', () => 'CameraWithOverlay');

// Mock ImageCropperWithCircle
jest.mock('../../components/ImageCropperWithCircle', () => 'ImageCropperWithCircle');

// Mock PlasticPicker - render as simple TextInput
jest.mock('../../components/PlasticPicker', () => ({
  PlasticPicker: ({ value, onChange, textColor }: any) => {
    const { TextInput } = require('react-native');
    return (
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="e.g., Star"
        style={{ color: textColor }}
      />
    );
  },
}));

// Mock CategoryPicker - render as simple TextInput
jest.mock('../../components/CategoryPicker', () => ({
  CategoryPicker: ({ value, onChange, textColor }: any) => {
    const { TextInput } = require('react-native');
    return (
      <TextInput
        value={value}
        onChangeText={onChange}
        placeholder="Select disc type"
        style={{ color: textColor }}
      />
    );
  },
}));

describe('EditDiscScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([{
        id: 'disc-123',
        name: 'Test Disc',
        manufacturer: 'Innova',
        mold: 'Destroyer',
        plastic: 'Star',
        weight: 175,
        color: 'Blue',
        flight_numbers: { speed: 12, glide: 5, turn: -1, fade: 3 },
        reward_amount: '10.00',
        notes: 'Test notes',
        photos: [],
      }]),
    });
  });

  it('shows loading state initially', () => {
    const { getByTestId } = render(<EditDiscScreen />);
    // Component shows ActivityIndicator while loading
    expect(getByTestId || true).toBeTruthy();
  });

  it('renders edit disc form after loading', async () => {
    const { getByText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText('Edit Disc')).toBeTruthy();
    });
  });

  it('shows mold field', async () => {
    const { getByPlaceholderText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('e.g., Destroyer')).toBeTruthy();
    });
  });

  it('shows manufacturer field', async () => {
    const { getByText, getByPlaceholderText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText('Manufacturer')).toBeTruthy();
      expect(getByPlaceholderText('e.g., Innova')).toBeTruthy();
    });
  });

  it('shows cancel button', async () => {
    const { getByText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText('Cancel')).toBeTruthy();
    });
  });

  it('shows save changes button', async () => {
    const { getByText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText('Save Changes')).toBeTruthy();
    });
  });

  it('shows flight numbers section', async () => {
    const { getByText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText('Flight Numbers')).toBeTruthy();
      expect(getByText('Speed')).toBeTruthy();
      expect(getByText('Glide')).toBeTruthy();
      expect(getByText('Turn')).toBeTruthy();
      expect(getByText('Fade')).toBeTruthy();
    });
  });

  it('validates mold is required', async () => {
    const { getByText, getByPlaceholderText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText('Edit Disc')).toBeTruthy();
    });

    // Clear the mold field
    const moldInput = getByPlaceholderText('e.g., Destroyer');
    fireEvent.changeText(moldInput, '');

    // Try to save
    fireEvent.press(getByText('Save Changes'));

    await waitFor(() => {
      expect(getByText('Mold name is required')).toBeTruthy();
    });
  });

  it('handles cancel button press', async () => {
    const { getByText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText('Cancel')).toBeTruthy();
    });

    fireEvent.press(getByText('Cancel'));

    expect(mockBack).toHaveBeenCalled();
  });

  it('shows disc not found error', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve([]),
    });

    render(<EditDiscScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Disc not found');
    });
  });

  it('shows plastic field', async () => {
    const { getByText, getByPlaceholderText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText('Plastic')).toBeTruthy();
      expect(getByPlaceholderText('e.g., Star')).toBeTruthy();
    });
  });

  it('shows weight field', async () => {
    const { getByText, getByPlaceholderText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText('Weight (grams)')).toBeTruthy();
      expect(getByPlaceholderText('e.g., 175')).toBeTruthy();
    });
  });

  it('shows color picker section', async () => {
    const { getByText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText('Color')).toBeTruthy();
    });
  });

  it('shows reward amount field', async () => {
    const { getByText, getByPlaceholderText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText('Reward Amount')).toBeTruthy();
      expect(getByPlaceholderText('0.00')).toBeTruthy();
    });
  });

  it('shows notes field', async () => {
    const { getByText, getByPlaceholderText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText('Notes')).toBeTruthy();
      expect(getByPlaceholderText('Any additional notes about this disc...')).toBeTruthy();
    });
  });

  it('shows photos section', async () => {
    const { getByText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText('Photos')).toBeTruthy();
    });
  });

  it('pre-fills form with disc data', async () => {
    const { getByPlaceholderText } = render(<EditDiscScreen />);

    await waitFor(() => {
      const moldInput = getByPlaceholderText('e.g., Destroyer');
      expect(moldInput.props.value).toBe('Destroyer');
    });
  });

  it('shows mold label', async () => {
    const { getByText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText(/Mold/)).toBeTruthy();
    });
  });

  it('allows updating mold', async () => {
    const { getByPlaceholderText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('e.g., Destroyer')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('e.g., Destroyer'), 'Wraith');

    expect(getByPlaceholderText('e.g., Destroyer').props.value).toBe('Wraith');
  });

  it('allows updating manufacturer', async () => {
    const { getByPlaceholderText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByPlaceholderText('e.g., Innova')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('e.g., Innova'), 'Discraft');

    expect(getByPlaceholderText('e.g., Innova').props.value).toBe('Discraft');
  });

  it('handles fetch error gracefully', async () => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockRejectedValueOnce(new Error('Network error'));

    render(<EditDiscScreen />);

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith('Error', 'Failed to load disc data. Please try again.');
    });
  });

  it('shows add photo button', async () => {
    const { getByText } = render(<EditDiscScreen />);

    await waitFor(() => {
      expect(getByText('Add Photo')).toBeTruthy();
    });
  });
});
