import * as ImageManipulator from 'expo-image-manipulator';

const MAX_DIMENSION = 1280;
const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB
const COMPRESS_QUALITY = 0.8;

export interface CompressResult {
  uri: string;
  width: number;
  height: number;
  /** Estimated size in bytes (not exact — real size is determined after upload) */
  estimatedBytes: number;
}

/**
 * Compresses an image to max 1280×1280 px at 80% quality.
 * Throws if the resulting size estimate exceeds 5 MB.
 */
export async function compressImage(uri: string): Promise<CompressResult> {
  const result = await ImageManipulator.manipulateAsync(
    uri,
    [
      {
        resize:
          // Keep aspect ratio within MAX_DIMENSION
          { width: MAX_DIMENSION, height: MAX_DIMENSION },
      },
    ],
    {
      compress: COMPRESS_QUALITY,
      format: ImageManipulator.SaveFormat.JPEG,
    },
  );

  // Rough size estimate: width × height × 3 bytes (RGB) × compression factor
  const estimatedBytes = result.width * result.height * 3 * COMPRESS_QUALITY * 0.25;

  if (estimatedBytes > MAX_SIZE_BYTES) {
    throw new Error(
      `La imagen excede el límite de 5 MB. Selecciona una imagen de menor resolución.`,
    );
  }

  return {
    uri: result.uri,
    width: result.width,
    height: result.height,
    estimatedBytes,
  };
}

/**
 * Compresses multiple images and returns only the ones that pass the size limit.
 * Images that fail are silently skipped — caller should handle the error array.
 */
export async function compressImages(uris: string[]): Promise<{
  results: CompressResult[];
  errors: { uri: string; message: string }[];
}> {
  const results: CompressResult[] = [];
  const errors: { uri: string; message: string }[] = [];

  for (const uri of uris) {
    try {
      results.push(await compressImage(uri));
    } catch (err) {
      errors.push({ uri, message: err instanceof Error ? err.message : String(err) });
    }
  }

  return { results, errors };
}
