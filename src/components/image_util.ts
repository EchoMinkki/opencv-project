import * as cv from '@techstark/opencv-js'
import { Jimp, JimpMime } from 'jimp'

const url = 'http://127.0.0.1:8000/'

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

async function fetchImage(uri: string, pic: cv.Mat): Promise<cv.Mat> {
  const formData = new FormData()
  const picBlob = await matToBlob(pic)
  formData.append('file', picBlob)

  const response = await fetch(url + uri, { method: 'POST', body: formData })
  if (!response.ok) {
    throw new Error('Network response was not ok')
  }
  const data = await response.json()
  if (!data.image) {
    throw new Error('json have no image')
  }
  return base64ToMat(data.image)
}

export function changeBrightnessAndContrast(
  pic: cv.Mat,
  brightness: number,
  contrast: number
): cv.Mat {
  const alpha = 1 + contrast / 100.0
  const beta = brightness

  const result = pic.clone()
  cv.convertScaleAbs(result, result, alpha, beta)
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
  const picBinary = atob(pic)
  const bytes = new Uint8Array(picBinary.length)
  for (let i = 0; i < picBinary.length; i++) {
    bytes[i] = picBinary.charCodeAt(i)
  }

  const picJimp = await Jimp.read(bytes.buffer)
  return cv.matFromImageData(picJimp.bitmap)
}

/**
 * 调用风格化迁移函数的异步接口
 * @param pic cv.Mat类型的图片输入
 * @param model_name 传递给接口的参数，决定了使用的模型，可选值为
 * "candy", "starry_night", "the_wave", "the_scream", "mosaic", "la_muse", "feathers", "udnie", "composition_vii"
 */
export async function styleTransfer(
  pic: cv.Mat,
  model_name:
    | 'candy'
    | 'starry_night'
    | 'the_wave'
    | 'the_scream'
    | 'mosaic'
    | 'la_muse'
    | 'feathers'
    | 'udnie'
    | 'composition_vii'
) {
  return fetchImage('style_transfer/?model_name=' + model_name, pic)
}
