<template>
  <div class="editor-container">
    <!-- 顶部横排 -->
    <div class="header">
      <div class="logo">
        <span>图片处理与风格化系统</span>
      </div>
      <div class="actions">
        <!-- <button @click="reset">重置</button>
        <button @click="undo" :disabled="!canUndo">撤销</button> -->
      </div>
    </div>

    <!-- 主体部分 -->
    <div class="main-content">
      <!-- 左侧图片显示区域 -->
      <div class="image-container">
        <div class="image-box" ref="imageBox">
          <div class="canvas-container">
            <canvas id="mainCanvas" ref="mainCanvas"></canvas>
            <canvas id="imageCanvas" ref="imageCanvas" style="display: none"></canvas>
            <!-- <canvas
              id="overlayCanvas"
              ref="overlayCanvas"
              @mousedown="startCrop"
              @mousemove="drawCrop"
              @mouseup="endCrop"
            >
            </canvas> -->
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
          <button>旋转</button>
          <button>去噪</button>
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
        <!-- 图像色彩空间改变工具 -->
        <!-- <div class="slideBar">
          <canvas ref="color-space-canvas"></canvas> -->
        <!-- 亮度 -->
        <!-- <div class="color-space-bar">
            <label for="brightness">亮度</label>
            <input type="range" id="brightness" min="-100" max="100" v-model="brightness" @input="adjustImage">
          </div> -->
        <!-- 对比度 -->
        <!-- <div class="color-space-bar">
            <label for="contrast">对比度</label>
            <input type="range" id="contrast" min="-100" max="100" v-model="contrast" @input="adjustImage">
          </div>
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
          <h3>图片风格化</h3>
          <button>冷暖滤镜</button>
          <button>素描滤镜</button>
          <button>卡通滤镜</button>
          <button>凸透镜滤镜</button>
          <button>漩涡滤镜</button>
          <button>风格迁移</button>
        </div>

        <button id="generate">生成图片</button>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw, ref, reactive, watch, onMounted, onUnmounted } from 'vue'
import * as cv from '@techstark/opencv-js'
import { applyGaussinBlur, fileToMat } from './components/image_util'

export default defineComponent({
  name: 'ImageLoader',
  setup() {
    const overlayCanvas = ref<HTMLCanvasElement | null>(null)
    const imageCanvas = ref<HTMLCanvasElement | null>(null)
    const mainCanvas = ref<HTMLCanvasElement | null>(null)
    const mat = ref<cv.Mat | null>(null)
    const originalMat = ref<cv.Mat | null>(null) // 保存原图
    const previewMat = ref<cv.Mat | null>(null) // 用于裁剪预览

    //图像缩放
    const baseScale = ref<number>(1)
    const zoomValue = ref<number>(1)

    //图像拖拽
    const isDragging = ref(false)
    const dragStart = reactive({ x: 0, y: 0 })
    const imagePosition = reactive({ x: 0, y: 0 })

    //图像裁剪
    const isCropping = ref<boolean>(false)
    const cropStart = reactive({ x: 0, y: 0 })
    const cropEnd = reactive({ x: 0, y: 0 })

    //高斯模糊
    const blurStrength = ref<number>(10) // 初始模糊强度

    const handleFileChange = (event: Event) => {
      console.log('1111')
      const files = (event.target as HTMLInputElement).files
      if (files) {
        fileToMat(files[0])
          .then((matResult) => {
            originalMat.value = markRaw(matResult.clone()) // 保存原图
            mat.value = markRaw(matResult.clone())
            loadImage(mat.value, imageCanvas.value)
          })
          .catch((error) => {
            console.error('Error loading image:', error)
          })
      }
    }

    const loadImage = (mat: cv.Mat | null, canvas: HTMLCanvasElement | null) => {
      if (!mainCanvas.value) return
      if (mat && canvas) {
        cv.imshow(canvas, mat)
        zoomValue.value = 1 // 重置缩放比例为1
        drawImageCanvasOnMainCanvas() // 使用新的缩放比例更新画布
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
      if (originalMat.value) {
        console.log('应用高斯模糊')
        mat.value = markRaw(applyGaussinBlur(originalMat.value.clone(), blurStrength.value))
        loadImage(mat.value, imageCanvas.value)
      }
    }

    return {
      //基础数据
      mainCanvas, //1
      imageCanvas, //1
      overlayCanvas, //1

      handleFileChange,
      loadImage,

      //图像缩放
      zoomValue,

      //图像拖拽
      isDragging,
      dragStart,
      imagePosition,

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
      blurStrength
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
