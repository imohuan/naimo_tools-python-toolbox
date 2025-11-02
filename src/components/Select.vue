<template>
  <div class="relative" ref="selectRef">
    <button
      @click.stop="toggleDropdown"
      type="button"
      :class="[
        'w-full flex items-center justify-between bg-white border border-gray-300 rounded-md hover:border-indigo-500 transition-colors text-left',
        size === 'sm'
          ? 'px-2 py-1 text-xs min-w-[120px] h-[26px]'
          : 'px-3 py-2 text-sm',
        { 'border-indigo-500': isOpen },
      ]"
    >
      <span class="text-gray-900 truncate">{{ selectedLabel }}</span>
      <Icon
        name="chevron-down"
        :size="size === 'sm' ? 'xs' : 'sm'"
        :class="{ 'transform rotate-180': isOpen }"
        class="transition-transform text-gray-500 flex-shrink-0 ml-1.5"
      />
    </button>

    <Teleport to="body">
      <transition
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
          :class="[
            'fixed z-[9999] bg-white border border-gray-200 rounded-md shadow-lg max-h-60 overflow-auto',
            size === 'sm' ? 'text-xs' : 'text-sm',
          ]"
        >
          <button
            v-for="option in options"
            :key="option.value"
            @click.stop="selectOption(option.value)"
            @mousedown.prevent
            :class="[
              'w-full text-left hover:bg-indigo-50 transition-colors flex items-center justify-between',
              size === 'sm' ? 'px-2.5 py-1.5' : 'px-3 py-2',
              option.value === modelValue
                ? 'bg-indigo-50 text-indigo-600'
                : 'text-gray-900',
            ]"
          >
            <span class="truncate">{{ option.label }}</span>
            <Icon
              v-if="option.value === modelValue"
              name="check"
              :size="size === 'sm' ? 'xs' : 'sm'"
              class="text-indigo-600 flex-shrink-0 ml-1.5"
            />
          </button>
        </div>
      </transition>
    </Teleport>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from "vue";
import Icon from "./Icon.vue";

interface Option {
  label: string;
  value: string;
}

interface Props {
  modelValue?: string;
  options: Option[];
  size?: "sm" | "md";
}

const props = withDefaults(defineProps<Props>(), {
  modelValue: "",
  size: "md",
});
const emit = defineEmits<{
  "update:modelValue": [value: string];
}>();

const isOpen = ref(false);
const selectRef = ref<HTMLElement>();
const dropdownRef = ref<HTMLElement>();
const dropdownPosition = ref<"top" | "bottom">("bottom");
const dropdownStyle = ref<Record<string, string>>({});

const selectedLabel = computed(() => {
  const option = props.options.find((o) => o.value === props.modelValue);
  return option?.label || "请选择";
});

function selectOption(value: string) {
  emit("update:modelValue", value);
  // 延迟关闭，确保点击事件完成
  setTimeout(() => {
    isOpen.value = false;
  }, 0);
}

async function toggleDropdown() {
  isOpen.value = !isOpen.value;

  if (isOpen.value) {
    await nextTick();
    calculateDropdownPosition();
  }
}

function calculateDropdownPosition() {
  if (!selectRef.value) return;

  const buttonRect = selectRef.value.getBoundingClientRect();
  const dropdownHeight = 240; // max-h-60 = 240px
  const spaceBelow = window.innerHeight - buttonRect.bottom;
  const spaceAbove = buttonRect.top;

  // 如果下方空间不足，且上方空间更大，则向上显示
  if (spaceBelow < dropdownHeight && spaceAbove > spaceBelow) {
    dropdownPosition.value = "top";
    dropdownStyle.value = {
      bottom: `${window.innerHeight - buttonRect.top + 4}px`,
      left: `${buttonRect.left}px`,
      width: `${buttonRect.width}px`,
    };
  } else {
    dropdownPosition.value = "bottom";
    dropdownStyle.value = {
      top: `${buttonRect.bottom + 4}px`,
      left: `${buttonRect.left}px`,
      width: `${buttonRect.width}px`,
    };
  }
}

// 监听 isOpen 变化，更新位置
watch(isOpen, (newValue) => {
  if (newValue) {
    nextTick(() => {
      calculateDropdownPosition();
    });
  }
});

function handleClickOutside(event: MouseEvent) {
  const target = event.target as Node;
  const isClickInside = selectRef.value?.contains(target);
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
});
</script>
