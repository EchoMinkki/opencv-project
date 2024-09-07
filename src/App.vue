<template>
  <div>
    <input type="file" @change="handleFileUpload" accept="image/*" />
    
    <!-- 显示上传的原始图像 -->
    <img v-if="originalImage" :src="originalImage" ref="inputImage" @load="processImage" alt="Original Image" />
    
    <!-- 输出处理后的图像 -->
    <canvas ref="outputCanvas"></canvas>
  </div>
</template>

<script lang="ts">
import { defineComponent, ref, nextTick } from 'vue';
import { denoiseImage } from './components/image_util/denoise'; // 假设 denoiseImage 方法存在

export default defineComponent({
  name: 'App',
  setup() {
    const originalImage = ref<string | null>(null);
    const inputImage = ref<HTMLImageElement | null>(null);
    const outputCanvas = ref<HTMLCanvasElement | null>(null);

    const handleFileUpload = (event: Event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = () => {
          originalImage.value = reader.result as string;
        };
        reader.readAsDataURL(file);
      }
    };

    const processImage = async () => {
      if (inputImage.value && outputCanvas.value) {
        try {
          await denoiseImage(inputImage.value, outputCanvas.value);
        } catch (err) {
          console.error('Error during image denoising:', err);
        }
      }
    };

    return {
      originalImage,
      inputImage,
      outputCanvas,
      handleFileUpload,
      processImage,
    };
  },
});
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
