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
      <!-- 左侧图片显示区域 -->
      <div class="image-container">
        <div class="image-box" ref="imageBox" @wheel="handleWheel">
          <img
            v-if="imageUrl"
            :src="imageUrl"
            alt="Uploaded Image"
            ref="image"
            @load="onImageLoaded" 
            :style="{ transform: 'scale(' + zoomValue + ')', maxWidth: maxWidth, maxHeight: maxHeight }"
          />
          <!-- 裁剪框 -->
          <div v-if="isCropping" class="crop-box" :style="cropBoxStyle" @mousedown="startDraggingCropBox " 
          @mousemove="onDragCropBox" @mouseup="stopDraggingCropBox" @mouseleave="stopDraggingCropBox"></div>
        </div>
        <div class="image-actions">
          <input type="file" @change="uploadImage" />
          <button @click="downloadImage">下载图像</button>
        </div>
        <div class="zoom-controls">
          <button>放缩图片</button>
          <input type="range" v-model="zoomValue" min="0.25" :max="maxZoom" step="0.25" @input="handleZoom" />
        </div>
        <!-- 裁剪确认/取消按钮 -->
        <div v-if="isCropping" class="crop-controls">
          <button @click="confirmCrop">✔</button>
          <button @click="cancelCrop">✘</button>
        </div>
      </div>

      <!-- 右侧编辑工具 -->
      <div class="tools-container">
        <div class="tool-section">
          <h3>基本图像处理</h3>
          <button @click="startCropping">裁切</button>
          <button @click="applyTool('rotate')">旋转</button>
          <button @click="applyTool('denoise')">去噪</button>
        </div>

        <div class="tool-section">
          <h3>人像处理</h3>
          <button @click="applyTool('face-detect')">人脸识别</button>
          <button @click="applyTool('blur-face')">打马赛克</button>
          <button @click="applyTool('extract-face')">抠图</button>
          <button @click="applyTool('replace-bg')">替换背景</button>
          <button @click="applyTool('emotion-detect')">情绪识别</button>
        </div>

        <div class="tool-section">
          <h3>图片风格化</h3>
          <button @click="applyTool('cool-warm-filter')">冷暖滤镜</button>
          <button @click="applyTool('sketch-filter')">素描滤镜</button>
          <button @click="applyTool('cartoon-filter')">卡通滤镜</button>
          <button @click="applyTool('convex-lens')">凸透镜滤镜</button>
          <button @click="applyTool('swirl-filter')">漩涡滤镜</button>
          <button @click="applyTool('style-transfer')">风格迁移</button>
        </div>

        <button id="generate" @click="generateImage">生成图片</button>
      </div>
    </div>
  </div>
</template>

<script>
import { defineComponent, markRaw, ref } from 'vue'
import * as cv from '@techstark/opencv-js'
import { fileToMat } from './image_util'
export default {
  data() {
    return {
      imageFile:null,
      imageUrl: null, // 存储上传的图像
      initialImageUrl:null,
      history:[],//用于存储历史记录
      maxHistory:5,//最大历史记录数
      zoomValue: 1, // 缩放值
      maxZoom: 2, // 最大缩放比例
      maxWidth: '100%', // 限制图片最大宽度
      maxHeight: '100%', // 限制图片最大高度
      canUndo:false,//控制撤销按钮的使用状态
      isCropping: false, // 是否处于裁剪状态
      cropBox: { top: 0, left: 0, width: 100, height: 100 }, // 裁剪框位置和大小
      cropStartPos: { x: 0, y: 0 }, // 用于拖动裁剪框的起始位置
      isDragging: false, // 是否在拖动裁剪框
      imageDimensions: { width: 0, height: 0 }, // 图片的原始宽高
    };
  },
  mounted() {
    // 组件挂载后，计算图片的最大缩放比例
    this.calculateMaxZoom();
    this.$refs.imageContainer.addEventListener('wheel', this.handleWheel);
    window.addEventListener('resize', this.calculateMaxZoom);
  },
  beforeDestroy() {
    this.$refs.imageContainer.removeEventListener('wheel', this.handleWheel);
    // 移除窗口大小调整监听
    window.removeEventListener('resize', this.calculateMaxZoom);
  },
    computed:{
    cropBoxStyle() {
      return {
        top: this.cropBox.top + 'px',
        left: this.cropBox.left + 'px',
        width: this.cropBox.width + 'px',
        height: this.cropBox.height + 'px',
        position: 'absolute',
        border: '2px dashed #00f',
      };
  },
},
  methods: {
    // 上传图片
    uploadImage(event) {
      const file = event.target.files[0];
      if (file) {
        const newImageUrl=URL.createObjectURL(file)
        this.imageFile=file;
        this.imageUrl = newImageUrl;
        this.initialImageUrl=newImageUrl;
        this.history.append(this.imageUrl)
        this.zoomValue=1;
        this.canUndo=false;
        this.$nextTick(() => {
          // 在图片加载后计算最大缩放比例
          this.calculateMaxZoom();
          this.onImageLoaded();
        });
      }
    },
    // 下载图片
    downloadImage() {
      const link = document.createElement('a');
      link.href = this.imageUrl;
      link.download = 'edited-image.png';
      link.click();
    },
    
    // 计算最大缩放比例，确保图片不会超过容器
    calculateMaxZoom() {
      const imageBox = this.$refs.image.parentElement; // 获取 image-box 的元素
      if (this.$refs.image && imageBox) {
        const naturalWidth = this.$refs.image.naturalWidth;
        const naturalHeight = this.$refs.image.naturalHeight;
        const boxWidth = imageBox.clientWidth;
        const boxHeight = imageBox.clientHeight;

        // 计算最大缩放比例，图片的宽高不能超过容器的宽高
        const widthRatio = boxWidth / naturalWidth;
        const heightRatio = boxHeight / naturalHeight;
        this.maxZoom = Math.min(widthRatio, heightRatio);
      }
    },
    // 图片缩放处理
    handleZoom() {
      if (this.zoomValue > this.maxZoom) {
        this.zoomValue = this.maxZoom;
      }
      this.saveToHistory();
    },
    handleWheel(event){
      console.log("Wheel event triggered")
      event.preventDefault();
      const delta=event.deltaY;

      //根据滚动方向调整缩放值
      if(delta<0)
      {
        this.zoomValue=Math.min(this.zoomValue+0.1,this.maxZoom);
      }
      else{
        this.zoomValue=Math.max(this.zoomValue-0.1,0.25);
      }
      this.handleZoom();
    },
    // 当图片加载完成时，获取图片的尺寸
    onImageLoaded() {
      console.log("OnImageLoaded")
      const image = this.$refs.image;
      this.imageDimensions = {
        width: image.naturalWidth,
        height: image.naturalHeight,
      };

      // 初始化裁剪框的位置和大小
      this.initializeCropBox();
    },

    // 初始化裁剪框的位置和大小
    initializeCropBox() {
      console.log("初始化裁剪框位置和大小")
      const imageBox = this.$refs.imageBox;
      const image = this.$refs.image;

      // 将裁剪框初始化在图片的中间
      this.cropBox.width = imageBox.clientWidth / 2;
      this.cropBox.height = imageBox.clientHeight / 2;
      this.cropBox.top = (imageBox.clientHeight - this.cropBox.height) / 2;
      this.cropBox.left = (imageBox.clientWidth - this.cropBox.width) / 2;
    },

    //启动裁剪模式
    startCropping() {
      this.isCropping = true;
    },
    //取消裁剪
    cancelCrop() {
      this.isCropping = false;
    },
    //开始拖动裁剪框
    startDraggingCropBox(event) {
      if (this.isCropping) {
        console.log("开始拖动裁剪框")
        this.isDragging = true;
        this.cropStartPos = { x: event.clientX, y: event.clientY };
      }
    },
    //拖动裁剪框
    onDragCropBox(event) {
      if (this.isCropping && this.isDragging) {
    if (!this.$refs.imageBox) {
      console.error("imageBox ref is not available");
      return; // Exit the function if imageBox is not available
    }
    
    const deltaX = event.clientX - this.cropStartPos.x;
    const deltaY = event.clientY - this.cropStartPos.y;

    // Update crop box position, but restrict it within the image area
    this.cropBox.left = Math.max(0, Math.min(this.cropBox.left + deltaX, this.$refs.imageBox.clientWidth - this.cropBox.width));
    this.cropBox.top = Math.max(0, Math.min(this.cropBox.top + deltaY, this.$refs.imageBox.clientHeight - this.cropBox.height));

    this.cropStartPos = { x: event.clientX, y: event.clientY };
  }
    },

    // 停止拖动裁剪框
    stopDraggingCropBox() {
      console.log("停止拖动裁剪框")
      this.isDragging = false;
    },

    // 确认裁剪
    confirmCrop() {
      const image = this.$refs.image;
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      // 计算缩放比例
      const scaleX = image.naturalWidth / this.$refs.imageBox.clientWidth;
      const scaleY = image.naturalHeight / this.$refs.imageBox.clientHeight;

      // 设置 canvas 大小为裁剪框大小
      canvas.width = this.cropBox.width * scaleX;
      canvas.height = this.cropBox.height * scaleY;

      // 在 canvas 上裁剪图片
      ctx.drawImage(
        image,
        this.cropBox.left * scaleX, // 裁剪区域的起始x
        this.cropBox.top * scaleY,  // 裁剪区域的起始y
        this.cropBox.width * scaleX, // 裁剪区域的宽度
        this.cropBox.height * scaleY, // 裁剪区域的高度
        0,
        0,
        canvas.width,
        canvas.height
      );

      // 更新图片URL为裁剪后的图片
      this.imageUrl = canvas.toDataURL();
      this.isCropping = false; // 退出裁剪模式
      this.saveToHistory();
    },
    // 重置功能
    reset() {
      if (this.initialImageUrl) {
        this.imageUrl = this.initialImageUrl;
        this.zoomValue = 1; // 重置缩放值
        this.history = []; // 清空历史记录
        this.canUndo = false; // 禁用撤销按钮
      }
    },
    // 撤销功能
    undo() {
      alert("撤销操作");
      if (this.history.length > 0) {
        const previousState = this.history.pop(); // 弹出最后一个历史记录
        this.imageUrl = previousState.imageUrl;
        this.zoomValue = previousState.zoomValue;
        this.canUndo = this.history.length > 0; // 如果还有历史记录，保持撤销按钮启用
      }
    },
    // 保存当前状态到历史记录
    saveToHistory() {
      if (this.history.length >= this.maxHistory) {
        this.history.shift(); // 超过最大记录数时，移除最早的记录
      }
      this.history.push({
        imageUrl: this.imageUrl,
        zoomValue: this.zoomValue,
      });
      this.canUndo = true; // 启用撤销按钮
    },
    // 生成图片
    generateImage() {
      alert('生成最终图片');
      this.saveToHistory(); // 在生成图片时保存当前状态到历史记录
    },
  },
};
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

.image-actions, .zoom-controls {
  margin-top: 10px;
}

.image-actions button, .zoom-controls button {
  background-color: #00A4FF;
  color: white;
  border: none;
  padding: 8px;
  margin-right: 10px;
  cursor: pointer;
}

.zoom-controls input {
  width: 35%
}

.tools-container {
  width: 50%;
  padding: 20px;
  background-color: #f9f9f9;
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
button{
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
</style>
