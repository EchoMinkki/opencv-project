<template>
  <div class="tool-section">
    <h3>基本图像处理</h3>
    <button>裁切</button>
    <button>旋转</button>
    <button>模糊</button>
    <div class="blur">
      <label for="blurRange">模糊力度：{{ blurStrength }}</label>
      <input type="range" id="blurRange" min="0" max="100" v-model="blurStrength" />
    </div>
  </div>
  <div class="tool-section">
    <h3>人像处理</h3>
    <button>人脸识别</button>
    <button>智能马赛克</button>
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
</template>

<script lang="ts">
import { defineComponent, ref } from 'vue'
export default defineComponent({
  name: 'ToolsBar',
  emits: ['update:blurStrength'],
  setup(props, { emit }) {
    const blurStrength = ref<number>(0) //初始模糊强度;

    function updateBlurStrength(value: number) {
      blurStrength.value = value
      emit('update:blurStrength', value)
    }
    return {
      blurStrength,
      updateBlurStrength
    }
  }
})
</script>
<style>
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
  border-radius: 10px;
  padding: 8px;
  margin-right: 5px;
  cursor: pointer;
}

#generate {
  background-color: #28a745;
  color: white;
  padding: 10px;
  width: 20%;
  border: none;
  cursor: pointer;
}
</style>
