import * as ImageManipulator from 'expo-image-manipulator';
import { Image } from 'react-native';

export const DEFAULT_MAX_DIMENSION = 1920;
export const DEFAULT_COMPRESSION_QUALITY = 0.8;

export interface CompressedImage {
  uri: string;
  width: number;
  height: number;
}

export interface CompressionOptions {
  maxDimension?: number;
  quality?: number;
}

/**
 * Get the dimensions of an image from its URI
 */
export function getImageDimensions(
  uri: string
): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    Image.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      (error) => reject(error)
    );
  });
}

/**
 * Calculate the resize dimensions to fit within maxDimension while
 * maintaining aspect ratio.
 * Returns null if no resize is needed.
 */
export function calculateResizeDimensions(
  width: number,
  height: number,
  maxDimension: number
): { width: number; height: number } | null {
  const longestSide = Math.max(width, height);

  if (longestSide <= maxDimension) {
    return null;
  }

  const scale = maxDimension / longestSide;
  return {
    width: Math.round(width * scale),
    height: Math.round(height * scale),
  };
}

/**
 * Compress and optionally resize an image.
 * - Resizes to max 1920px on longest side (configurable)
 * - Compresses to 80% JPEG quality (configurable)
 */
export async function compressImage(
  uri: string,
  options: CompressionOptions = {}
): Promise<CompressedImage> {
  const {
    maxDimension = DEFAULT_MAX_DIMENSION,
    quality = DEFAULT_COMPRESSION_QUALITY,
  } = options;

  const { width, height } = await getImageDimensions(uri);
  const resizeDimensions = calculateResizeDimensions(width, height, maxDimension);

  const actions: ImageManipulator.Action[] = [];
  if (resizeDimensions) {
    actions.push({ resize: resizeDimensions });
  }

  const result = await ImageManipulator.manipulateAsync(uri, actions, {
    compress: quality,
    format: ImageManipulator.SaveFormat.JPEG,
  });

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
  };
}
