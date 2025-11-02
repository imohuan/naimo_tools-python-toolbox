<template>
  <button
    class="w-6 h-6 flex items-center justify-center rounded transition-all disabled:opacity-50"
    :class="colorClass"
    :title="title"
    :disabled="disabled || loading"
    @click="$emit('click')"
  >
    <Icon v-if="!loading" :name="icon" size="xs" />
    <div
      v-else
      class="w-2.5 h-2.5 border-2 rounded-full animate-spin"
      :class="spinnerClass"
    ></div>
  </button>
</template>

<script setup lang="ts">
import { computed } from "vue";
import Icon from "./Icon.vue";

type Variant = "blue" | "green" | "red";

interface Props {
  icon: string;
  loading?: boolean;
  disabled?: boolean;
  title?: string;
  variant?: Variant;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  disabled: false,
  title: "",
  variant: "blue" as Variant,
});

defineEmits<{ click: [] }>();

const colorClass = computed(() => {
  switch (props.variant) {
    case "green":
      return "text-green-600 hover:bg-green-50";
    case "red":
      return "text-red-600 hover:bg-red-50";
    default:
      return "text-blue-600 hover:bg-blue-50";
  }
});

const spinnerClass = computed(() => {
  switch (props.variant) {
    case "green":
      return "border-green-600 border-t-transparent";
    case "red":
      return "border-red-600 border-t-transparent";
    default:
      return "border-blue-600 border-t-transparent";
  }
});
</script>
