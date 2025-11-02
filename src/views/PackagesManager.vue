<template>
  <div class="w-full h-full overflow-y-auto relative">
    <!-- Teleport 到顶部的自定义区域 -->
    <Teleport to="#tab-actions">
      <template v-if="route.path === '/packages'">
        <div class="flex items-center gap-2">
          <Button
            @click="refresh"
            :loading="isLoading"
            size="sm"
            variant="secondary"
          >
            <Icon
              name="refresh"
              size="sm"
              :class="{ 'animate-spin': isLoading }"
            />
            刷新
          </Button>

          <Button
            @click="handleCheckAllUpdates"
            :loading="isCheckingUpdates"
            size="sm"
            variant="secondary"
          >
            <Icon name="search" size="sm" />
            {{ isCheckingUpdates ? `检查中 ${checkProgress}%` : "检查更新" }}
          </Button>

          <Button
            v-if="packagesWithUpdate.length > 0"
            @click="handleUpdateAll"
            :loading="isUpdating"
            size="sm"
          >
            <Icon name="refresh" size="sm" />
            批量更新 ({{ packagesWithUpdate.length }})
          </Button>

          <!-- 包管理器切换 -->
          <div class="flex items-center bg-gray-100 rounded-lg p-0.5">
            <button
              @click="togglePackageManager"
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                !usePip
                  ? 'bg-white text-indigo-600 shadow-sm'
                  : 'text-gray-600',
              ]"
            >
              UV
            </button>
            <button
              @click="togglePackageManager"
              :class="[
                'px-3 py-1.5 text-xs font-medium rounded-md transition-all',
                usePip ? 'bg-white text-indigo-600 shadow-sm' : 'text-gray-600',
              ]"
            >
              PIP
            </button>
          </div>
        </div>
      </template>
    </Teleport>

    <transition name="fade" appear>
      <div
        v-if="commandLoading"
        class="absolute inset-0 bg-white/80 backdrop-blur-sm flex flex-col items-center justify-center z-40"
      >
        <Loading />
        <p v-if="commandMessage" class="mt-3 text-sm text-gray-600">
          {{ commandMessage }}
        </p>
      </div>
    </transition>

    <div class="p-4">
      <div class="max-w-6xl mx-auto">
        <!-- 标签页导航 -->
        <div class="flex items-center gap-2 mb-4 border-b border-gray-200">
          <button
            v-for="tab in tabs"
            :key="tab.key"
            @click="activeTab = tab.key"
            class="px-4 py-2 text-sm font-medium transition-all relative"
            :class="
              activeTab === tab.key
                ? 'text-indigo-600 border-b-2 border-indigo-600'
                : 'text-gray-600 hover:text-gray-900'
            "
          >
            {{ tab.label }}
            <span
              v-if="tab.count !== undefined"
              class="ml-1.5 px-1.5 py-0.5 text-xs rounded-full"
              :class="
                activeTab === tab.key
                  ? 'bg-indigo-100 text-indigo-700'
                  : 'bg-gray-100 text-gray-600'
              "
            >
              {{ tab.count }}
            </span>
          </button>
        </div>

        <!-- 搜索区域 -->
        <div v-if="activeTab === 'search'" class="mb-4">
          <div class="flex gap-2">
            <div class="flex-1 relative">
              <input
                v-model="searchKeyword"
                @keyup.enter="handleSearch"
                type="text"
                placeholder="搜索 PyPI 包..."
                class="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:border-indigo-500"
              />
            </div>
            <Button @click="handleSearch" :loading="isSearching">
              <Icon name="search" size="sm" />
              搜索
            </Button>
          </div>
        </div>

        <!-- 加载状态 -->
        <div
          v-if="isLoading && packages.length === 0"
          class="py-12 text-center"
        >
          <Loading />
          <p class="mt-4 text-gray-500">正在加载包列表...</p>
        </div>

        <!-- 已安装包列表 -->
        <div v-else-if="activeTab === 'installed'">
          <div
            v-if="Object.keys(packagesByCategory).length === 0"
            class="py-12 text-center"
          >
            <p class="text-gray-500">暂无已安装的包</p>
          </div>

          <div v-else class="space-y-4">
            <div v-for="(pkgs, category) in packagesByCategory" :key="category">
              <h3 class="text-xs font-semibold text-gray-700 mb-2 px-1">
                {{ category }}
              </h3>
              <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                <PackageCard
                  v-for="pkg in pkgs"
                  :key="pkg.name"
                  :data="pkg"
                  variant="installed"
                  :operation="getPackageOperation(pkg.name)"
                  @check-update="handleCheckUpdate"
                  @update="handleUpdate"
                  @uninstall="handleUninstall"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- 可更新包列表 -->
        <div v-else-if="activeTab === 'updates'">
          <div v-if="packagesWithUpdate.length === 0" class="py-12 text-center">
            <Icon
              name="check-circle"
              size="xl"
              class="text-green-500 mx-auto mb-4"
            />
            <p class="text-gray-500">所有包都是最新版本</p>
          </div>

          <div
            v-else
            class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2"
          >
            <PackageCard
              v-for="pkg in packagesWithUpdate"
              :key="pkg.name"
              :data="pkg"
              variant="installed"
              :operation="getPackageOperation(pkg.name)"
              @update="handleUpdate"
            />
          </div>
        </div>

        <!-- 推荐工具 -->
        <div v-else-if="activeTab === 'recommended'">
          <div class="mb-4">
            <Button
              v-if="uninstalledRecommended.length > 0"
              @click="handleInstallAllRecommended"
              :loading="isInstalling"
            >
              <Icon name="download" size="sm" />
              批量安装全部推荐工具
            </Button>
          </div>

          <div
            v-if="uninstalledRecommended.length === 0"
            class="py-12 text-center"
          >
            <Icon
              name="check-circle"
              size="xl"
              class="text-green-500 mx-auto mb-4"
            />
            <p class="text-gray-500">所有推荐工具都已安装</p>
          </div>

          <div v-else class="space-y-4">
            <div v-for="category in categories" :key="category">
              <h3 class="text-xs font-semibold text-gray-700 mb-2 px-1">
                {{ category }}
              </h3>
              <div class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2">
                <div
                  v-for="tool in getToolsByCategory(category)"
                  :key="tool.name"
                  class="border border-gray-200 rounded-lg p-2 hover:border-indigo-400 transition-all bg-white group"
                >
                  <div class="flex flex-col gap-1.5">
                    <h4 class="text-xs font-semibold text-gray-900">
                      {{ tool.displayName }}
                    </h4>
                    <p
                      class="text-[10px] text-gray-500 line-clamp-2 leading-tight"
                    >
                      {{ tool.description }}
                    </p>
                    <Button
                      @click="handleInstall(tool.name)"
                      :loading="installingPackage === tool.name"
                      size="sm"
                      class="w-full mt-1"
                    >
                      <Icon name="download" size="xs" />
                      <span class="text-xs">安装</span>
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 搜索结果 -->
        <div v-else-if="activeTab === 'search'">
          <div v-if="isSearching" class="py-12 text-center">
            <Loading />
            <p class="mt-4 text-gray-500">正在搜索...</p>
          </div>

          <div
            v-else-if="searchResults.length === 0 && searchKeyword"
            class="py-12 text-center"
          >
            <p class="text-gray-500">没有找到相关包</p>
          </div>

          <div
            v-else-if="searchResults.length > 0"
            class="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2"
          >
            <div
              v-for="pkg in searchResults"
              :key="pkg.name"
              class="border border-gray-200 rounded-lg p-2 hover:border-indigo-400 transition-all bg-white group"
              :class="pkg.installed ? 'bg-green-50/20 border-green-200' : ''"
            >
              <div class="flex flex-col gap-1">
                <div class="flex items-center gap-1 mb-0.5">
                  <h4
                    class="text-xs font-semibold text-gray-900 truncate flex-1"
                  >
                    {{ pkg.name }}
                  </h4>
                  <span
                    v-if="pkg.installed"
                    class="px-1 py-0.5 text-[10px] bg-green-100 text-green-700 rounded flex-shrink-0"
                  >
                    已安装
                  </span>
                </div>
                <span
                  class="text-[10px] font-mono text-blue-600 bg-blue-50 px-1 py-0.5 rounded self-start"
                  >v{{ pkg.version }}</span
                >
                <p class="text-[10px] text-gray-500 line-clamp-2 leading-tight">
                  {{ pkg.description }}
                </p>
                <p v-if="pkg.author" class="text-[10px] text-gray-400 truncate">
                  {{ pkg.author }}
                </p>
                <Button
                  v-if="!pkg.installed"
                  @click="handleInstall(pkg.name)"
                  :loading="installingPackage === pkg.name"
                  size="sm"
                  class="w-full mt-1"
                >
                  <Icon name="download" size="xs" />
                  <span class="text-xs">安装</span>
                </Button>
                <div v-else class="text-[10px] text-green-600 text-center py-1">
                  ✓ 已安装
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRoute } from "vue-router";
import { usePackagesStore } from "../stores/packages";
import { storeToRefs } from "pinia";
import Button from "../components/Button.vue";
import Icon from "../components/Icon.vue";
import Loading from "../components/Loading.vue";
import PackageCard from "../components/PackageCard.vue";

const route = useRoute();
const packagesStore = usePackagesStore();

const {
  packages,
  searchResults,
  isLoading,
  isSearching,
  isCheckingUpdates,
  checkProgress,
  usePip,
  packagesByCategory,
  packagesWithUpdate,
  uninstalledRecommended,
  recommendedTools,
  commandLoading,
  commandMessage,
} = storeToRefs(packagesStore);

const activeTab = ref<"installed" | "updates" | "recommended" | "search">(
  "installed"
);
const searchKeyword = ref("");
const isUpdating = ref(false);
const isInstalling = ref(false);
const installingPackage = ref("");
const updatingPackage = ref("");
const uninstallingPackage = ref("");

// 包操作状态
function getPackageOperation(packageName: string) {
  return {
    installing: installingPackage.value === packageName,
    updating: updatingPackage.value === packageName,
    uninstalling: uninstallingPackage.value === packageName,
  };
}

const tabs = computed(() => [
  { key: "installed", label: "已安装", count: packages.value.length },
  { key: "updates", label: "可更新", count: packagesWithUpdate.value.length },
  {
    key: "recommended",
    label: "推荐工具",
    count: uninstalledRecommended.value.length,
  },
  { key: "search", label: "搜索" },
]);

const categories = computed(() => {
  const cats = new Set<string>();
  uninstalledRecommended.value.forEach((tool) => {
    cats.add(tool.category);
  });
  return Array.from(cats);
});

function getToolsByCategory(category: string) {
  return uninstalledRecommended.value.filter(
    (tool) => tool.category === category
  );
}

async function refresh() {
  await packagesStore.fetchPackages();
}

async function handleCheckAllUpdates() {
  await packagesStore.checkAllUpdates();
}

async function handleCheckUpdate(packageName: string) {
  await packagesStore.checkPackageUpdate(packageName);
}

async function handleUpdate(packageName: string) {
  updatingPackage.value = packageName;
  try {
    const success = await packagesStore.updatePackage(packageName);
    if (success) {
      alert(`${packageName} 更新成功！`);
    } else {
      alert(`${packageName} 更新失败！`);
    }
  } finally {
    updatingPackage.value = "";
  }
}

async function handleUninstall(packageName: string) {
  if (!confirm(`确定要卸载 ${packageName} 吗？`)) return;

  uninstallingPackage.value = packageName;
  try {
    const success = await packagesStore.uninstallPackage(packageName);
    if (success) {
      alert(`${packageName} 卸载成功！`);
    } else {
      alert(`${packageName} 卸载失败！`);
    }
  } finally {
    uninstallingPackage.value = "";
  }
}

async function handleInstall(packageName: string) {
  installingPackage.value = packageName;
  try {
    const success = await packagesStore.installPackage(packageName);
    if (success) {
      alert(`${packageName} 安装成功！`);
    } else {
      alert(`${packageName} 安装失败！`);
    }
  } finally {
    installingPackage.value = "";
  }
}

async function handleUpdateAll() {
  if (!confirm(`确定要更新 ${packagesWithUpdate.value.length} 个包吗？`))
    return;

  isUpdating.value = true;
  try {
    await packagesStore.updateAllPackages();
    alert("批量更新完成！");
  } finally {
    isUpdating.value = false;
  }
}

async function handleInstallAllRecommended() {
  if (
    !confirm(`确定要安装 ${uninstalledRecommended.value.length} 个推荐工具吗？`)
  )
    return;

  isInstalling.value = true;
  try {
    await packagesStore.installRecommendedTools();
    alert("批量安装完成！");
  } finally {
    isInstalling.value = false;
  }
}

async function handleSearch() {
  if (!searchKeyword.value.trim()) return;
  await packagesStore.searchPackages(searchKeyword.value);
}

function togglePackageManager() {
  packagesStore.togglePackageManager();
  refresh();
}

onMounted(async () => {
  try {
    await refresh();
  } catch (error) {
    console.error("初始化包列表失败:", error);
  }
});
</script>
