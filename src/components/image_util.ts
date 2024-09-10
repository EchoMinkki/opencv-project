import * as cv from '@techstark/opencv-js'
import { Jimp } from 'jimp'

export async function fileToMat(file: File): Promise<cv.Mat> {
  if (typeof cv === 'undefined') {
    throw new Error('OpenCV.js not loaded!')
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      const buffer = e.target?.result as ArrayBuffer
      const image = await Jimp.fromBuffer(buffer)
      const src = cv.matFromImageData(image.bitmap)
      resolve(src)
    }

    reader.readAsArrayBuffer(file)
  })
}

// strength是高斯模糊的核大小
export function applyGaussinBlur(pic: cv.Mat, strength: cv.int): cv.Mat {
  // const kernelSize = Math.sqrt(strength) * 2 + 1
  const kernelSize = 9
  const kernel = new cv.Size(kernelSize, kernelSize)
  const sigma = strength / 10
  const result = pic.clone()
  cv.GaussianBlur(result, result, kernel, sigma)
  return result
}
