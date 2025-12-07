import {
  calculateCoverModeDisplay,
  calculateCropRegion,
  CropCalculationParams,
} from '../cropCalculations';

describe('cropCalculations', () => {
  describe('calculateCoverModeDisplay', () => {
    it('should calculate display for landscape image', () => {
      // 2:1 landscape image in 400x400 container
      const result = calculateCoverModeDisplay(2000, 1000, 400);

      expect(result.displayHeight).toBe(400); // Fits height
      expect(result.displayWidth).toBe(800); // Width overflows
      expect(result.offsetX).toBe(-200); // Centered horizontally, negative offset
      expect(result.offsetY).toBe(0);
      expect(result.scaleFactor).toBe(2.5); // 1000 / 400
    });

    it('should calculate display for portrait image', () => {
      // 2:3 portrait image in 400x400 container
      const result = calculateCoverModeDisplay(2000, 3000, 400);

      expect(result.displayWidth).toBe(400); // Fits width
      expect(result.displayHeight).toBe(600); // Height overflows
      expect(result.offsetX).toBe(0);
      expect(result.offsetY).toBe(-100); // Centered vertically, negative offset
      expect(result.scaleFactor).toBe(5); // 2000 / 400
    });

    it('should calculate display for square image', () => {
      // 1:1 square image in 400x400 container
      const result = calculateCoverModeDisplay(2000, 2000, 400);

      expect(result.displayWidth).toBe(400);
      expect(result.displayHeight).toBe(400);
      expect(result.offsetX).toBe(0);
      expect(result.offsetY).toBe(0);
      expect(result.scaleFactor).toBe(5); // 2000 / 400
    });

    it('should handle real-world iPhone photo dimensions', () => {
      // Typical iPhone portrait photo: 3024x4032 in 393x393 container
      const result = calculateCoverModeDisplay(3024, 4032, 393);

      expect(result.displayWidth).toBe(393);
      expect(result.displayHeight).toBeCloseTo(524, 0);
      expect(result.offsetX).toBe(0);
      expect(result.offsetY).toBeCloseTo(-65.5, 1);
      expect(result.scaleFactor).toBeCloseTo(7.695, 2);
    });
  });

  describe('calculateCropRegion', () => {
    const containerSize = 393; // iPhone screen width
    const circleSize = 275; // 70% of screen width

    describe('with no user transforms', () => {
      const noTransforms = { scale: 1, translateX: 0, translateY: 0 };

      it('should crop center of portrait image', () => {
        const params: CropCalculationParams = {
          originalImage: { width: 3024, height: 4032 },
          containerSize,
          circleSize,
          userTransforms: noTransforms,
        };

        const result = calculateCropRegion(params);

        // Should crop from the center of the image (allow rounding error)
        expect(Math.abs(result.cropRegion.originX - 453)).toBeLessThan(2);
        expect(Math.abs(result.cropRegion.originY - 957)).toBeLessThan(2);
        expect(Math.abs(result.cropRegion.width - 2116)).toBeLessThan(2);
        expect(Math.abs(result.cropRegion.height - 2116)).toBeLessThan(2);
      });

      it('should crop center of landscape image', () => {
        const params: CropCalculationParams = {
          originalImage: { width: 4032, height: 3024 },
          containerSize,
          circleSize,
          userTransforms: noTransforms,
        };

        const result = calculateCropRegion(params);

        // Should crop from the center of the landscape image
        const expectedRadius = (circleSize / 2) * (3024 / containerSize);
        const expectedCenter = 4032 / 2; // X center

        expect(result.cropRegion.originX).toBeCloseTo(expectedCenter - expectedRadius, 0);
        expect(result.cropRegion.width).toBeCloseTo(expectedRadius * 2, 0);
        expect(result.cropRegion.height).toBeCloseTo(expectedRadius * 2, 0);
      });

      it('should crop center of square image', () => {
        const params: CropCalculationParams = {
          originalImage: { width: 2000, height: 2000 },
          containerSize,
          circleSize,
          userTransforms: noTransforms,
        };

        const result = calculateCropRegion(params);

        // Should crop from exact center of square image
        const scaleFactor = 2000 / containerSize;
        const expectedRadius = (circleSize / 2) * scaleFactor;
        const expectedCenter = 1000; // Center of 2000px image

        expect(result.cropRegion.originX).toBeCloseTo(expectedCenter - expectedRadius, 0);
        expect(result.cropRegion.originY).toBeCloseTo(expectedCenter - expectedRadius, 0);
        expect(result.cropRegion.width).toBeCloseTo(expectedRadius * 2, 0);
        expect(result.cropRegion.height).toBeCloseTo(expectedRadius * 2, 0);
      });
    });

    describe('with user pan', () => {
      it('should shift crop right when image panned left', () => {
        // User pans image left (negative translateX), so crop should shift right
        const params: CropCalculationParams = {
          originalImage: { width: 3024, height: 4032 },
          containerSize,
          circleSize,
          userTransforms: { scale: 1, translateX: -50, translateY: 0 },
        };

        const resultWithPan = calculateCropRegion(params);
        const resultNoPan = calculateCropRegion({
          ...params,
          userTransforms: { scale: 1, translateX: 0, translateY: 0 },
        });

        // Crop should shift right (larger originX)
        expect(resultWithPan.cropRegion.originX).toBeGreaterThan(resultNoPan.cropRegion.originX);
      });

      it('should shift crop down when image panned up', () => {
        // User pans image up (negative translateY), so crop should shift down
        const params: CropCalculationParams = {
          originalImage: { width: 3024, height: 4032 },
          containerSize,
          circleSize,
          userTransforms: { scale: 1, translateX: 0, translateY: -50 },
        };

        const resultWithPan = calculateCropRegion(params);
        const resultNoPan = calculateCropRegion({
          ...params,
          userTransforms: { scale: 1, translateX: 0, translateY: 0 },
        });

        // Crop should shift down (larger originY)
        expect(resultWithPan.cropRegion.originY).toBeGreaterThan(resultNoPan.cropRegion.originY);
      });
    });

    describe('with user zoom', () => {
      it('should reduce crop size when zoomed in', () => {
        const params: CropCalculationParams = {
          originalImage: { width: 3024, height: 4032 },
          containerSize,
          circleSize,
          userTransforms: { scale: 2, translateX: 0, translateY: 0 },
        };

        const resultZoomed = calculateCropRegion(params);
        const resultNoZoom = calculateCropRegion({
          ...params,
          userTransforms: { scale: 1, translateX: 0, translateY: 0 },
        });

        // When zoomed 2x, crop area should be half the size
        expect(resultZoomed.cropRegion.width).toBeCloseTo(resultNoZoom.cropRegion.width / 2, 0);
        expect(resultZoomed.cropRegion.height).toBeCloseTo(resultNoZoom.cropRegion.height / 2, 0);
      });

      it('should center crop when zoomed with no pan', () => {
        const params: CropCalculationParams = {
          originalImage: { width: 3024, height: 4032 },
          containerSize,
          circleSize,
          userTransforms: { scale: 2, translateX: 0, translateY: 0 },
        };

        const result = calculateCropRegion(params);

        // Even when zoomed, crop should still be centered
        const cropCenterX = result.cropRegion.originX + result.cropRegion.width / 2;
        const cropCenterY = result.cropRegion.originY + result.cropRegion.height / 2;

        expect(cropCenterX).toBeCloseTo(3024 / 2, 0); // Center X
        expect(cropCenterY).toBeCloseTo(4032 / 2, 0); // Center Y
      });
    });

    describe('boundary conditions', () => {
      it('should clamp crop to image bounds when near edge', () => {
        // Pan image significantly so crop would go out of bounds
        const params: CropCalculationParams = {
          originalImage: { width: 3024, height: 4032 },
          containerSize,
          circleSize,
          userTransforms: { scale: 1, translateX: 200, translateY: 200 },
        };

        const result = calculateCropRegion(params);

        // Crop should not go negative
        expect(result.cropRegion.originX).toBeGreaterThanOrEqual(0);
        expect(result.cropRegion.originY).toBeGreaterThanOrEqual(0);

        // Crop should not exceed image bounds
        expect(result.cropRegion.originX + result.cropRegion.width).toBeLessThanOrEqual(3024);
        expect(result.cropRegion.originY + result.cropRegion.height).toBeLessThanOrEqual(4032);
      });

      it('should handle minimum zoom (1x)', () => {
        const params: CropCalculationParams = {
          originalImage: { width: 3024, height: 4032 },
          containerSize,
          circleSize,
          userTransforms: { scale: 1, translateX: 0, translateY: 0 },
        };

        const result = calculateCropRegion(params);

        // Should produce valid crop region
        expect(result.cropRegion.width).toBeGreaterThan(0);
        expect(result.cropRegion.height).toBeGreaterThan(0);
        expect(result.cropRegion.originX).toBeGreaterThanOrEqual(0);
        expect(result.cropRegion.originY).toBeGreaterThanOrEqual(0);
      });

      it('should handle maximum zoom (3x)', () => {
        const params: CropCalculationParams = {
          originalImage: { width: 3024, height: 4032 },
          containerSize,
          circleSize,
          userTransforms: { scale: 3, translateX: 0, translateY: 0 },
        };

        const result = calculateCropRegion(params);

        // Should produce valid crop region (smaller due to zoom)
        expect(result.cropRegion.width).toBeGreaterThan(0);
        expect(result.cropRegion.height).toBeGreaterThan(0);
        expect(result.cropRegion.width).toBeLessThan(1000); // Much smaller than unzoomed
      });
    });

    describe('real-world scenario from debug output', () => {
      it('should match the working scenario from user testing', () => {
        // From the debug output that finally worked:
        // Original image: 3024 x 4032
        // Display size: 393 x 524
        // Offset: 0 -65.5
        // User transforms: {"scale": 1, "translateX": 0, "translateY": 0}
        // Crop center (original): 1512 2016
        // Crop radius (original): 1058.4

        const params: CropCalculationParams = {
          originalImage: { width: 3024, height: 4032 },
          containerSize: 393,
          circleSize: 275.1,
          userTransforms: { scale: 1, translateX: 0, translateY: 0 },
        };

        const result = calculateCropRegion(params);

        // Display size should match
        expect(result.displaySize.width).toBeCloseTo(393, 0);
        expect(result.displaySize.height).toBeCloseTo(524, 0);

        // Offset should match
        expect(result.offset.x).toBeCloseTo(0, 0);
        expect(result.offset.y).toBeCloseTo(-65.5, 1);

        // Crop center should be at image center (allow rounding error)
        const cropCenterX = result.cropRegion.originX + result.cropRegion.width / 2;
        const cropCenterY = result.cropRegion.originY + result.cropRegion.height / 2;
        expect(Math.abs(cropCenterX - 1512)).toBeLessThan(2);
        expect(Math.abs(cropCenterY - 2016)).toBeLessThan(2);

        // Crop radius should match
        expect(result.cropRegion.width / 2).toBeCloseTo(1058.4, 0);
      });
    });
  });
});
