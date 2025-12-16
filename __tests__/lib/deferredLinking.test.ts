import * as Clipboard from 'expo-clipboard';
import AsyncStorage from '@react-native-async-storage/async-storage';

import {
  isValidAceBackCode,
  checkClipboardForCode,
  hasCheckedDeferredCode,
  markDeferredCodeChecked,
  storeDeferredCode,
  getAndClearDeferredCode,
  clearDeferredLinkingState,
} from '@/lib/deferredLinking';

// Mock expo-clipboard
jest.mock('expo-clipboard', () => ({
  hasStringAsync: jest.fn(),
  getStringAsync: jest.fn(),
}));

// Mock AsyncStorage
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  multiRemove: jest.fn(),
}));

describe('deferredLinking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('isValidAceBackCode', () => {
    it('returns true for valid 6-character uppercase code', () => {
      expect(isValidAceBackCode('ABC123')).toBe(true);
    });

    it('returns true for valid 8-character uppercase code', () => {
      expect(isValidAceBackCode('ABCD1234')).toBe(true);
    });

    it('returns true for valid 7-character code', () => {
      expect(isValidAceBackCode('ABC1234')).toBe(true);
    });

    it('converts lowercase to uppercase and validates', () => {
      expect(isValidAceBackCode('abc123')).toBe(true);
    });

    it('returns false for code shorter than 6 characters', () => {
      expect(isValidAceBackCode('ABC12')).toBe(false);
    });

    it('returns false for code longer than 8 characters', () => {
      expect(isValidAceBackCode('ABCDE12345')).toBe(false);
    });

    it('returns false for empty string', () => {
      expect(isValidAceBackCode('')).toBe(false);
    });

    it('returns false for null/undefined', () => {
      expect(isValidAceBackCode(null as unknown as string)).toBe(false);
      expect(isValidAceBackCode(undefined as unknown as string)).toBe(false);
    });

    it('returns false for code with special characters', () => {
      expect(isValidAceBackCode('ABC-12')).toBe(false);
      expect(isValidAceBackCode('ABC_12')).toBe(false);
    });

    it('trims whitespace before validating', () => {
      expect(isValidAceBackCode('  ABC123  ')).toBe(true);
    });
  });

  describe('checkClipboardForCode', () => {
    it('returns null when clipboard is empty', async () => {
      (Clipboard.hasStringAsync as jest.Mock).mockResolvedValue(false);

      const result = await checkClipboardForCode();

      expect(result).toBeNull();
    });

    it('returns null when clipboard has no string', async () => {
      (Clipboard.hasStringAsync as jest.Mock).mockResolvedValue(true);
      (Clipboard.getStringAsync as jest.Mock).mockResolvedValue('');

      const result = await checkClipboardForCode();

      expect(result).toBeNull();
    });

    it('returns uppercase code when clipboard contains valid code', async () => {
      (Clipboard.hasStringAsync as jest.Mock).mockResolvedValue(true);
      (Clipboard.getStringAsync as jest.Mock).mockResolvedValue('abc123');

      const result = await checkClipboardForCode();

      expect(result).toBe('ABC123');
    });

    it('extracts code from AceBack URL in clipboard', async () => {
      (Clipboard.hasStringAsync as jest.Mock).mockResolvedValue(true);
      (Clipboard.getStringAsync as jest.Mock).mockResolvedValue(
        'https://aceback.app/d/XYZ789'
      );

      const result = await checkClipboardForCode();

      expect(result).toBe('XYZ789');
    });

    it('extracts code from URL with lowercase', async () => {
      (Clipboard.hasStringAsync as jest.Mock).mockResolvedValue(true);
      (Clipboard.getStringAsync as jest.Mock).mockResolvedValue(
        'https://aceback.app/d/xyz789'
      );

      const result = await checkClipboardForCode();

      expect(result).toBe('XYZ789');
    });

    it('returns null for invalid content', async () => {
      (Clipboard.hasStringAsync as jest.Mock).mockResolvedValue(true);
      (Clipboard.getStringAsync as jest.Mock).mockResolvedValue(
        'random text that is not a code'
      );

      const result = await checkClipboardForCode();

      expect(result).toBeNull();
    });

    it('returns null on clipboard error', async () => {
      (Clipboard.hasStringAsync as jest.Mock).mockRejectedValue(
        new Error('Clipboard access denied')
      );

      const result = await checkClipboardForCode();

      expect(result).toBeNull();
    });
  });

  describe('hasCheckedDeferredCode', () => {
    it('returns false when not checked yet', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await hasCheckedDeferredCode();

      expect(result).toBe(false);
      expect(AsyncStorage.getItem).toHaveBeenCalledWith(
        'aceback_deferred_code_checked'
      );
    });

    it('returns true when already checked', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('true');

      const result = await hasCheckedDeferredCode();

      expect(result).toBe(true);
    });

    it('returns false on storage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const result = await hasCheckedDeferredCode();

      expect(result).toBe(false);
    });
  });

  describe('markDeferredCodeChecked', () => {
    it('sets checked flag in storage', async () => {
      await markDeferredCodeChecked();

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'aceback_deferred_code_checked',
        'true'
      );
    });

    it('does not throw on storage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(markDeferredCodeChecked()).resolves.not.toThrow();
    });
  });

  describe('storeDeferredCode', () => {
    it('stores uppercase code in storage', async () => {
      await storeDeferredCode('abc123');

      expect(AsyncStorage.setItem).toHaveBeenCalledWith(
        'aceback_deferred_code',
        'ABC123'
      );
    });

    it('does not throw on storage error', async () => {
      (AsyncStorage.setItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(storeDeferredCode('ABC123')).resolves.not.toThrow();
    });
  });

  describe('getAndClearDeferredCode', () => {
    it('returns stored code and clears it', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue('ABC123');

      const result = await getAndClearDeferredCode();

      expect(result).toBe('ABC123');
      expect(AsyncStorage.removeItem).toHaveBeenCalledWith(
        'aceback_deferred_code'
      );
    });

    it('returns null when no code stored', async () => {
      (AsyncStorage.getItem as jest.Mock).mockResolvedValue(null);

      const result = await getAndClearDeferredCode();

      expect(result).toBeNull();
      expect(AsyncStorage.removeItem).not.toHaveBeenCalled();
    });

    it('returns null on storage error', async () => {
      (AsyncStorage.getItem as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      const result = await getAndClearDeferredCode();

      expect(result).toBeNull();
    });
  });

  describe('clearDeferredLinkingState', () => {
    it('removes all deferred linking keys from storage', async () => {
      await clearDeferredLinkingState();

      expect(AsyncStorage.multiRemove).toHaveBeenCalledWith([
        'aceback_deferred_code',
        'aceback_deferred_code_checked',
      ]);
    });

    it('does not throw on storage error', async () => {
      (AsyncStorage.multiRemove as jest.Mock).mockRejectedValue(
        new Error('Storage error')
      );

      await expect(clearDeferredLinkingState()).resolves.not.toThrow();
    });
  });
});
