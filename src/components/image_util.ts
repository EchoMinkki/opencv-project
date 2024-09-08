import * as cv from '@techstark/opencv-js'
import { Jimp } from 'jimp'

export async function fileToMat(file: File): Promise<cv.Mat> {
  if (typeof cv === 'undefined') {
    throw new Error('OpenCV.js not loaded!');
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer;
        const image = await Jimp.fromBuffer(buffer);
        var src = cv.matFromImageData(image.bitmap);
        resolve(src);
      } catch (err) {
        reject(new Error(`Error processing image: ${err.message}`));
      }
    }

    reader.readAsArrayBuffer(file);
  });
}
