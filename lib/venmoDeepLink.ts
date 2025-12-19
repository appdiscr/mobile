import { Linking, Platform } from 'react-native';

/**
 * Venmo Deep Link Utility
 *
 * Opens the Venmo app (or web fallback) with pre-filled payment details.
 * Used for sending rewards when a disc is returned.
 *
 * Deep link format: venmo://paycharge?txn=pay&recipients={username}&amount={amount}&note={note}
 * Web fallback: https://venmo.com/?txn=pay&recipients={username}&amount={amount}&note={note}
 *
 * @see https://blog.alexbeals.com/posts/venmo-deeplinking
 */

export interface VenmoPaymentParams {
  /** Venmo username of the recipient (without @) */
  recipientUsername: string;
  /** Amount to pay in dollars */
  amount: number;
  /** Optional disc name to include in the note */
  discName?: string;
  /** Optional custom note (defaults to disc return message) */
  customNote?: string;
}

/**
 * Generates the payment note for Venmo
 * Includes thank you messaging to make it feel like a gift/reward
 */
export const generatePaymentNote = (discName?: string): string => {
  if (discName) {
    return `🎁 Thank you for returning my ${discName}! 🥏`;
  }
  return '🎁 Thank you for returning my disc! 🥏';
};

/**
 * Generates the Venmo app deep link URL
 * Note: For app deep links, we encode but then convert %20 back to spaces
 * as Venmo's app handles literal spaces better than encoded ones
 */
export const getVenmoAppUrl = (params: VenmoPaymentParams): string => {
  const { recipientUsername, amount, discName, customNote } = params;
  const rawNote = customNote || generatePaymentNote(discName);
  // Encode first, then replace %20 with actual spaces for the app deep link
  const note = encodeURIComponent(rawNote).replace(/%20/g, ' ');
  // Remove @ if user included it
  const username = recipientUsername.replace(/^@/, '');

  return `venmo://paycharge?txn=pay&recipients=${username}&amount=${amount}&note=${note}`;
};

/**
 * Generates the Venmo web fallback URL
 */
export const getVenmoWebUrl = (params: VenmoPaymentParams): string => {
  const { recipientUsername, amount, discName, customNote } = params;
  const note = encodeURIComponent(customNote || generatePaymentNote(discName));
  // Remove @ if user included it
  const username = recipientUsername.replace(/^@/, '');

  return `https://venmo.com/?txn=pay&recipients=${username}&amount=${amount}&note=${note}`;
};

/**
 * Checks if the Venmo app is installed on the device
 */
export const isVenmoInstalled = async (): Promise<boolean> => {
  try {
    return await Linking.canOpenURL('venmo://');
  } catch {
    return false;
  }
};

/**
 * Opens Venmo with pre-filled payment details
 * Falls back to web URL if Venmo app is not installed
 *
 * @returns true if successfully opened, false otherwise
 */
export const openVenmoPayment = async (params: VenmoPaymentParams): Promise<boolean> => {
  try {
    const venmoAppUrl = getVenmoAppUrl(params);
    const venmoWebUrl = getVenmoWebUrl(params);

    // Try to open Venmo app first
    const canOpenApp = await Linking.canOpenURL(venmoAppUrl);

    if (canOpenApp) {
      await Linking.openURL(venmoAppUrl);
      return true;
    }

    // Fall back to web URL
    const canOpenWeb = await Linking.canOpenURL(venmoWebUrl);
    if (canOpenWeb) {
      await Linking.openURL(venmoWebUrl);
      return true;
    }

    return false;
  } catch (error) {
    console.error('Error opening Venmo:', error);
    return false;
  }
};

/**
 * Validates a Venmo username format
 * Venmo usernames can contain letters, numbers, and dashes
 */
export const isValidVenmoUsername = (username: string): boolean => {
  if (!username) return false;
  // Remove @ if present
  const cleanUsername = username.replace(/^@/, '');
  // Venmo usernames: 5-30 chars, alphanumeric and dashes, no consecutive dashes
  const venmoUsernameRegex = /^[a-zA-Z0-9]([a-zA-Z0-9-]{3,28})[a-zA-Z0-9]$/;
  return venmoUsernameRegex.test(cleanUsername) && !cleanUsername.includes('--');
};

/**
 * Formats a Venmo username for display (with @)
 */
export const formatVenmoUsername = (username: string): string => {
  if (!username) return '';
  const cleanUsername = username.replace(/^@/, '');
  return `@${cleanUsername}`;
};
