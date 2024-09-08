<template>
  <div id="app">
    <header>
      <div class="left-header">
        <img src="./src/assets/icon.png" alt="icon" class="icon">
        <span>图像处理与风格化系统</span>
      </div>
      <div class="right-header">
        <button @click="reset">重置</button>
        <button @click="undo">撤销</button>
      </div>
    </header>
      <div class="main-container">
        <div class="left-image-container">
          <div class="image-frame">
            <img v-if="imageUrl" :src="imageUrl" alt="Uploaded Image" class="uploaded-image"/>
          </div>
          <input type="file" @change="onFileChange" class="upload-button"/>
          <div class="sample-images">
            <p>没有图片没关系，可以试试这些图片:</p>
            <div class="samples">
              <img src="./src/assets/samples/sample1.png" alt="Sample1">
              <img src="./src/assets/samples/sample2.png" alt="Sample2">
              <img src="./src/assets/samples/sample3.png" alt="Sample3">
              <img src="./src/assets/samples/sample4.png" alt="Sample4">
              <img src="./src/assets/samples/sample5.png" alt="Sample5">
            </div>
          </div>
        </div>
        <div class="right-editor-container">
          <h2>选择图像处理方式</h2>
          <div class="operations-group">
            <h3>图像基本处理</h3>
            <button @click="processImage('crop')">裁切</button>
            <button @click="processImage('rotate')">旋转</button>
            <button @click="processImage('blur')">模糊</button>
            <button @click="processImage('denoise')">去噪</button>
          </div>
          <div class="operations-group">
            <h3>人像处理</h3>
            <button @click="processImage('face-recognition')">人脸识别</button>
            <button @click="processImage('face-pixelating')">智能马赛克</button>
            <button @click="processImage('face-extraction')">智能抠图</button>
            <button @click="processImage('background-replacement')">背景替换</button>
            <button @click="processImage('emotion-detection')">情绪识别</button>
          </div>
          <div class="operations-group">
            <h3>图像风格化处理</h3>
            <button @click="processImage('filter-cool')">冷色滤镜</button>
          <button @click="processImage('filter-warm')">暖色滤镜</button>
          <button @click="processImage('sketch')">素描滤镜</button>
          <button @click="processImage('cartoon')">卡通滤镜</button>
          <button @click="processImage('convex-lens')">凸透镜滤镜</button>
          <button @click="processImage('swirl')">漩涡滤镜</button>
          <button @click="processImage('style-transfer')">风格迁移</button>
          </div>
          <button class="generate button" @click="generateImage">生成图片</button>
        </div>
      </div>
    </div>  
</template>

<script>
export default {
  data() {
    return {
      imageUrl: null,
      imageFile: null,
      history:[],
    };
  },
  methods: {
    onFileChange(event) {
      const file = event.target.files[0];
      if (file) {
        this.imageFile = file;
        this.imageUrl = URL.createObjectURL(file);
        this.history.push(this.imageUrl)
      }
    },
    processImage(file,operation) {
      if(this.imageFile){
        console.log("处理${file}图像操作：${operation}");
      }
    },
    reset(){
      this.imageUrl=this.history[0];
      this.history=[];
      this.history.push(this.imageUrl);
    },
    undo(){
      if (this.history.length > 1) {
        this.history.pop();
        this.imageUrl = this.history[this.history.length - 1];
      }
    },
    generateImage(){
      console.log('生成图片')
    }
  },
};
</script>

<style scoped>
body {
  background-color: #222; /* 根据图片中的背景色设置 */
  color: #fff;
  font-family: Avenir, Helvetica, Arial, sans-serif;
  margin: 0;
  padding: 0;
  height: 100vh;
  display: flex;
  flex-direction: column;
}

header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  background-color: gray;
  border: double 2px;
  padding: 10px;
  width: 100%;
}

.header-left {
  display: flex;
  align-items: center;
}

.icon {
  width: 30px;
  height: 30px;
  margin-right: 10px;
}

.header-right button {
  margin-left: 10px;
  padding: 5px 10px;
  /*background-color: #555;*/
  border: none;
  color: #fff;
  cursor: pointer;
  border-radius: 10px;
}

.main-container {
  display: flex;
  justify-content: space-between;
  padding: 20px;
  flex: 1;
}

.left-image-container {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
}
.left-image-container p{
  border: dashed 1px;
  border-radius: 20px;
}

.image-frame {
  width: 400px; /* 固定宽度 */
  height: 400px; /* 固定高度 */
  overflow: hidden;
  position: relative;
  margin-top: 20px;
  border: 2px dashed #555;
  display: flex;
  justify-content: center;
  align-items: center;
}

.upload-button {
  position: relative;
  margin-top: 10px;
  cursor: pointer;
}

.uploaded-image {
  max-width: 100%;
  max-height: 100%;
  object-fit: contain; /* 等比例拉伸 */
}

.sample-images {
  text-align: center;
  margin-top: 20px;
}

.samples {
  display: flex;
  justify-content: center;
}

.samples img {
  width: 50px;
  height: 50px;
  margin: 5px;
  cursor: pointer;
}

.right-editor-container {
  flex: 1;
  background-color: gray;
  padding: 20px;
  border-radius: 10px;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
}

.operations-group {
  margin-bottom: 20px;
}

.operations-group h3 {
  margin-bottom: 10px;
}

.operations-group button {
  margin-right: 10px;
  padding: 5px 10px;
  background-color: #555;
  border: solid 1px;
  border-radius: 20px;
  color: #e6e4e4;
  cursor: pointer;
}

.generate-button {
  padding: 10px 20px;
  background-color: #555;
  border: none;
  color: #fff;
  cursor: pointer;
}
</style>
