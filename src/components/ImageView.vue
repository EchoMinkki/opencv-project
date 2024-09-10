<template>
  <!-- 图片显示区域 -->
  <div class="image-box" ref="imageBox">
    <div class="canvas-container">
      <canvas id="mainCanvas" ref="mainCanvas"></canvas>
      <canvas id="imageCanvas" ref="imageCanvas" style="display: none"></canvas>
      <canvas id="overlayCanvas" ref="overlayCanvas" style="display: none"></canvas>
    </div>
  </div>
  <div class="image-actions">
    <input type="file" id="upload-button" @change="handleFileChange" />
    <button id="download-button">下载图像</button>
  </div>
  <div class="zoom-controls">
    <input type="range" id="zoom-slider" min="0.25" max="2" step="0.25" />
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, markRaw, onMounted } from 'vue'
import * as cv from '@techstark/opencv-js'
import { fileToMat } from './image_util'
export default defineComponent({
  name: 'ImageView',
  emits: ['image-loaded', 'image-processed'],
  setup(props, { emit }) {
    const mainCanvas = ref<HTMLCanvasElement | null>(null)
    const imageCanvas = ref<HTMLCanvasElement | null>(null)
    const mat = ref<cv.Mat | null>(null)
    const originalMat = ref<cv.Mat | null>(null) // 保存原图

    const handleFileChange = (event: Event) => {
      console.log('222')
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
      console.log(canvas)
      if (mat && canvas) {
        console.log('LoadImage')
        const ctx = canvas.getContext('2d')
        if (ctx) {
          console.log('LoadImageppppppppppppppppp')
          cv.imshow(canvas, mat)
          emit('image-loaded', mat)
          drawImageCanvasOnMainCanvas()
        }
      }
    }

    const drawImageCanvasOnMainCanvas = () => {
      if (mainCanvas.value && imageCanvas.value) {
        const mainCtx = mainCanvas.value.getContext('2d')
        if (mainCtx) {
          const scale = Math.min(
            mainCanvas.value.width / imageCanvas.value.width,
            mainCanvas.value.height / imageCanvas.value.height
          )
          const x = (mainCanvas.value.width - scale * imageCanvas.value.width) / 2
          const y = (mainCanvas.value.height - scale * imageCanvas.value.height) / 2
          mainCtx.clearRect(0, 0, mainCanvas.value.width, mainCanvas.value.height)
          mainCtx.drawImage(
            imageCanvas.value,
            0,
            0,
            imageCanvas.value.width,
            imageCanvas.value.height,
            x,
            y,
            imageCanvas.value.width * scale,
            imageCanvas.value.height * scale
          )
        }
      }
    }

    onMounted(() => {
      if (mainCanvas.value) {
        mainCanvas.value.width = 800 // Set fixed size or use dynamic size
        mainCanvas.value.height = 600
      }
    })

    return {
      mainCanvas,
      handleFileChange
    }
  }
})
</script>

<style>
.image-box {
  width: 100%;
  height: 500px;
  border: 1px solid #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f4f4f4;
  overflow: hidden;
  position: relative;
}

.image-actions,
.zoom-controls {
  margin-top: 10px;
}

.canvas-container {
  position: relative;
  width: 100%; /* Adjust based on your layout */
  height: 100%; /* Adjust based on your layout */
}

canvas {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  cursor: crosshair;
}
#upload-button,
#download-button {
  background-color: #7db4d1;
  color: white;
  border: none;
  padding: 8px;
  margin-right: 10px;
  cursor: pointer;
}

#zoom-slider {
  width: 35%;
}
</style>
