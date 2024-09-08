<template>
  <div>
    <input type="file" @change="handleFileChange" />
    <button @click="loadImage">Load Image</button>
    <canvas ref="canvas"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent, markRaw, ref } from 'vue'
import * as cv from '@techstark/opencv-js'
import { fileToMat } from './components/image_util' // 确保路径正确

export default defineComponent({
  name: 'ImageLoader',
  setup() {
    const canvas = ref<HTMLCanvasElement | null>(null)
    const mat = ref<cv.Mat | null>(null)

    const handleFileChange = (event: Event) => {
      const files = (event.target as HTMLInputElement).files
      if (files) {
        fileToMat(files[0])
          .then((matResult) => {
            mat.value = markRaw(matResult)
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

    return {
      canvas,
      handleFileChange,
      loadImage
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

img {
  max-width: 500px;
  display: block;
  margin: 0 auto;
}

canvas {
  display: block;
  margin: 20px auto;
  border: 1px solid #ccc;
}
</style>
