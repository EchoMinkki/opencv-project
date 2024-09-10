// store/index.js
import { createStore } from 'vuex';

export default createStore({
    state: {
        originalMat: null,
        processedMat: null,
        blurStrength: 0
    },
    mutations: {
        setOriginalMat(state, payload) {
            state.originalMat = payload;
        },
        setProcessedMat(state, payload) {
            state.processedMat = payload;
        },
        setBlurStrength(state, payload) {
            state.blurStrength = payload;
        }
    },
    actions: {
        updateOriginalMat({ commit }, mat) {
            commit('setOriginalMat', mat);
        },
        updateProcessedMat({ commit }, mat) {
            commit('setProcessedMat', mat);
        },
        updateBlurStrength({ commit }, value) {
            commit('setBlurStrength', value);
        }
    }
});
