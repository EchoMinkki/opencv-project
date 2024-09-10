import * as cv from '@techstark/opencv-js'
import { Jimp, JimpMime } from 'jimp'

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
export function applyGaussinBlur(pic: cv.Mat, strength: number): cv.Mat {
  const kernelSize = Math.sqrt(strength) * 2 + 1
  const kernel = new cv.Size(kernelSize, kernelSize)
  const sigma = strength / 10
  const result = pic.clone()
  cv.GaussianBlur(result, result, kernel, sigma)
  return result
}

async function matToBlob(pic: cv.Mat): Promise<Blob> {
  return new Promise(async (resolve, reject) => {
    const picData: cv.ImageData = {
      data: new Uint8ClampedArray(pic.data),
      width: pic.cols,
      height: pic.rows
    }

    const picJimp = new Jimp(picData)
    picJimp.getBuffer(JimpMime.png, (err: any, buffer: BlobPart) => {
      if (err) {
        reject(err.message)
      }
      resolve(new Blob([buffer], { type: JimpMime.png }))
    })
  })
}

async function base64ToMat(pic: string): Promise<cv.Mat> {
  console.log(pic)
  return new Promise(async (resolve, reject) => {
    const picData = pic.split(',')[1]
    const buffer = Buffer.from(picData, 'base64')

    const picJimp = await Jimp.read(buffer)

    const { data, width, height } = picJimp.bitmap
    const mat = cv.matFromImageData({ data, width, height })

    resolve(mat)
  })
}

async function fetchImage(uri: string, pic: cv.Mat, ...argv: any[]) {
  return new Promise(async (resolve, reject) => {
    const formData = new FormData()
    const picBlob = await matToBlob(pic)
    formData.append('file', picBlob)

    try {
      const response = await fetch(uri, { method: 'POST', body: formData })
      if (!response.ok) {
        reject('Network response was not ok')
      }
      const data = await response.json()
      if (!data.image) {
        reject('json have no image')
      }

      const mat = await base64ToMat(data.image)
      resolve(mat)
    } catch (err) {
      reject(err.message)
    }
  })
}
