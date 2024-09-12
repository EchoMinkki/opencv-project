<template>
  <div class="editor-container">
    <!-- 顶部横排 -->
    <div class="header">
      <div class="logo">
        <span>图片处理与风格化系统</span>
      </div>
      <div class="actions">
        <button @click="reset">重置</button>
        <button @click="undo" :disabled="!canUndo">撤销</button>
        <!-- 添加主题切换滑块 -->
        <label class="switch">
          <input type="checkbox" v-model="isNightMode" @change="toggleTheme" />
          <span class="slider"></span>
        </label>
      </div>
    </div>

    <!-- 主体部分 -->
    <div class="main-content">
      <!-- 左侧图片色彩空间调整区域 -->
      <div class="slider-container">
        <div class="slider-bar">
          <label for="brightness">亮度:{{ brightness }}</label>
          <span class="min-value">-100</span>
          <input
            type="range"
            id="brightness"
            min="-100"
            max="100"
            v-model.number="brightness"
            @input="adjustBrightnessContrast"
            @mouseup="generateImage"
          />
          <span class="max-value">100</span>
        </div>
        <div class="slider-bar">
          <label for="contrast">对比度:{{ contrast }}</label>
          <span class="min-value">-100</span>
          <input
            type="range"
            id="brightness"
            min="-100"
            max="100"
            v-model.number="contrast"
            @input="adjustBrightnessContrast"
            @mouseup="generateImage"
          />
          <span class="max-value">100</span>
        </div>
        <div class="slider-bar">
          <label for="saturation">饱和度:{{ saturation }}</label>
          <span class="min-value">-100</span>
          <input
            type="range"
            id="saturation"
            min="-100"
            max="100"
            v-model.number="saturation"
            @input="adjustSaturation"
            @mouseup="generateImage"
          />
          <span class="max-value">100</span>
        </div>
        <div class="slider-bar">
          <label for="sharpening">锐化:{{ sharpening }}</label>
          <span class="min-value">0</span>
          <input
            type="range"
            id="sharpening"
            min="0"
            max="100"
            v-model.number="sharpening"
            @input="adjustSharpening"
            @mouseup="generateImage"
          />
          <span class="max-value">100</span>
        </div>
        <div class="slider-bar">
          <label for="blurRange">模糊: {{ blurStrength }}</label>
          <span class="min-value">0</span>
          <input
            type="range"
            id="blurRange"
            min="0"
            max="100"
            v-model.number="blurStrength"
            @input="applyBlur"
            @mouseup="generateImage"
          />
          <span class="max-value">100</span>
        </div>
      </div>
      <!-- 中间图片显示区域 -->
      <div class="image-container">
        <div class="image-box" ref="imageBox">
          <div class="canvas-container">
            <canvas id="mainCanvas" ref="mainCanvas"></canvas>
            <canvas id="imageCanvas" ref="imageCanvas" style="display: none"></canvas>
            <canvas
              id="overlayCanvas"
              ref="overlayCanvas"
              @mousedown="startCrop"
              @mousemove="drawCrop"
              @mouseup="endCrop"
            >
            </canvas>
          </div>
        </div>
        <div class="image-actions">
          <input type="file" @change="handleFileChange" />
          <button>下载图像</button>
        </div>
        <div class="zoom-controls">
          <label for="zoom-slider">缩放比例：{{ zoomValue }}</label>
          <input
            id="zoom-slider"
            type="range"
            min="0.25"
            :max="2"
            step="0.25"
            v-model="zoomValue"
          />
        </div>
        <!-- 裁剪确认/取消按钮-->
        <div v-if="isCropping" class="crop-controls">
          <button @click="confirmCrop">✔</button>
          <button @click="cancelCrop">✘</button>
        </div>
      </div>

      <!-- 右侧编辑工具 -->
      <div class="tools-container">
        <!-- 基本图像处理工具 -->
        <div class="tool-section">
          <h3>基本图像处理</h3>
          <button @click="enableCropMode">裁切</button>
          <button @click="rotateImage">旋转</button>
          <!-- <button>去噪</button> -->
        </div>

        <div class="tool-section">
          <h3>人像处理</h3>
          <button>人脸识别</button>
          <button>打马赛克</button>
          <button>抠图</button>
          <button>替换背景</button>
          <button>情绪识别</button>
        </div>

        <div class="tool-section">
          <h3>滤镜</h3>
          <button>素描滤镜</button>
          <button>卡通滤镜</button>
          <button>凸透镜滤镜</button>
          <button>漩涡滤镜</button>
        </div>

        <div class="tool-section">
          <h3>图片风格迁移</h3>
          <label for="modelSelect">选择风格</label>
          <select id="modelSelect" name="model" @change="handleModelChange">
            <option value="candy">缤纷糖果</option>
            <option value="starry_night">星夜</option>
            <option value="the_wave">巨浪</option>
            <option value="the_scream">呐喊</option>
            <option value="mosaic">马赛克</option>
            <option value="la_muse">缪斯女神</option>
            <option value="feathers">羽毛</option>
            <option value="udnie">尤德尼梦境</option>
            <option value="composition_vii">构图七</option>
          </select>
        </div>

        <button id="generate" @click="generateImage">生成图片</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import {
  defineComponent,
  markRaw,
  ref,
  reactive,
  watch,
  onMounted,
  onUnmounted,
  nextTick
} from 'vue'
import * as cv from '@techstark/opencv-js'
import {
  applyGaussinBlur,
  applyUnsharpMask,
  changeBrightnessAndContrast,
  changeSaturation,
  fileToMat,
  styleTransfer,
  crop
} from './components/image_util'

export default defineComponent({
  name: 'ImageLoader',
  setup() {
    const overlayCanvas = ref<HTMLCanvasElement | null>(null)
    const imageCanvas = ref<HTMLCanvasElement | null>(null)
    const mainCanvas = ref<HTMLCanvasElement | null>(null)
    const mat = ref<cv.Mat | null>(null) //当前状态
    const originalMat = ref<cv.Mat | null>(null) // 保存原图，用于重置
    const previewMat = ref<cv.Mat | null>(null) // 用于暂时预览

    const isNightMode = ref<boolean>(false)

    interface ImageState {
      mat: cv.Mat
      brightness: number
      contrast: number
      saturation: number
      sharpening: number
      blurStrength: number
    }
    // 图像历史记录栈
    const historyStack = ref<ImageState[]>([])

    const canUndo = ref<boolean>(false) // 是否可以撤销

    //图像旋转
    const rotationAngle = ref<number>(0)

    //图像缩放
    const baseScale = ref<number>(1)
    const zoomValue = ref<number>(1)

    //图像拖拽
    const isDragging = ref(false)
    const dragStart = reactive({ x: 0, y: 0 })
    const imagePosition = reactive({ x: 0, y: 0 })

    //图像色彩空间变化
    const brightness = ref<number>(0)
    const contrast = ref<number>(0)
    const saturation = ref<number>(0)
    const sharpening = ref<number>(0)

    //图像裁剪
    const isCropping = ref<boolean>(false)
    const isDrawing = ref<boolean>(false)
    const cropStart = reactive({ x: 0, y: 0 })
    const cropEnd = reactive({ x: 0, y: 0 })

    //高斯模糊
    const blurStrength = ref<number>(0) // 初始模糊强度

    //图像基础操作
    const handleFileChange = (event: Event) => {
      console.log('上传图片成功')
      const files = (event.target as HTMLInputElement).files
      if (files) {
        fileToMat(files[0])
          .then((matResult) => {
            originalMat.value = markRaw(matResult.clone()) // 保存原图，用于重置
            mat.value = markRaw(matResult.clone())
            previewMat.value = markRaw(matResult.clone())
            zoomValue.value = 1 // 重置缩放比例为1
            loadImage(mat.value, imageCanvas.value)
            saveHistory()
          })
          .catch((error) => {
            console.error('Error loading image:', error)
          })
      }
    }

    //图像风格迁移
    const handleModelChange = (event: Event) => {
      const selectedStyle = (event.target as HTMLSelectElement).value as
        | 'candy'
        | 'starry_night'
        | 'the_wave'
        | 'the_scream'
        | 'mosaic'
        | 'la_muse'
        | 'feathers'
        | 'udnie'
        | 'composition_vii'
      console.log('选择的风格是:', selectedStyle) // 打印选择的风格名称
      if (previewMat.value) {
        styleTransfer(previewMat.value, selectedStyle)
          .then((matResult) => {
            previewMat.value = markRaw(matResult.clone())
            loadImage(previewMat.value, imageCanvas.value)
          })
          .catch((error) => {
            console.error('风格迁移出错:', error)
          })
      }
    }

    const loadImage = (mat: cv.Mat | null, canvas: HTMLCanvasElement | null) => {
      if (!mainCanvas.value) return
      if (mat && canvas) {
        cv.imshow(canvas, mat)
        drawImageCanvasOnMainCanvas()
      }
    }

    //主要绘制函数
    const drawImageCanvasOnMainCanvas = () => {
      if (mainCanvas.value && imageCanvas.value) {
        const mainCtx = mainCanvas.value.getContext('2d')
        if (mainCtx) {
          mainCanvas.value.width = mainCanvas.value.clientWidth
          mainCanvas.value.height = mainCanvas.value.clientHeight

          // 计算基础缩放比例
          const scaleX = mainCanvas.value.width / imageCanvas.value.width
          const scaleY = mainCanvas.value.height / imageCanvas.value.height
          baseScale.value = Math.min(scaleX, scaleY)

          //计算和zoomValue合并后的缩放比例
          const scale = baseScale.value * zoomValue.value
          const scaledWidth = imageCanvas.value.width * scale
          const scaledHeight = imageCanvas.value.height * scale

          const x = (mainCanvas.value.width - scaledWidth) / 2 + imagePosition.x
          const y = (mainCanvas.value.height - scaledHeight) / 2 + imagePosition.y

          mainCtx.clearRect(0, 0, mainCanvas.value.width, mainCanvas.value.height)
          mainCtx.imageSmoothingEnabled = true
          mainCtx.imageSmoothingQuality = 'high'

          mainCtx.drawImage(
            imageCanvas.value,
            0,
            0,
            imageCanvas.value.width,
            imageCanvas.value.height,
            x,
            y,
            scaledWidth,
            scaledHeight
          )
        }
      }
    }
    //重置操作
    const reset = () => {
      // 重置缩放比例和图像位置
      zoomValue.value = 1
      imagePosition.x = 0
      imagePosition.y = 0

      brightness.value = 0
      contrast.value = 0
      saturation.value = 0
      sharpening.value = 0
      blurStrength.value = 0

      historyStack.value = []

      // // 可能需要重置其他状态，如裁剪状态等
      // if (isCropping.value) {
      //   isCropping.value = false
      // }

      // 如果有其他图像处理操作的状态，也应该在这里重置

      // 重新加载和绘制原始图像
      if (originalMat.value) {
        if (!imageCanvas.value) return
        mat.value = markRaw(originalMat.value.clone())
        cv.imshow(imageCanvas.value, mat.value)
        drawImageCanvasOnMainCanvas()
      }
    }
    //撤销操作
    const MAX_HISTORY_LENGTH = 20

    // 保存历史记录
    const saveHistory = () => {
      if (mat.value) {
        console.log('保存历史记录')
        if (historyStack.value.length >= MAX_HISTORY_LENGTH) {
          historyStack.value.shift() // 当超过最大历史记录数时，移除最早的记录
        }
        historyStack.value.push({
          mat: markRaw(mat.value.clone()),
          brightness: brightness.value,
          contrast: contrast.value,
          saturation: saturation.value,
          sharpening: sharpening.value,
          blurStrength: blurStrength.value
        }) // 保存当前图像和相关参数的状态
        console.log(
          'push',
          brightness.value,
          contrast.value,
          saturation.value,
          sharpening.value,
          blurStrength.value
        )
        canUndo.value = historyStack.value.length > 0 // 更新撤销按钮状态
      }
    }

    const undo = () => {
      if (historyStack.value.length > 0) {
        console.log('应用撤销', historyStack.value.length)
        const previousState = historyStack.value.pop() // 取出上一步的状态
        if (previousState && imageCanvas.value) {
          console.log('准备更新当前图像状态', historyStack.value.length)
          console.log('pop', previousState)
          // 更新参数
          mat.value = markRaw(previousState.mat.clone()) // 更新当前图像状态
          brightness.value = previousState.brightness // 恢复亮度
          contrast.value = previousState.contrast // 恢复对比度
          saturation.value = previousState.saturation // 恢复饱和度
          sharpening.value = previousState.sharpening // 恢复锐化
          blurStrength.value = previousState.blurStrength //恢复模糊度

          nextTick(() => {
            if (imageCanvas.value && mat.value) {
              cv.imshow(imageCanvas.value, mat.value) // 显示更新后的图像
              drawImageCanvasOnMainCanvas()
            }
            console.log('完成更新当前图像状态', historyStack.value.length)
          })

          console.log('完成撤销', historyStack.value.length)
          canUndo.value = historyStack.value.length > 0 // 更新撤销按钮状态
        }
      }
    }

    //图像拖拽
    const startDrag = (event: MouseEvent) => {
      if (mainCanvas.value && !isCropping.value) {
        isDragging.value = true
        dragStart.x = event.clientX - imagePosition.x
        dragStart.y = event.clientY - imagePosition.y
        mainCanvas.value.style.cursor = 'move' // 设置拖拽时的光标样式
      }
    }

    const doDrag = (event: MouseEvent) => {
      if (isDragging.value) {
        imagePosition.x = event.clientX - dragStart.x
        imagePosition.y = event.clientY - dragStart.y
        drawImageCanvasOnMainCanvas() // 重新绘制图像到新位置
      }
    }

    const endDrag = () => {
      if (mainCanvas.value) {
        isDragging.value = false
        mainCanvas.value.style.cursor = 'default' // 恢复光标到默认样式
      }
    }

    onMounted(() => {
      const canvasContainer = document.querySelector('.canvas-container') as HTMLElement
      canvasContainer.addEventListener('mousedown', startDrag)
      canvasContainer.addEventListener('mousemove', doDrag)
      canvasContainer.addEventListener('mouseup', endDrag)
      canvasContainer.addEventListener('mouseleave', endDrag)
    })

    onUnmounted(() => {
      const canvasContainer = document.querySelector('.canvas-container') as HTMLElement
      canvasContainer.removeEventListener('mousedown', startDrag)
      canvasContainer.removeEventListener('mousemove', doDrag)
      canvasContainer.removeEventListener('mouseup', endDrag)
      canvasContainer.removeEventListener('mouseleave', endDrag)
    })

    //图像旋转
    const rotateImage = () => {
      if (!mat.value || !imageCanvas.value) return

      console.log('开始旋转')
      // 旋转图像
      const rotatedMat = new cv.Mat()
      cv.rotate(mat.value, rotatedMat, cv.ROTATE_90_CLOCKWISE)

      // 更新当前图像矩阵
      mat.value = markRaw(rotatedMat.clone())
      rotationAngle.value = (rotationAngle.value + 90) % 360 // 更新旋转角度

      // 更新画布上的图像
      loadImage(mat.value, imageCanvas.value)
      console.log('完成旋转')
    }

    //图像色彩空间调整
    const adjustBrightnessContrast = () => {
      console.log('进入亮度对比度调整')
      if (mat.value) {
        console.log('应用亮度对比度调整')
        console.log(typeof brightness.value, brightness.value)
        console.log(typeof contrast.value, contrast.value)

        previewMat.value = markRaw(
          changeBrightnessAndContrast(mat.value.clone(), brightness.value, contrast.value)
        )
        loadImage(previewMat.value, imageCanvas.value)
        console.log('完成亮度对比度调整')
      }
    }
    const adjustSaturation = () => {
      console.log('进入饱和度调整')
      if (mat.value) {
        console.log('开始应用饱和度调整')
        previewMat.value = markRaw(changeSaturation(mat.value, saturation.value))
        loadImage(previewMat.value, imageCanvas.value)
        console.log('完成饱和度调整')
      }
    }
    const adjustSharpening = () => {
      console.log('进入锐化调整')
      if (mat.value) {
        console.log('开始锐化调整')
        previewMat.value = markRaw(applyUnsharpMask(mat.value, sharpening.value))
        loadImage(previewMat.value, imageCanvas.value)
        console.log('完成锐化调整')
      }
      return
    }

    const handleWheel = (event: WheelEvent) => {
      if (isCropping.value) return
      event.preventDefault()
      const delta = event.deltaY ? -event.deltaY / 100 : 0

      // 确保当前 zoomValue 是一个有效数字
      if (typeof zoomValue.value !== 'number' || isNaN(zoomValue.value)) {
        zoomValue.value = 1 // 如果当前值无效，重置为默认值
      }

      let newZoom = zoomValue.value + delta * 0.25
      newZoom = Math.round(newZoom * 4) / 4 // 确保缩放步长为0.25
      newZoom = Math.max(0.25, Math.min(newZoom, 2)) // 限制缩放范围
      zoomValue.value = newZoom
    }

    onMounted(() => {
      const canvasContainer = document.querySelector('.canvas-container') as HTMLElement
      canvasContainer.addEventListener('wheel', handleWheel)
    })

    watch(zoomValue, () => {
      drawImageCanvasOnMainCanvas()
    })

    //高斯模糊
    const applyBlur = () => {
      if (mat.value) {
        console.log('应用高斯模糊')
        previewMat.value = markRaw(applyGaussinBlur(mat.value.clone(), blurStrength.value))
        loadImage(previewMat.value, imageCanvas.value)
      }
    }

    //图像裁剪
    const adjustCanvasForDPR = (canvas: HTMLCanvasElement) => {
      const dpr = window.devicePixelRatio || 1
      const rect = canvas.getBoundingClientRect()
      canvas.width = rect.width * dpr
      canvas.height = rect.height * dpr
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.scale(dpr, dpr)
      }
    }

    const getCanvasCoordinates = (event: MouseEvent, canvas: HTMLCanvasElement) => {
      const rect = canvas.getBoundingClientRect()
      const dpr = window.devicePixelRatio || 1
      const x = (event.clientX - rect.left) * (canvas.width / rect.width)
      const y = (event.clientY - rect.top) * (canvas.height / rect.height)
      return { x: x / dpr, y: y / dpr }
    }

    // 在 mounted 生命周期中调用
    onMounted(() => {
      if (mainCanvas.value) adjustCanvasForDPR(mainCanvas.value)
      if (overlayCanvas.value) adjustCanvasForDPR(overlayCanvas.value)
    })
    const enableCropMode = () => {
      isCropping.value = true
    }

    const startCrop = (event: MouseEvent) => {
      if (isCropping.value && overlayCanvas.value) {
        const coords = getCanvasCoordinates(event, overlayCanvas.value)
        cropStart.x = coords.x
        cropStart.y = coords.y
        cropEnd.x = cropStart.x
        cropEnd.y = cropStart.y
        isDrawing.value = true
      }
    }

    const drawCrop = (event: MouseEvent) => {
      if (isCropping.value && overlayCanvas.value) {
        const coords = getCanvasCoordinates(event, overlayCanvas.value)
        cropEnd.x = coords.x
        cropEnd.y = coords.y

        const ctx = overlayCanvas.value.getContext('2d')
        if (ctx && isDrawing.value) {
          ctx.clearRect(0, 0, overlayCanvas.value.width, overlayCanvas.value.height)
          ctx.strokeStyle = 'red'
          ctx.lineWidth = 2
          ctx.strokeRect(cropStart.x, cropStart.y, cropEnd.x - cropStart.x, cropEnd.y - cropStart.y)
        }
      }
    }

    const endCrop = () => {
      if (isCropping.value && mat.value && imageCanvas.value && mainCanvas.value) {
        isDrawing.value = false
        // 生成裁剪预览图
        const scale = baseScale.value * zoomValue.value
        const scaledWidth = imageCanvas.value.width * scale
        const scaledHeight = imageCanvas.value.height * scale

        const x = (mainCanvas.value.width - scaledWidth) / 2 + imagePosition.x
        const y = (mainCanvas.value.height - scaledHeight) / 2 + imagePosition.y

        const transform = (point: { x: number; y: number }) => {
          return {
            x: (point.x - x) / scale,
            y: (point.y - y) / scale
          }
        }

        console.log('开始调用crop函数', cropStart, cropEnd)
        previewMat.value = markRaw(crop(mat.value, transform(cropStart), transform(cropEnd)))
        console.log('完成调用crop函数')
        if (previewMat.value && imageCanvas.value) {
          console.log('imshow前')
          cv.imshow(imageCanvas.value, previewMat.value)
          console.log('imshow后')
        }
      }
    }
    const confirmCrop = () => {
      if (previewMat.value) {
        console.log('进入confirmCrop')
        mat.value = markRaw(previewMat.value.clone())
        loadImage(mat.value, imageCanvas.value)
        console.log('完成loadImage,confirmCrop')
        cancelCrop() // 完成裁剪后退出裁剪模式
      }
    }

    const cancelCrop = () => {
      isCropping.value = false
      previewMat.value = null
      if (overlayCanvas.value) {
        const ctx = overlayCanvas.value.getContext('2d')
        if (ctx) {
          ctx.clearRect(0, 0, overlayCanvas.value.width, overlayCanvas.value.height)
        }
      }
    }
    // 监听键盘事件，支持“Enter”键确认裁剪
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && isCropping.value) {
        confirmCrop()
      }
    }

    onMounted(() => {
      window.addEventListener('keydown', handleKeyPress)
    })

    onUnmounted(() => {
      window.removeEventListener('keydown', handleKeyPress)
    })
    //生成图片
    const generateImage = () => {
      if (previewMat.value) {
        saveHistory()
        mat.value = previewMat.value
      }
    }

    //主题切换
    const toggleTheme = () => {
      if (isNightMode.value) {
        document.body.classList.add('night-mode')
      } else {
        document.body.classList.remove('night-mode')
      }
    }

    return {
      //基础数据
      mainCanvas, //1
      imageCanvas, //1
      overlayCanvas, //1

      handleFileChange,
      loadImage,

      //操作重置
      reset,

      //操作撤销
      canUndo,
      saveHistory,
      undo,

      //图像缩放
      zoomValue,

      //图像拖拽
      isDragging,
      dragStart,
      imagePosition,

      //图像色彩空间变化
      brightness,
      contrast,
      saturation,
      sharpening,
      adjustBrightnessContrast,
      adjustSaturation,
      adjustSharpening,

      //图像旋转
      rotationAngle,
      rotateImage,
      //图像裁剪（已弃用）
      isCropping,
      enableCropMode,
      startCrop,
      drawCrop,
      endCrop,
      confirmCrop,
      cancelCrop,

      //高斯模糊
      applyBlur,
      blurStrength,

      //风格迁移
      handleModelChange,

      //主题切换
      isNightMode,
      toggleTheme,

      //生成图片
      generateImage
    }
  }
})
</script>

<style scoped>
/* 滑块样式 */
.switch {
  position: relative;
  display: inline-block;
  width: 40px;
  height: 20px;
}

.switch input {
  opacity: 0;
  width: 0;
  height: 0;
}

.slider {
  position: absolute;
  cursor: pointer;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: #ccc;
  transition: 0.4s;
  border-radius: 20px;
}

.slider:before {
  position: absolute;
  content: '';
  height: 16px;
  width: 16px;
  left: 2px;
  bottom: 2px;
  background-color: white;
  transition: 0.4s;
  border-radius: 50%;
}

input:checked + .slider {
  background-color: #2196f3;
}

input:checked + .slider:before {
  transform: translateX(20px);
}

/* 夜间模式样式 */
body.night-mode {
  background-color: #121212;
  color: #ffffff;
}

body.night-mode .header {
  background-color: #1f1f1f;
}

body.night-mode .editor-container,
body.night-mode .main-content {
  background-color: #2e2e2e;
  border-color: #444;
  color: #f4f4f4;
}

body.night-mode .slider-container,
body.night-mode .tools-container,
body.night-mode .image-container {
  background-color: #494848;
  border-color: #999898;
  color: #f4f4f4;
}

body.night-mode .actions button,
body.night-mode .tool-section button {
  background-color: #444;
  color: #f4f4f4;
}

body.night-mode label {
  color: #f4f4f4;
}
.editor-container {
  width: 100%;
  display: flex;
  flex-direction: column;
}

/*√*/
.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #333;
  color: white;
  padding: 10px;
}

/*√*/
.logo {
  display: flex;
  align-items: center;
}

/*√*/
.logo img {
  height: 40px;
  margin-right: 10px;
}

/*√*/
.actions button {
  background-color: #666;
  color: white;
  border: none;
  padding: 8px 12px;
  margin-left: 10px;
  cursor: pointer;
}

.main-content {
  display: flex;
  margin-top: 20px;
}

/* Slider container styles */
.slider-container {
  display: flex;
  flex-direction: column;
  padding: 20px;

  border-right: 2px solid #ccc; /* Visually separate from the image area */
  background-color: #f9f9f9; /* Light background for the sliders */
}

/* Individual slider bar styles */
.slider-bar {
  margin-bottom: 20px; /* Space out individual sliders */
  position: relative;
}

.slider-bar label {
  display: block; /* Make the label take the full width */
  margin-bottom: 5px; /* Space between the label and the slider */
  color: #333; /* Dark color for text for better readability */
  font-size: 14px; /* Slightly larger font size for readability */
}
.min-value,
.max-value {
  position: absolute;
  font-size: 12px;
}

.min-value {
  left: 0;
  top: 20px;
}

.max-value {
  right: 0;
  top: 20px;
}

.current-value {
  left: 50%;
  top: 3px;
  transform: translateX(-50%);
}

.slider-bar input[type='range'] {
  width: 100%; /* Full width sliders */
  cursor: pointer; /* Pointer cursor on hover */
}

.adjustments-confirm-buttons {
  text-align: center;
  color: white;
  border: none;
  padding: 8px 12px;
  margin-left: 10px;
}
.adjustments-confirm-buttons button {
  margin-right: 10px;
  cursor: pointer;
}

.image-container {
  width: 50%;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

/*√*/
.image-box {
  width: 100%;
  height: 400px; /* 定义固定高度 */
  border: 1px solid #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f4f4f4;
  overflow: hidden;
  position: relative;
}
/*√*/
.image-box img {
  max-width: 100%;
  max-height: 100%;
  transition: transform 0.2s ease;
}
/*√*/
.image-actions,
.zoom-controls {
  margin-top: 10px;
}
/*√*/
.image-actions button,
.zoom-controls button {
  background-color: #00a4ff;
  color: white;
  border: none;
  padding: 8px;
  margin-right: 10px;
  cursor: pointer;
}
/*√*/
.zoom-controls {
  width: 200px;
}
.zoom-controls input {
  width: 200px;
}

/*√*/
.tools-container {
  width: 50%;
  padding: 20px;
  background-color: #f9f9f9;
  border-left: 2px double #ccc; /* Visually separate from the image area */
}
/*√*/
.basic-tool-section {
  margin-bottom: 20px;
}
/*√*/
.tool-section {
  margin-bottom: 20px;
}
/*√*/
.tool-section h3 {
  font-size: 1.2em;
  margin-bottom: 10px;
}
/*√*/
.tool-section button {
  background-color: #555;
  color: white;
  border: none;
  padding: 8px;
  margin-right: 5px;
  cursor: pointer;
}
/*√*/
button {
  border-radius: 10px;
}
/*.crop-box {
  border: 2px dashed #00f;
  position: absolute;
}

.crop-controls {
  position: absolute;
  bottom: 10px;
  left: 50%;
  transform: translateX(-50%);
}

.crop-controls button {
  margin: 0 10px;
  font-size: 24px;
}*/
#generate {
  background-color: #28a745;
  color: white;
  padding: 10px;
  width: 100%;
  border: none;
  cursor: pointer;
}

/*√*/
.canvas-container {
  position: relative;
  width: 100%; /* Adjust based on your layout */
  height: 100%; /* Adjust based on your layout */
}

/*√*/
canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

input[type='range'] {
  width: 300px;
  margin-top: 10px;
}
</style>
