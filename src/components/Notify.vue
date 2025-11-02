<template>
  <Teleport to="body">
    <TransitionGroup
      name="notify"
      tag="div"
      class="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none"
    >
      <div
        v-for="item in notifications"
        :key="item.id"
        class="pointer-events-auto min-w-[320px] max-w-[480px] bg-white rounded-lg shadow-lg border p-2.5 flex items-start gap-2.5"
        :class="{
          'border-green-200 bg-green-50': item.type === 'success',
          'border-red-200 bg-red-50': item.type === 'error',
          'border-blue-200 bg-blue-50': item.type === 'info',
          'border-yellow-200 bg-yellow-50': item.type === 'warning',
        }"
      >
        <div
          class="flex-shrink-0 mt-0.5"
          :class="{
            'text-green-600': item.type === 'success',
            'text-red-600': item.type === 'error',
            'text-blue-600': item.type === 'info',
            'text-yellow-600': item.type === 'warning',
          }"
        >
          <Icon
            v-if="item.type === 'success'"
            name="check"
            size="sm"
            class="w-5 h-5"
          />
          <Icon
            v-else-if="item.type === 'error'"
            name="x"
            size="sm"
            class="w-5 h-5"
          />
          <Icon
            v-else-if="item.type === 'warning'"
            name="x"
            size="sm"
            class="w-5 h-5"
          />
          <Icon v-else name="server" size="sm" class="w-5 h-5" />
        </div>
        <div class="flex-1 min-w-0">
          <p
            class="text-sm font-medium"
            :class="{
              'text-green-900': item.type === 'success',
              'text-red-900': item.type === 'error',
              'text-blue-900': item.type === 'info',
              'text-yellow-900': item.type === 'warning',
            }"
          >
            {{ item.message }}
          </p>
        </div>
        <button
          @click="remove(item.id)"
          class="flex-shrink-0 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <Icon name="x" size="xs" />
        </button>
      </div>
    </TransitionGroup>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Icon from "./Icon.vue";

export type NotifyType = "success" | "error" | "info" | "warning";

export interface NotifyItem {
  id: string;
  message: string;
  type: NotifyType;
  duration?: number;
}

const notifications = ref<NotifyItem[]>([]);

let idCounter = 0;

function show(message: string, type: NotifyType = "info", duration = 3000) {
  const id = `notify-${Date.now()}-${idCounter++}`;
  const item: NotifyItem = {
    id,
    message,
    type,
    duration,
  };

  notifications.value.push(item);

  if (duration > 0) {
    setTimeout(() => {
      remove(id);
    }, duration);
  }

  return id;
}

function remove(id: string) {
  const index = notifications.value.findIndex((item) => item.id === id);
  if (index > -1) {
    notifications.value.splice(index, 1);
  }
}

function success(message: string, duration?: number) {
  return show(message, "success", duration);
}

function error(message: string, duration?: number) {
  return show(message, "error", duration);
}

function info(message: string, duration?: number) {
  return show(message, "info", duration);
}

function warning(message: string, duration?: number) {
  return show(message, "warning", duration);
}

function clear() {
  notifications.value = [];
}

defineExpose({
  show,
  success,
  error,
  info,
  warning,
  remove,
  clear,
});
</script>

<style scoped>
.notify-enter-active,
.notify-leave-active {
  transition: all 0.3s ease;
}

.notify-enter-from {
  opacity: 0;
  transform: translateX(100%) translateY(20px);
}

.notify-leave-to {
  opacity: 0;
  transform: translateX(100%) translateY(20px);
}

.notify-move {
  transition: transform 0.3s ease;
}
</style>
