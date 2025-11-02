import { ref, onMounted } from "vue";
import type { NotifyType } from "../components/Notify.vue";

let notifyInstance: {
  show: (message: string, type?: NotifyType, duration?: number) => string;
  success: (message: string, duration?: number) => string;
  error: (message: string, duration?: number) => string;
  info: (message: string, duration?: number) => string;
  warning: (message: string, duration?: number) => string;
  remove: (id: string) => void;
  clear: () => void;
} | null = null;

export function setNotifyInstance(instance: typeof notifyInstance) {
  notifyInstance = instance;
}

export function useNotify() {
  function show(message: string, type: NotifyType = "info", duration = 3000) {
    if (!notifyInstance) {
      console.warn("Notify instance not initialized");
      return "";
    }
    return notifyInstance.show(message, type, duration);
  }

  function success(message: string, duration?: number) {
    if (!notifyInstance) {
      console.warn("Notify instance not initialized");
      return "";
    }
    return notifyInstance.success(message, duration);
  }

  function error(message: string, duration?: number) {
    if (!notifyInstance) {
      console.warn("Notify instance not initialized");
      return "";
    }
    return notifyInstance.error(message, duration);
  }

  function info(message: string, duration?: number) {
    if (!notifyInstance) {
      console.warn("Notify instance not initialized");
      return "";
    }
    return notifyInstance.info(message, duration);
  }

  function warning(message: string, duration?: number) {
    if (!notifyInstance) {
      console.warn("Notify instance not initialized");
      return "";
    }
    return notifyInstance.warning(message, duration);
  }

  return {
    show,
    success,
    error,
    info,
    warning,
  };
}
