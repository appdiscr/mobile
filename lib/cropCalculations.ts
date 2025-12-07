/**
 * Crop calculation utilities for circular image cropping
 */

export interface ImageDimensions {
  width: number;
  height: number;
}

export interface CropTransforms {
  scale: number;
  translateX: number;
  translateY: number;
}

export interface CropRegion {
  originX: number;
  originY: number;
  width: number;
  height: number;
}

export interface CropCalculationParams {
  originalImage: ImageDimensions;
  containerSize: number;
  circleSize: number;
  userTransforms: CropTransforms;
}

export interface CropCalculationResult {
  cropRegion: CropRegion;
  displaySize: ImageDimensions;
  offset: { x: number; y: number };
  scaleFactor: number;
}

/**
 * Calculate how an image is displayed with resizeMode="cover"
 * Cover mode: image scales to cover the container, larger dimension overflows
 */
export function calculateCoverModeDisplay(
  imageWidth: number,
  imageHeight: number,
  containerSize: number
): { displayWidth: number; displayHeight: number; offsetX: number; offsetY: number; scaleFactor: number } {
  const imageAspect = imageWidth / imageHeight;
  const containerAspect = 1; // Square container

  if (imageAspect > containerAspect) {
    // Image is wider (landscape) - scale to fit height, width overflows
    const displayHeight = containerSize;
    const displayWidth = containerSize * imageAspect;
    const offsetX = (containerSize - displayWidth) / 2; // Negative, centers the overflow
    const offsetY = 0;
    const scaleFactor = imageHeight / displayHeight; // Use height scale for landscape

    return { displayWidth, displayHeight, offsetX, offsetY, scaleFactor };
  } else {
    // Image is taller (portrait) - scale to fit width, height overflows
    const displayWidth = containerSize;
    const displayHeight = containerSize / imageAspect;
    const offsetX = 0;
    const offsetY = (containerSize - displayHeight) / 2; // Negative, centers the overflow
    const scaleFactor = imageWidth / displayWidth; // Use width scale for portrait

    return { displayWidth, displayHeight, offsetX, offsetY, scaleFactor };
  }
}

/**
 * Calculate the crop region for circular cropping
 *
 * This function determines what part of the original image should be cropped
 * based on:
 * - The circle guide position (always centered in the container)
 * - The image display with resizeMode="cover"
 * - User pan and zoom transforms
 */
export function calculateCropRegion(params: CropCalculationParams): CropCalculationResult {
  const { originalImage, containerSize, circleSize, userTransforms } = params;
  const { width: imgWidth, height: imgHeight } = originalImage;
  const { scale: userScale, translateX: userTranslateX, translateY: userTranslateY } = userTransforms;

  // Calculate how the image is displayed with resizeMode="cover"
  const { displayWidth, displayHeight, offsetX, offsetY, scaleFactor } = calculateCoverModeDisplay(
    imgWidth,
    imgHeight,
    containerSize
  );

  // Circle center in screen coordinates (always centered)
  const circleCenterX = containerSize / 2;
  const circleCenterY = containerSize / 2;

  // The Animated.Image component center (scale transforms happen around this)
  const componentCenterX = containerSize / 2;
  const componentCenterY = containerSize / 2;

  // Find circle position relative to the component center
  const circleRelX = circleCenterX - componentCenterX;
  const circleRelY = circleCenterY - componentCenterY;

  // Undo user transforms (translate and scale around component center)
  const unscaledX = circleRelX / userScale - userTranslateX / userScale;
  const unscaledY = circleRelY / userScale - userTranslateY / userScale;

  // Now we have position in the untransformed component space
  // Account for the image offset within the component (from cover mode)
  const imageX = componentCenterX + unscaledX - offsetX;
  const imageY = componentCenterY + unscaledY - offsetY;
  const circleRadius = circleSize / 2 / userScale;

  // Convert to original image coordinates
  const cropCenterX = imageX * scaleFactor;
  const cropCenterY = imageY * scaleFactor;
  const cropRadius = circleRadius * scaleFactor;

  // Calculate crop box (square containing the circle)
  const cropX = Math.max(0, cropCenterX - cropRadius);
  const cropY = Math.max(0, cropCenterY - cropRadius);
  const cropSize = cropRadius * 2;

  // Ensure crop region is within bounds
  const finalCropX = Math.max(0, Math.min(cropX, imgWidth - cropSize));
  const finalCropY = Math.max(0, Math.min(cropY, imgHeight - cropSize));
  const finalCropSize = Math.min(
    cropSize,
    imgWidth - finalCropX,
    imgHeight - finalCropY
  );

  return {
    cropRegion: {
      originX: Math.round(finalCropX),
      originY: Math.round(finalCropY),
      width: Math.round(finalCropSize),
      height: Math.round(finalCropSize),
    },
    displaySize: { width: displayWidth, height: displayHeight },
    offset: { x: offsetX, y: offsetY },
    scaleFactor,
  };
}
