const sharp = require('sharp');
const fs = require('fs').promises;
const path = require('path');

/**
 * Optimize an image with quality-based or size-based approach
 * @param {string} inputPath - Path to input image
 * @param {string} outputPath - Path to save optimized image
 * @param {number|null} targetSize - Target file size in bytes (null for quality-based optimization)
 * @param {Object} options - Additional options
 * @returns {Promise<Object>} - Optimization result
 */
async function optimizeImage(inputPath, outputPath, targetSize = null, options = {}) {
  const {
    minQuality = 85,
    maxQuality = 95,
    maxIterations = 20,
    safetyMargin = 1024 // 1KB default safety margin to account for filesystem overhead (only used with targetSize)
  } = options;

  const ext = path.extname(inputPath).toLowerCase();
  const originalStats = await fs.stat(inputPath);
  const originalSize = originalStats.size;

  // Quality-based optimization (no target size)
  if (targetSize === null) {
    let quality = maxQuality;

    try {
      const image = sharp(inputPath);

      if (ext === '.png') {
        await image
          .png({
            quality,
            compressionLevel: 9,
            effort: 10,
            palette: true // Enable lossy compression for PNGs
          })
          .toFile(outputPath);
      } else if (ext === '.jpg' || ext === '.jpeg') {
        await image
          .jpeg({
            quality,
            mozjpeg: true
          })
          .toFile(outputPath);
      } else {
        throw new Error(`Unsupported file format: ${ext}`);
      }

      const finalStats = await fs.stat(outputPath);
      const optimizedSize = finalStats.size;
      const savings = originalSize - optimizedSize;
      const savingsPercent = ((savings / originalSize) * 100).toFixed(2);

      return {
        success: true,
        originalSize,
        optimizedSize,
        quality,
        iterations: 1,
        savings,
        savingsPercent,
        underTarget: true
      };
    } catch (error) {
      throw new Error(`Failed to optimize ${inputPath}: ${error.message}`);
    }
  }

  // Size-based optimization (original behavior)
  const adjustedTarget = targetSize - safetyMargin;

  // If already under adjusted target (with safety margin), just copy
  if (originalSize <= adjustedTarget) {
    await fs.copyFile(inputPath, outputPath);
    return {
      success: true,
      originalSize,
      optimizedSize: originalSize,
      quality: 100,
      iterations: 0,
      savings: 0,
      savingsPercent: 0,
      underTarget: true
    };
  }

  let quality = maxQuality;
  let bestQuality = quality;
  let bestSize = Infinity;
  let iterations = 0;

  // Binary search for optimal quality
  let low = minQuality;
  let high = maxQuality;

  while (low <= high && iterations < maxIterations) {
    iterations++;
    quality = Math.floor((low + high) / 2);

    try {
      const image = sharp(inputPath);

      if (ext === '.png') {
        // For PNG, use palette with quality setting for lossy compression
        await image
          .png({
            quality,
            compressionLevel: 9,
            effort: 10,
            palette: true // Enable lossy compression for PNGs
          })
          .toFile(outputPath);
      } else if (ext === '.jpg' || ext === '.jpeg') {
        await image
          .jpeg({
            quality,
            mozjpeg: true
          })
          .toFile(outputPath);
      } else {
        throw new Error(`Unsupported file format: ${ext}`);
      }

      const stats = await fs.stat(outputPath);
      const currentSize = stats.size;

      if (currentSize <= adjustedTarget) {
        // File is under adjusted target, try higher quality
        bestQuality = quality;
        bestSize = currentSize;
        low = quality + 1;
      } else {
        // File is over adjusted target, try lower quality
        high = quality - 1;
      }

    } catch (error) {
      throw new Error(`Failed to optimize ${inputPath}: ${error.message}`);
    }
  }

  // Generate final image with best quality found
  if (bestSize === Infinity || bestSize > adjustedTarget) {
    // No suitable quality found, use minimum quality
    quality = Math.max(10, minQuality);
    const image = sharp(inputPath);

    if (ext === '.png') {
      await image
        .png({
          quality,
          compressionLevel: 9,
          effort: 10,
          palette: true
        })
        .toFile(outputPath);
    } else {
      await image
        .jpeg({
          quality,
          mozjpeg: true
        })
        .toFile(outputPath);
    }
  } else if (bestQuality !== quality) {
    // Regenerate with best quality if needed
    const image = sharp(inputPath);

    if (ext === '.png') {
      await image
        .png({
          quality: bestQuality,
          compressionLevel: 9,
          effort: 10,
          palette: true
        })
        .toFile(outputPath);
    } else {
      await image
        .jpeg({
          quality: bestQuality,
          mozjpeg: true
        })
        .toFile(outputPath);
    }
  }

  let finalStats = await fs.stat(outputPath);
  let optimizedSize = finalStats.size;

  // If still over target, try more aggressive compression
  if (optimizedSize > targetSize) {
    // Try with even lower quality and strip all metadata
    let aggressiveQuality = Math.max(1, minQuality - 5);

    while (aggressiveQuality >= 1 && optimizedSize > targetSize) {
      const image = sharp(inputPath);

      if (ext === '.png') {
        await image
          .png({
            quality: aggressiveQuality,
            compressionLevel: 9,
            effort: 10,
            palette: true
          })
          .toFile(outputPath);
      } else {
        await image
          .jpeg({
            quality: aggressiveQuality,
            mozjpeg: true,
            chromaSubsampling: '4:2:0' // More aggressive chroma subsampling
          })
          .withMetadata({}) // Strip all metadata
          .toFile(outputPath);
      }

      finalStats = await fs.stat(outputPath);
      optimizedSize = finalStats.size;

      if (optimizedSize <= targetSize) {
        quality = aggressiveQuality;
        break;
      }

      aggressiveQuality -= 2;
    }
  }

  const savings = originalSize - optimizedSize;
  const savingsPercent = ((savings / originalSize) * 100).toFixed(2);

  return {
    success: optimizedSize <= targetSize,
    originalSize,
    optimizedSize,
    quality: bestQuality || quality,
    iterations,
    savings,
    savingsPercent,
    underTarget: optimizedSize <= targetSize
  };
}

/**
 * Batch optimize multiple images
 * @param {Array<string>} inputPaths - Array of input image paths
 * @param {string} outputDir - Output directory
 * @param {number} targetSize - Target file size in bytes
 * @param {Object} options - Additional options
 * @returns {Promise<Array>} - Array of optimization results
 */
async function batchOptimize(inputPaths, outputDir, targetSize, options = {}) {
  // Ensure output directory exists
  await fs.mkdir(outputDir, { recursive: true });

  const results = [];

  for (const inputPath of inputPaths) {
    const filename = path.basename(inputPath);
    const outputPath = path.join(outputDir, filename);

    try {
      const result = await optimizeImage(inputPath, outputPath, targetSize, options);
      results.push({
        filename,
        inputPath,
        outputPath,
        ...result
      });
    } catch (error) {
      results.push({
        filename,
        inputPath,
        outputPath,
        success: false,
        error: error.message
      });
    }
  }

  return results;
}

/**
 * Format bytes to human readable string
 * @param {number} bytes - Number of bytes
 * @returns {string} - Formatted string
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

module.exports = {
  optimizeImage,
  batchOptimize,
  formatBytes
};
