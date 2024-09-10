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
          <canvas ref="canvas"></canvas>
        </div>
        <div class="image-actions">
          <input type="file" @change="handleFileChange" />
          <button>下载图像</button>
        </div>
        <div class="zoom-controls">
          <button>放缩图片</button>
          <input type="range" min="0.25" :max="2" step="0.25" />
        </div>
        <!-- 裁剪确认/取消按钮 -->
        <!-- <div v-if="isCropping" class="crop-controls">
          <button @click="confirmCrop">✔</button>
          <button @click="cancelCrop">✘</button>
        </div> -->
      </div>

      <!-- 右侧编辑工具 -->
      <div class="tools-container">
        <div class="tool-section">
          <h3>基本图像处理</h3>
          <button>裁切</button>
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
import { defineComponent, markRaw, ref } from 'vue'
import * as cv from '@techstark/opencv-js'
import { applyGaussinBlur, fileToMat } from './components/image_util'

export default defineComponent({
  name: 'ImageLoader',
  setup() {
    const canvas = ref<HTMLCanvasElement | null>(null)
    const mat = ref<cv.Mat | null>(null)
    const originalMat = ref<cv.Mat | null>(null) // 保存原图
    const blurStrength = ref<number>(10) // 初始模糊强度

    const handleFileChange = (event: Event) => {
      const files = (event.target as HTMLInputElement).files
      if (files) {
        fileToMat(files[0])
          .then((matResult) => {
            originalMat.value = markRaw(matResult.clone()) // 保存原图
            mat.value = markRaw(matResult.clone())
            loadImage()
          })
          .catch((error) => {
            console.error('Error loading image:', error)
          })
      }
    }

    const loadImage = () => {
      if (mat.value && canvas.value) {
        cv.imshow(canvas.value, mat.value)
      }
    }

    const applyBlur = () => {
      if (originalMat.value) {
        mat.value = markRaw(applyGaussinBlur(originalMat.value.clone(), blurStrength.value))
        loadImage()
      }
    }

    return {
      canvas,
      handleFileChange,
      loadImage,
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

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: #333;
  color: white;
  padding: 10px;
}

.logo {
  display: flex;
  align-items: center;
}

.logo img {
  height: 40px;
  margin-right: 10px;
}

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

.image-box {
  width: 100%;
  height: 400px; /* 定义固定高度 */
  border: 1px solid #ccc;
  display: flex;
  justify-content: center;
  align-items: center;
  background-color: #f4f4f4;
  overflow: hidden;
}

.image-box img {
  max-width: 100%;
  max-height: 100%;
  transition: transform 0.2s ease;
}

.image-actions,
.zoom-controls {
  margin-top: 10px;
}

.image-actions button,
.zoom-controls button {
  background-color: #00a4ff;
  color: white;
  border: none;
  padding: 8px;
  margin-right: 10px;
  cursor: pointer;
}

.zoom-controls input {
  width: 35%;
}

.tools-container {
  width: 50%;
  padding: 20px;
  background-color: #f9f9f9;
}
.basic-tool-section{
  margin-bottom: 20px;
}
.tool-section {
  margin-bottom: 20px;
}

.tool-section h3 {
  font-size: 1.2em;
  margin-bottom: 10px;
}

.tool-section button {
  background-color: #555;
  color: white;
  border: none;
  padding: 8px;
  margin-right: 5px;
  cursor: pointer;
}
button {
  border-radius: 10px;
}
.crop-box {
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
}
#generate {
  background-color: #28a745;
  color: white;
  padding: 10px;
  width: 100%;
  border: none;
  cursor: pointer;
}

canvas {
  display: block;
  margin: 20px auto;
  border: 1px solid #ccc;
}

input[type='range'] {
  width: 300px;
  margin-top: 10px;
}
</style>
