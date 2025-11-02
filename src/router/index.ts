import { createRouter, createWebHashHistory } from "vue-router";
import type { RouteRecordRaw } from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    redirect: "/python",
  },
  {
    path: "/python",
    name: "PythonManager",
    component: () => import("../views/PythonManager.vue"),
  },
  {
    path: "/config",
    name: "ConfigManager",
    component: () => import("../views/ConfigManager.vue"),
  },
  {
    path: "/packages",
    name: "PackagesManager",
    component: () => import("../views/PackagesManager.vue"),
  },
  {
    path: "/terminal",
    name: "Terminal",
    component: () => import("../views/TerminalView.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

export default router;
