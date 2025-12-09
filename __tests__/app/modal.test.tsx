import React from 'react';
import { render } from '@testing-library/react-native';
import ModalScreen from '../../app/modal';

// Mock expo-status-bar
jest.mock('expo-status-bar', () => ({
  StatusBar: () => null,
}));

// Mock EditScreenInfo component
jest.mock('../../components/EditScreenInfo', () => 'EditScreenInfo');

describe('ModalScreen', () => {
  it('renders modal title', () => {
    const { getByText } = render(<ModalScreen />);

    expect(getByText('Modal')).toBeTruthy();
  });

  it('renders correctly', () => {
    const { UNSAFE_root } = render(<ModalScreen />);

    expect(UNSAFE_root).toBeTruthy();
  });
});
