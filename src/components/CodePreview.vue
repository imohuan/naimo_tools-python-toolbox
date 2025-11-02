<template>
  <pre class="code-preview">{{ content }}</pre>
</template>

<script setup lang="ts">
interface Props {
  content: string;
}

defineProps<Props>();
</script>
