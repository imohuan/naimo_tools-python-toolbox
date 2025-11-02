let confirmInstance: {
  show: (message: string, title?: string) => Promise<boolean>;
} | null = null;

export function setConfirmInstance(instance: typeof confirmInstance) {
  confirmInstance = instance;
}

export function useConfirm() {
  function confirm(message: string, title: string = "确认"): Promise<boolean> {
    if (!confirmInstance) {
      console.warn("Confirm instance not initialized");
      return Promise.resolve(false);
    }
    return confirmInstance.show(message, title);
  }

  return {
    confirm,
  };
}
