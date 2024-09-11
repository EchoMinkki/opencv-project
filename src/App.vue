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
      </div>
    </div>

    <!-- 主体部分 -->
    <div class="main-content">
      <!-- 左侧图片色彩空间调整区域 -->
      <div class="slider-container">
        <div class="slider-bar">
          <label for="brightness">亮度</label>
          <span class="min-value">-100</span>
          <input
            type="range"
            id="brightness"
            min="-100"
            max="100"
            v-model.number="brightness"
            @input="adjustBrightnessContrast"
          />
          <span class="max-value">100</span>
          <span class="current-value">{{ brightness }}</span>
        </div>
        <div class="slider-bar">
          <label for="contrast">对比度</label>
          <span class="min-value">-100</span>
          <input
            type="range"
            id="brightness"
            min="-100"
            max="100"
            v-model.number="contrast"
            @input="adjustBrightnessContrast"
          />
          <span class="max-value">100</span>
          <span class="current-value">{{ contrast }}</span>
        </div>
        <div class="slider-bar">
          <label for="saturation">饱和度</label>
          <span class="min-value">-100</span>
          <input
            type="range"
            id="saturation"
            min="-100"
            max="100"
            v-model.number="saturation"
            @input="adjustSaturation"
          />
          <span class="max-value">100</span>
          <span class="current-value">{{ saturation }}</span>
        </div>
        <div class="slider-bar">
          <label for="sharpening">锐化</label>
          <span class="min-value">-100</span>
          <input
            type="range"
            id="sharpening"
            min="-100"
            max="100"
            v-model.number="sharpening"
            @input="adjustSharpening"
          />
          <span class="max-value">100</span>
          <span class="current-value">{{ sharpening }}</span>
        </div>
        <!-- <div class="adjustments-confirm-buttons">
          <button @click="confirmAdjustments">√</button>
          <button @click="cancelAdjustments">×</button>
        </div> -->
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
          <button @click="applyBlur">模糊</button>
          <div class="blur">
            <label for="blurRange">Blur Strength: {{ blurStrength }}</label>
            <input
              type="range"
              id="blurRange"
              min="0"
              max="100"
              v-model="blurStrength"
              @input="applyBlur"
            />
          </div>
        </div>
        <!-- 图像调整工具 -->
        <!-- <div class="tool-section">
          <h3>图像调整</h3>
          <button @click="selectAdjustment('brightness')">亮度</button>
          <button @click="selectAdjustment('contrast')">对比度</button>
          <button @click="selectAdjustment('saturation')">饱和度</button>
          <button @click="selectAdjustment('sharpening')">锐化</button> -->

        <!-- 动态显示滑动条 -->
        <!-- <div v-if="selectedAdjustment" class="slider-bar">
            <label :for="selectedAdjustment">{{ adjustmentLabel }}</label>
            <span class="min-value">-100</span>
            <input
              type="range"
              :id="selectedAdjustment"
              min="-100"
              max="100"
              v-model="currentValue"
              @input="applyAdjustment"
            />
            <span class="max-value">100</span>
            <span class="current-value">{{ currentValue }}</span>
          </div>
        </div>

        <div class="adjustments-confirm-buttons">
          <button @click="confirmAdjustments">√</button>
          <button @click="cancelAdjustments">×</button>
        </div> -->

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

        <button id="generate">生成图片</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw, ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import * as cv from '@techstark/opencv-js'
import {
  applyGaussinBlur,
  changeBrightnessAndContrast,
  fileToMat,
  styleTransfer
} from './components/image_util'
import { builtinModules } from 'module'

export default defineComponent({
  name: 'ImageLoader',
  setup() {
    const overlayCanvas = ref<HTMLCanvasElement | null>(null)
    const imageCanvas = ref<HTMLCanvasElement | null>(null)
    const mainCanvas = ref<HTMLCanvasElement | null>(null)
    const mat = ref<cv.Mat | null>(null) //当前状态
    const originalMat = ref<cv.Mat | null>(null) // 保存原图，用于重置
    const previewMat = ref<cv.Mat | null>(null) // 用于暂时预览

    // 图像历史记录栈
    const historyStack = ref<cv.Mat[]>([]) // 存储历史记录
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
    const cropStart = reactive({ x: 0, y: 0 })
    const cropEnd = reactive({ x: 0, y: 0 })

    //高斯模糊
    const blurStrength = ref<number>(10) // 初始模糊强度

    //图像基础操作
    const handleFileChange = (event: Event) => {
      console.log('1111')
      const files = (event.target as HTMLInputElement).files
      if (files) {
        fileToMat(files[0])
          .then((matResult) => {
            originalMat.value = markRaw(matResult.clone()) // 保存原图，用于重置
            mat.value = markRaw(matResult.clone())
            zoomValue.value = 1 // 重置缩放比例为1
            loadImage(mat.value, imageCanvas.value)
          })
          .catch((error) => {
            console.error('Error loading image:', error)
          })
      }
    }

    // const handleStyleChange = () => {
    //   if (mat.value) {
    //     styleTransfer(mat.value, 'candy').then((matResult) => {
    //       mat.value = markRaw(matResult.clone())
    //       loadImage(mat.value, imageCanvas.value)
    //     })
    //   }
    // }

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
      if (mat.value) {
        styleTransfer(mat.value, selectedStyle)
          .then((matResult) => {
            mat.value = markRaw(matResult.clone())
            loadImage(mat.value, imageCanvas.value)
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
      blurStrength.value = 0
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
      // if (mat.value) {
      //   console.log('保存历史记录')
      //   if (historyStack.value.length >= MAX_HISTORY_LENGTH) {
      //     historyStack.value.shift() // 当超过最大历史记录数时，移除最早的记录
      //   }
      //   historyStack.value.push(mat.value.clone()) // 保存当前图像状态
      //   canUndo.value = historyStack.value.length > 0 // 更新撤销按钮状态
      // }
    }

    const undo = () => {
      if (historyStack.value.length > 0) {
        console.log('应用撤销', historyStack.value.length)
        const previousMat = historyStack.value.pop() // 取出上一步的图像状态
        if (previousMat && imageCanvas.value) {
          console.log('准备更新当前图像状态', historyStack.value.length)
          mat.value = markRaw(previousMat.clone()) // 更新当前图像状态
          console.log('完成更新当前图像状态', historyStack.value.length)
          cv.imshow(imageCanvas.value, mat.value) // 显示更新后的图像
          drawImageCanvasOnMainCanvas() // 重新渲染图像
        }
        console.log('完成撤销', historyStack.value.length)
        canUndo.value = historyStack.value.length > 0 // 更新撤销按钮状态
      }
    }

    //图像拖拽
    const startDrag = (event: MouseEvent) => {
      if (mainCanvas.value) {
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

    const confirmAdjustments = () => {
      //TODO
      return
    }
    //图像旋转
    const rotateImage = () => {
      if (!mat.value || !imageCanvas.value) return

      saveHistory() // 旋转前保存当前状态
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

    //图像色彩空间调整、
    const adjustBrightnessContrast = () => {
      console.log('进入亮度对比度调整')
      if (originalMat.value) {
        console.log('应用亮度对比度调整')
        console.log(typeof brightness.value, brightness.value)
        console.log(typeof contrast.value, contrast.value)

        mat.value = markRaw(
          changeBrightnessAndContrast(originalMat.value.clone(), brightness.value, contrast.value)
        )
        loadImage(mat.value, imageCanvas.value)
        console.log('完成亮度对比度调整')
      }
    }
    const adjustSaturation = () => {
      return
    }
    const adjustSharpening = () => {
      return
    }
    //图像裁剪（已弃用）
    const enableCropMode = () => {
      isCropping.value = true
    }

    const startCrop = (event: MouseEvent) => {
      if (!isCropping.value || !overlayCanvas.value) return
      const canvasRect = overlayCanvas.value.getBoundingClientRect()
      // 设置起点，确保不会出现负数
      cropStart.x = event.clientX - canvasRect.left
      cropStart.y = event.clientY - canvasRect.top
      console.log('起点', cropStart.x, cropStart.y)
    }

    const drawCrop = (event: MouseEvent) => {
      if (!isCropping.value || !overlayCanvas.value || (cropStart.x === 0 && cropStart.y === 0))
        return
      const ctx = overlayCanvas.value.getContext('2d')
      if (!ctx) return

      const canvasRect = overlayCanvas.value.getBoundingClientRect()
      // 动态更新终点
      cropEnd.x = event.clientX - canvasRect.left
      cropEnd.y = event.clientY - canvasRect.top

      // 清除之前的绘制
      ctx.clearRect(0, 0, overlayCanvas.value.width, overlayCanvas.value.height)

      // 计算矩形的实际起点和尺寸
      const x = Math.min(cropStart.x, cropEnd.x)
      const y = Math.min(cropStart.y, cropEnd.y)
      const width = Math.abs(cropEnd.x - cropStart.x)
      const height = Math.abs(cropEnd.y - cropStart.y)

      // 绘制矩形
      ctx.beginPath()
      ctx.rect(x, y, width, height)
      ctx.strokeStyle = 'red'
      ctx.stroke()
      console.log('矩形长宽信息', width, height)
    }

    const endCrop = () => {
      if (!isCropping.value) return
      console.log('endCrop')
      isCropping.value = false
      const rect = new cv.Rect(
        cropStart.x,
        cropStart.y,
        cropEnd.x - cropStart.x,
        cropEnd.y - cropStart.y
      )
      if (!originalMat.value) return
      previewMat.value = originalMat.value.roi(rect)
      if (!overlayCanvas.value) return
      cv.imshow(overlayCanvas.value, previewMat.value)
    }
    const confirmCrop = () => {
      if (previewMat.value) {
        console.log('confirmCrop')
        mat.value = previewMat.value.clone() // 确认裁剪，更新mat
        if (!mainCanvas.value) return
        cv.imshow(mainCanvas.value, mat.value) // 显示更新后的图像
        console.log('Update image')
      }

      if (!overlayCanvas.value) return
      const ctx = overlayCanvas.value.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, overlayCanvas.value.width, overlayCanvas.value.height) // 清除裁剪框
      isCropping.value = false // 重置裁剪状态
    }

    const cancelCrop = () => {
      if (!mainCanvas.value || !mat.value) return
      cv.imshow(mainCanvas.value, mat.value) // 显示原始未裁剪的图像

      if (!overlayCanvas.value) return
      const ctx = overlayCanvas.value.getContext('2d')
      if (!ctx) return
      ctx.clearRect(0, 0, overlayCanvas.value.width, overlayCanvas.value.height) // 清除裁剪框
      isCropping.value = false // 重置裁剪状态
    }

    const handleWheel = (event: WheelEvent) => {
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
        // saveHistory() // 在应用模糊之前保存当前状态
        console.log('应用高斯模糊')
        previewMat.value = markRaw(applyGaussinBlur(mat.value.clone(), blurStrength.value))
        loadImage(previewMat.value, imageCanvas.value)
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
      enableCropMode,
      startCrop,
      drawCrop,
      endCrop,
      confirmCrop,
      cancelCrop,
      isCropping,

      //高斯模糊
      applyBlur,
      blurStrength,

      //风格迁移
      handleModelChange
    }
  }
})
</script>

<style scoped>
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
  margin-right: 20px; /* Ensure it does not touch the image container */
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
.max-value,
.current-value {
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
