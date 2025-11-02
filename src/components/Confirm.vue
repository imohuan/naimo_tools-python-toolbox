<template>
  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="visible"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
        @click.self="handleCancel"
      >
        <div
          class="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 transform transition-all"
          :class="{
            'scale-100': visible,
            'scale-95': !visible,
          }"
        >
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 mb-2">
              {{ title }}
            </h3>
            <p class="text-sm text-gray-600 mb-6">{{ message }}</p>
            <div class="flex justify-end gap-2">
              <Button variant="secondary" @click="handleCancel" size="sm">
                取消
              </Button>
              <Button variant="danger" @click="handleConfirm" size="sm">
                确认
              </Button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<script setup lang="ts">
import { ref } from "vue";
import Button from "./Button.vue";

const visible = ref(false);
const title = ref("确认");
const message = ref("");
let resolveFn: ((value: boolean) => void) | null = null;

function show(msg: string, ttl: string = "确认"): Promise<boolean> {
  visible.value = true;
  message.value = msg;
  title.value = ttl;

  return new Promise((resolve) => {
    resolveFn = resolve;
  });
}

function handleConfirm() {
  visible.value = false;
  if (resolveFn) {
    resolveFn(true);
    resolveFn = null;
  }
}

function handleCancel() {
  visible.value = false;
  if (resolveFn) {
    resolveFn(false);
    resolveFn = null;
  }
}

defineExpose({
  show,
});
</script>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>
