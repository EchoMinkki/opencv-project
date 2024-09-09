<template>
  <div>
    <input type="file" @change="handleFileChange" />
    <button @click="applyBlur">Apply Gaussian Blur</button>
    <div>
      <label for="blurRange">Blur Strength: {{ blurStrength }}</label>
      <input type="range" id="blurRange" min="0" max="100" v-model="blurStrength" @input="applyBlur" />
    </div>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw, ref } from 'vue'
import * as cv from '@techstark/opencv-js'
import { applyGaussinBlur, fileToMat } from './components/image_util' // 确保路径正确

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
            mat.value = matResult.clone()
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
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  text-align: center;
  margin-top: 20px;
}

canvas {
  display: block;
  margin: 20px auto;
  border: 1px solid #ccc;
}

input[type="range"] {
  width: 300px;
  margin-top: 10px;
}
</style>
