import * as cv from '@techstark/opencv-js'
import { Jimp, JimpMime } from 'jimp'

export async function fileToMat(file: File): Promise<cv.Mat> {
  if (typeof cv === 'undefined') {
    throw new Error('OpenCV.js not loaded!')
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader()

    reader.onload = async (e) => {
      try {
        const buffer = e.target?.result as ArrayBuffer
        const image = await Jimp.fromBuffer(buffer)
        const mat = cv.matFromImageData(image.bitmap)
        resolve(mat)
      } catch (error) {
        reject(error)
      }
    }

    reader.onerror = (error) => {
      reject(error)
    }

    reader.readAsArrayBuffer(file)
  })
}

// strength是高斯模糊的核大小
export function applyGaussinBlur(pic: cv.Mat, strength: number): cv.Mat {
  const kernelSize = Math.sqrt(strength) * 2 + 1
  const kernel = new cv.Size(kernelSize, kernelSize)
  const sigma = strength / 10
  const result = pic.clone()
  cv.GaussianBlur(result, result, kernel, sigma)
  return result
}

async function matToBlob(pic: cv.Mat): Promise<Blob> {
  const picData: cv.ImageData = {
    data: new Uint8ClampedArray(pic.data),
    width: pic.cols,
    height: pic.rows
  }
  const picJimp = new Jimp(picData)
  const buffer = await picJimp.getBuffer(JimpMime.png)
  return new Blob([buffer], { type: JimpMime.png })
}

async function base64ToMat(pic: string): Promise<cv.Mat> {
  console.log(pic)
  const picData = pic.split(',')[1]
  const buffer = Buffer.from(picData, 'base64')

  const picJimp = await Jimp.read(buffer)
  return cv.matFromImageData(picJimp.bitmap)
}

async function fetchImage(uri: string, pic: cv.Mat): Promise<cv.Mat> {
  const formData = new FormData()
  const picBlob = await matToBlob(pic)
  formData.append('file', picBlob)

  const response = await fetch(uri, { method: 'POST', body: formData })
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  const data = await response.json()
  if (!data.image) {
    throw new Error('json have no image')
  }
  return base64ToMat(data.image)
}
