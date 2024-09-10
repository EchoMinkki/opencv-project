<template>
  <div class="cold_filter">
    <input
      type="range"
      v-model="filterValue"
      min="0"
      :max="1"
      step="0.25"
      @input="handleColdFilter"
    />
  </div>
</template>

<script>
export default {
  data() {
    return {
      filterValue: 1
    }
  },
  methods: {
    handleColdFilter() {
      console.log('处理冷色滤镜')
    }
  }
}
</script>

<style>
.cold_filter input {
  width: 35%;
}
</style>
