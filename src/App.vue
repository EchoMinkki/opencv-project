<template>
  <div id="app">
    <ImageEditor />
  </div>
</template>

<script>
import ImageEditor from './components/ImageEditor.vue';

export default {
  components: {
    ImageEditor,
  },
};
</script>

<style>
#app {
  font-family: 'Avenir', Helvetica, Arial, sans-serif;
  text-align: center;
  color: #2c3e50;
  margin-top: 0;
}
</style>
