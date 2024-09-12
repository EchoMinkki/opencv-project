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

// strength 是高斯模糊的核大小
export function applyGaussinBlur(pic: cv.Mat, strength: number): cv.Mat {
  if (cv.getBuildInformation) {
    console.log(cv.getBuildInformation())
  }
  const kernelSize = Math.sqrt(strength) * 2 + 1
  const kernel = new cv.Size(kernelSize, kernelSize)
  const sigma = strength / 10
  const result = new cv.Mat()
  cv.GaussianBlur(pic, result, kernel, sigma)
  return result
}

export function applyLaplacian(pic: cv.Mat, strength: number): cv.Mat {
  const alpha = strength / 100

  const result = new cv.Mat()
  cv.Laplacian(pic, result, cv.CV_16S)

  const absResult = new cv.Mat()
  cv.convertScaleAbs(result, absResult)

  // 使用加权和函数来锐化图像
  // alpha: 控制锐化强度，0.5 为原始强度，增大值会增加锐化效果
  cv.addWeighted(pic, 1 + alpha, absResult, -alpha, 0, result)

  absResult.delete()
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

  const result = new cv.Mat()
  cv.convertScaleAbs(pic, result, alpha, beta)
  return result
}

export function changeSaturation(pic: cv.Mat, saturation: number) {
  let hsv = new cv.Mat()
  cv.cvtColor(pic, hsv, cv.COLOR_RGB2HSV)

  // 2. 拆分 HSV 通道
  let hsvChannels = new cv.MatVector()
  cv.split(hsv, hsvChannels)

  // 3. 调整饱和度 (S 通道)
  let saturationChannel = hsvChannels.get(1) // S 通道 (饱和度通道)

  // 将饱和度按比例放大或缩小，范围从 -100 到 100
  const scaleFactor = (saturation + 100) / 100 // 将 -100 到 100 映射为 0 到 2
  saturationChannel.convertTo(saturationChannel, -1, scaleFactor) // scaleFactor 的比例从 0 到 2

  // 4. 限制饱和度的值在合法的范围内 (0-255)
  cv.threshold(saturationChannel, saturationChannel, 255, 255, cv.THRESH_TRUNC)
  cv.threshold(saturationChannel, saturationChannel, 0, 0, cv.THRESH_TOZERO)

  // 5. 合并 HSV 通道回去
  hsvChannels.set(1, saturationChannel) // 将调整后的饱和度放回去
  cv.merge(hsvChannels, hsv)

  // 6. 转换回 RGB 颜色空间
  let dst = new cv.Mat()
  cv.cvtColor(hsv, dst, cv.COLOR_HSV2RGB)

  // 释放内存
  hsv.delete()
  hsvChannels.delete()
  saturationChannel.delete()

  return dst // 返回调整后的图像
}

export function crop(
  pic: cv.Mat,
  cropStart: { x: number; y: number },
  cropEnd: { x: number; y: number }
) {
  const startPoint = new cv.Point(
    Math.min(cropStart.x, cropEnd.x),
    Math.min(cropStart.y, cropEnd.y)
  )
  const areaSize = new cv.Size(Math.abs(cropEnd.x - cropStart.x), Math.abs(cropEnd.y - cropStart.y))
  const rect = new cv.Rect(startPoint, areaSize)
  return pic.roi(rect).clone()
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
 * "candy", "starry_night", "the_wave", "the_scream", "mosaic", "la_muse", "feathers", "ubnie", "composition_vii"
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
