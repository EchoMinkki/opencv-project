import * as cv from '@techstark/opencv-js'
import { defineComponent } from 'vue'

export default defineComponent({
  // 启用了类型推导
  props: {
    name: String,
    msg: { type: String, required: true }
  },
  data() {
    return {
      count: 1
    }
  },
  mounted() {
    this.name // 类型：string | undefined
    this.msg // 类型：string
    this.count // 类型：number
  }
})

export async function denoiseImage(inputImageElement: HTMLImageElement, outputCanvas: HTMLCanvasElement): Promise<void> {
  if (typeof cv === 'undefined') {
    throw new Error("OpenCV.js not loaded!");
  }
  return new Promise((resolve, reject) => {
    try {
      // Step 1: 读取输入图像
      const src = cv.imread(inputImageElement);

      // Step 2: 创建输出图像容器
      const dst = new cv.Mat(src)

      // Step 4: 将处理后的图像放入一个 HTML Canvas 元素
      cv.imshow(outputCanvas, dst);

      // Step 5: 释放内存
      src.delete();
      dst.delete();

      // 返回输出的 Canvas 元素
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}