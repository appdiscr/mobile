import React from 'react';
import { render, fireEvent } from '@testing-library/react-native';
import HomeScreen from '../../app/(tabs)/index';

// Mock useAuth
const mockUser = { email: 'test@example.com' };
jest.mock('../../contexts/AuthContext', () => ({
  useAuth: jest.fn(() => ({ user: null })),
}));

// Mock expo-router
const mockPush = jest.fn();
jest.mock('expo-router', () => ({
  useRouter: () => ({ push: mockPush }),
}));

const { useAuth } = require('../../contexts/AuthContext');

describe('HomeScreen', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders welcome message', () => {
    useAuth.mockReturnValue({ user: null });
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Welcome to Discr!')).toBeTruthy();
    expect(getByText('Never lose your favorite disc again. Track your collection and help others find their lost discs.')).toBeTruthy();
  });

  it('displays user email when logged in', () => {
    useAuth.mockReturnValue({ user: mockUser });
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Welcome to Discr!')).toBeTruthy();
    expect(getByText('test@example.com')).toBeTruthy();
  });

  it('does not display email when not logged in', () => {
    useAuth.mockReturnValue({ user: null });
    const { queryByText } = render(<HomeScreen />);

    expect(queryByText('test@example.com')).toBeNull();
  });

  it('shows order stickers card', () => {
    useAuth.mockReturnValue({ user: mockUser });
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Protect Your Discs')).toBeTruthy();
    expect(getByText(/Get QR code stickers/)).toBeTruthy();
  });

  it('navigates to order stickers when card is pressed', () => {
    useAuth.mockReturnValue({ user: mockUser });
    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText('Protect Your Discs'));

    expect(mockPush).toHaveBeenCalledWith('/order-stickers');
  });

  it('shows Add Disc quick action', () => {
    useAuth.mockReturnValue({ user: mockUser });
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Add Disc')).toBeTruthy();
  });

  it('navigates to add-disc when pressed', () => {
    useAuth.mockReturnValue({ user: mockUser });
    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText('Add Disc'));

    expect(mockPush).toHaveBeenCalledWith('/add-disc');
  });

  it('shows My Orders quick action', () => {
    useAuth.mockReturnValue({ user: mockUser });
    const { getByText } = render(<HomeScreen />);

    expect(getByText('My Orders')).toBeTruthy();
  });

  it('navigates to my-orders when pressed', () => {
    useAuth.mockReturnValue({ user: mockUser });
    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText('My Orders'));

    expect(mockPush).toHaveBeenCalledWith('/my-orders');
  });

  it('shows Found Disc quick action', () => {
    useAuth.mockReturnValue({ user: mockUser });
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Found Disc')).toBeTruthy();
  });

  it('navigates to found-disc when pressed', () => {
    useAuth.mockReturnValue({ user: mockUser });
    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText('Found Disc'));

    expect(mockPush).toHaveBeenCalledWith('/(tabs)/found-disc');
  });

  it('shows Link Sticker quick action', () => {
    useAuth.mockReturnValue({ user: mockUser });
    const { getByText } = render(<HomeScreen />);

    expect(getByText('Link Sticker')).toBeTruthy();
  });

  it('navigates to link-sticker when pressed', () => {
    useAuth.mockReturnValue({ user: mockUser });
    const { getByText } = render(<HomeScreen />);

    fireEvent.press(getByText('Link Sticker'));

    expect(mockPush).toHaveBeenCalledWith('/link-sticker');
  });
});
