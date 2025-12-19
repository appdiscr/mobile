import React from 'react';
import { render, waitFor, fireEvent } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AddDiscScreen from '../../app/add-disc';

// Mock expo-router
const mockRouterBack = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({
    back: mockRouterBack,
  }),
}));

// Mock expo-image-picker
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: jest.fn(),
  launchImageLibraryAsync: jest.fn(),
  MediaTypeOptions: { Images: 'Images' },
}));

// Mock supabase
const mockGetSession = jest.fn();
jest.mock('../../lib/supabase', () => ({
  supabase: {
    auth: {
      getSession: () => mockGetSession(),
    },
  },
}));

// Mock useColorScheme
jest.mock('../../components/useColorScheme', () => ({
  useColorScheme: () => 'light',
}));

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

// Mock fetch
global.fetch = jest.fn();

// Mock Alert
jest.spyOn(Alert, 'alert');

describe('AddDiscScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockGetSession.mockResolvedValue({
      data: { session: { access_token: 'test-token' } },
    });
  });

  it('renders form correctly', () => {
    const { getByText, getByPlaceholderText } = render(<AddDiscScreen />);

    expect(getByText('Add Disc to Your Bag')).toBeTruthy();
    expect(getByText('Manufacturer')).toBeTruthy();
    expect(getByText('Plastic')).toBeTruthy();
    expect(getByText('Weight (grams)')).toBeTruthy();
    expect(getByText('Color')).toBeTruthy();
    expect(getByText('Flight Numbers')).toBeTruthy();
    expect(getByPlaceholderText('e.g., Destroyer')).toBeTruthy();
    expect(getByPlaceholderText('e.g., Innova')).toBeTruthy();
    expect(getByPlaceholderText('e.g., Star')).toBeTruthy();
  });

  it('shows validation error when mold is empty', async () => {
    const { getByText } = render(<AddDiscScreen />);

    fireEvent.press(getByText('Save Disc'));

    await waitFor(() => {
      expect(getByText('Mold name is required')).toBeTruthy();
    });
  });

  it('clears mold error when user types', async () => {
    const { getByText, getByPlaceholderText, queryByText } = render(<AddDiscScreen />);

    fireEvent.press(getByText('Save Disc'));

    await waitFor(() => {
      expect(getByText('Mold name is required')).toBeTruthy();
    });

    fireEvent.changeText(getByPlaceholderText('e.g., Destroyer'), 'Destroyer');

    await waitFor(() => {
      expect(queryByText('Mold name is required')).toBeNull();
    });
  });

  it('creates disc successfully with minimal data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'new-disc-id' }),
    });

    const { getByText, getByPlaceholderText } = render(<AddDiscScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g., Destroyer'), 'Destroyer');
    fireEvent.press(getByText('Save Disc'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/functions/v1/create-disc'),
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            Authorization: 'Bearer test-token',
          }),
        })
      );
    });

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Success',
        'Disc added to your bag!',
        expect.any(Array)
      );
    });
  });

  it('creates disc with full data', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'new-disc-id' }),
    });

    const { getByText, getByPlaceholderText } = render(<AddDiscScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g., Destroyer'), 'Destroyer');
    fireEvent.changeText(getByPlaceholderText('e.g., Innova'), 'Innova');
    fireEvent.changeText(getByPlaceholderText('e.g., Star'), 'Star');
    fireEvent.changeText(getByPlaceholderText('e.g., 175'), '175');
    fireEvent.press(getByText('Save Disc'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.mold).toBe('Destroyer');
      expect(callBody.manufacturer).toBe('Innova');
      expect(callBody.plastic).toBe('Star');
      expect(callBody.weight).toBe(175);
    });
  });

  it('shows error when not signed in', async () => {
    mockGetSession.mockResolvedValue({
      data: { session: null },
    });

    const { getByText, getByPlaceholderText } = render(<AddDiscScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g., Destroyer'), 'Destroyer');
    fireEvent.press(getByText('Save Disc'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'Error',
        'You must be signed in to add a disc'
      );
    });
  });

  it('shows error on API failure', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: false,
      status: 500,
      json: () => Promise.resolve({ error: 'Server error' }),
    });

    const { getByText, getByPlaceholderText } = render(<AddDiscScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g., Destroyer'), 'Destroyer');
    fireEvent.press(getByText('Save Disc'));

    await waitFor(() => {
      expect(Alert.alert).toHaveBeenCalledWith(
        'API Error',
        expect.stringContaining('Status: 500'),
        expect.any(Array)
      );
    });
  });

  it('displays color options', () => {
    const { getByText } = render(<AddDiscScreen />);

    expect(getByText('Red')).toBeTruthy();
    expect(getByText('Orange')).toBeTruthy();
    expect(getByText('Yellow')).toBeTruthy();
    expect(getByText('Green')).toBeTruthy();
    expect(getByText('Blue')).toBeTruthy();
    expect(getByText('Purple')).toBeTruthy();
    expect(getByText('Pink')).toBeTruthy();
    expect(getByText('White')).toBeTruthy();
    expect(getByText('Black')).toBeTruthy();
    expect(getByText('Gray')).toBeTruthy();
    expect(getByText('Multi')).toBeTruthy();
  });

  it('selects color when pressed', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'new-disc-id' }),
    });

    const { getByText, getByPlaceholderText } = render(<AddDiscScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g., Destroyer'), 'Destroyer');
    fireEvent.press(getByText('Blue'));
    fireEvent.press(getByText('Save Disc'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.color).toBe('Blue');
    });
  });

  it('displays flight number inputs', () => {
    const { getByText, getByPlaceholderText } = render(<AddDiscScreen />);

    expect(getByText('Speed')).toBeTruthy();
    expect(getByText('Glide')).toBeTruthy();
    expect(getByText('Turn')).toBeTruthy();
    expect(getByText('Fade')).toBeTruthy();
    expect(getByPlaceholderText('1-15')).toBeTruthy();
    expect(getByPlaceholderText('1-7')).toBeTruthy();
  });

  it('saves flight numbers correctly', async () => {
    (global.fetch as jest.Mock).mockResolvedValueOnce({
      ok: true,
      json: () => Promise.resolve({ id: 'new-disc-id' }),
    });

    const { getByText, getByPlaceholderText } = render(<AddDiscScreen />);

    fireEvent.changeText(getByPlaceholderText('e.g., Destroyer'), 'Destroyer');
    fireEvent.changeText(getByPlaceholderText('1-15'), '12');
    fireEvent.changeText(getByPlaceholderText('1-7'), '5');
    fireEvent.press(getByText('Save Disc'));

    await waitFor(() => {
      expect(global.fetch).toHaveBeenCalled();
      const callBody = JSON.parse((global.fetch as jest.Mock).mock.calls[0][1].body);
      expect(callBody.flight_numbers.speed).toBe(12);
      expect(callBody.flight_numbers.glide).toBe(5);
    });
  });

  it('shows add photos section', () => {
    const { getByText } = render(<AddDiscScreen />);

    expect(getByText('Photos (Optional)')).toBeTruthy();
    expect(getByText('Add Photo')).toBeTruthy();
    expect(getByText('You can add up to 4 photos per disc')).toBeTruthy();
  });

  it('displays reward amount input', () => {
    const { getByText, getByPlaceholderText } = render(<AddDiscScreen />);

    expect(getByText('Reward Amount')).toBeTruthy();
    expect(getByPlaceholderText('0.00')).toBeTruthy();
  });

  it('displays notes input', () => {
    const { getByText, getByPlaceholderText } = render(<AddDiscScreen />);

    expect(getByText('Notes')).toBeTruthy();
    expect(getByPlaceholderText('Any additional notes about this disc...')).toBeTruthy();
  });

  it('displays mold label with required asterisk', () => {
    const { getByText } = render(<AddDiscScreen />);

    expect(getByText(/Mold/)).toBeTruthy();
  });

  it('allows entering weight value', () => {
    const { getByPlaceholderText } = render(<AddDiscScreen />);

    const weightInput = getByPlaceholderText('e.g., 175');
    fireEvent.changeText(weightInput, '168');

    expect(weightInput.props.value).toBe('168');
  });

  it('allows entering notes', () => {
    const { getByPlaceholderText } = render(<AddDiscScreen />);

    const notesInput = getByPlaceholderText('Any additional notes about this disc...');
    fireEvent.changeText(notesInput, 'My favorite driver');

    expect(notesInput.props.value).toBe('My favorite driver');
  });

  it('allows entering reward amount', () => {
    const { getByPlaceholderText } = render(<AddDiscScreen />);

    const rewardInput = getByPlaceholderText('0.00');
    fireEvent.changeText(rewardInput, '15.00');

    expect(rewardInput.props.value).toBe('15.00');
  });

  it('shows cancel button', () => {
    const { getByText } = render(<AddDiscScreen />);

    expect(getByText('Cancel')).toBeTruthy();
  });

  it('navigates back when cancel is pressed', () => {
    const { getByText } = render(<AddDiscScreen />);

    fireEvent.press(getByText('Cancel'));

    expect(mockRouterBack).toHaveBeenCalled();
  });

  it('shows save button', () => {
    const { getByText } = render(<AddDiscScreen />);

    expect(getByText('Save Disc')).toBeTruthy();
  });
});
