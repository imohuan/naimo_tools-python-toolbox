<template>
  <button
    :class="[
      'btn',
      variantClass,
      sizeClass,
      { 'opacity-50 cursor-not-allowed': disabled || loading },
    ]"
    :disabled="disabled || loading"
    @click="handleClick"
  >
    <span v-if="loading" class="loading-spinner"></span>
    <slot />
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";

interface Props {
  variant?: "primary" | "secondary" | "success" | "danger" | "outline";
  size?: "xs" | "sm" | "md" | "lg";
  disabled?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  variant: "primary",
  size: "md",
  disabled: false,
  loading: false,
});

const emit = defineEmits<{
  click: [];
}>();

const variantClass = computed(() => {
  const variants = {
    primary: "btn-primary",
    secondary: "btn-secondary",
    success: "btn-success",
    danger: "btn-danger",
    outline: "btn-outline",
  };
  return variants[props.variant];
});

const sizeClass = computed(() => {
  const sizes = {
    xs: "px-2 py-1 text-xs h-[26px]",
    sm: "px-2.5 py-1 text-xs h-[26px]",
    md: "px-3 py-1.5 text-sm",
    lg: "px-4 py-2 text-base",
  };
  return sizes[props.size];
});

function handleClick() {
  if (!props.disabled && !props.loading) {
    emit("click");
  }
}
</script>
