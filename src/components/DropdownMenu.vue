<template>
  <div class="relative" ref="menuRef">
    <button
      @click.stop="toggleMenu"
      type="button"
      :class="[
        'px-2.5 py-1.5 text-xs rounded-md transition-all flex items-center gap-1.5',
        isOpen
          ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200',
      ]"
    >
      <svg
        class="w-3.5 h-3.5"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <circle cx="12" cy="12" r="1" />
        <circle cx="12" cy="5" r="1" />
        <circle cx="12" cy="19" r="1" />
      </svg>
      <Icon
        name="chevron-down"
        size="xs"
        :class="{ 'transform rotate-180': isOpen }"
        class="transition-transform"
      />
    </button>

    <Teleport to="body">
      <Transition
        enter-active-class="transition ease-out duration-100"
        enter-from-class="transform opacity-0 scale-95"
        enter-to-class="transform opacity-100 scale-100"
        leave-active-class="transition ease-in duration-75"
        leave-from-class="transform opacity-100 scale-100"
        leave-to-class="transform opacity-0 scale-95"
      >
        <div
          v-if="isOpen"
          ref="dropdownRef"
          :style="dropdownStyle"
          class="fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-lg min-w-[180px] overflow-hidden"
        >
          <slot :close="closeMenu" />
        </div>
      </Transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onUnmounted, nextTick, watch } from "vue";
import Icon from "./Icon.vue";

const isOpen = ref(false);
const menuRef = ref<HTMLElement>();
const dropdownRef = ref<HTMLElement>();
const dropdownStyle = ref<Record<string, string>>({});

function toggleMenu() {
  isOpen.value = !isOpen.value;
  if (isOpen.value) {
    // 使用双重 nextTick 确保 DOM 完全渲染
    nextTick(() => {
      nextTick(() => {
        calculateDropdownPosition();
      });
    });
  }
}

function closeMenu() {
  isOpen.value = false;
}

// 暴露关闭方法供外部调用
defineExpose({
  close: closeMenu,
});

function calculateDropdownPosition() {
  if (!menuRef.value || !dropdownRef.value) return;

  const buttonRect = menuRef.value.getBoundingClientRect();
  const dropdownHeight = dropdownRef.value.offsetHeight || 200;
  const dropdownWidth = dropdownRef.value.offsetWidth || 180;
  const spaceBelow = window.innerHeight - buttonRect.bottom;
  const spaceAbove = buttonRect.top;
  const spaceRight = window.innerWidth - buttonRect.right;
  const spaceLeft = buttonRect.left;

  // 计算垂直位置
  let top = 0;
  let bottom = 0;
  if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
    // 向上显示
    bottom = window.innerHeight - buttonRect.top + 4;
    dropdownStyle.value = {
      bottom: `${bottom}px`,
    };
  } else {
    // 向下显示
    top = buttonRect.bottom + 4;
    dropdownStyle.value = {
      top: `${top}px`,
    };
  }

  // 计算水平位置 - 确保不会超出屏幕
  let left = buttonRect.left;
  if (left + dropdownWidth > window.innerWidth) {
    // 如果超出右边界，对齐到右边界
    left = window.innerWidth - dropdownWidth - 8;
  }
  if (left < 8) {
    // 如果超出左边界，对齐到左边界
    left = 8;
  }

  dropdownStyle.value = {
    ...dropdownStyle.value,
    left: `${left}px`,
    minWidth: `${buttonRect.width}px`,
  };
}

watch(isOpen, (newValue) => {
  if (newValue) {
    // 使用双重 nextTick 确保 DOM 完全渲染
    nextTick(() => {
      nextTick(() => {
        calculateDropdownPosition();
        // 监听窗口变化
        window.addEventListener("resize", calculateDropdownPosition);
        window.addEventListener("scroll", calculateDropdownPosition, true);
      });
    });
  } else {
    window.removeEventListener("resize", calculateDropdownPosition);
    window.removeEventListener("scroll", calculateDropdownPosition, true);
  }
});

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  const isClickInside = menuRef.value?.contains(target);
  const isClickInDropdown = dropdownRef.value?.contains(target);

  if (!isClickInside && !isClickInDropdown) {
    isOpen.value = false;
  }
}

onMounted(() => {
  document.addEventListener("click", handleClickOutside);
});

onUnmounted(() => {
  document.removeEventListener("click", handleClickOutside);
  window.removeEventListener("resize", calculateDropdownPosition);
  window.removeEventListener("scroll", calculateDropdownPosition, true);
});
</script>
