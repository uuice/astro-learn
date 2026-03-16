<template>
  <div class="vue-test section-card p-4" style="border-radius: var(--radius)">
    <h3 class="section-title" style="margin-bottom: 0.5rem;">
      <span class="section-prompt" style="color: var(--text-muted)">#</span> Vue 组件测试
    </h3>
    <p class="code-label" style="margin: 0.5rem 0;">
      <span style="color: var(--accent)">$</span> count: <strong style="color: var(--accent)">{{ count }}</strong>
    </p>
    <button
      type="button"
      class="comment-submit"
      @click="count++"
    >
      点击 +1
    </button>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const count = ref(0)
</script>
