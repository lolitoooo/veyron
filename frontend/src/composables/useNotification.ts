import { ref } from 'vue';

type NotificationType = 'success' | 'error' | 'info' | 'warning';

interface Notification {
  id: number;
  message: string;
  type: NotificationType;
  timeout?: number;
}

export function useNotification() {
  const notifications = ref<Notification[]>([]);
  let nextId = 1;

  const addNotification = (
    message: string, 
    type: NotificationType = 'info', 
    timeout: number = 5000
  ) => {
    const id = nextId++;
    const notification: Notification = {
      id,
      message,
      type,
      timeout
    };
    
    notifications.value.push(notification);
    
    if (timeout > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, timeout);
    }
    
    return id;
  };

  const removeNotification = (id: number) => {
    const index = notifications.value.findIndex(n => n.id === id);
    if (index !== -1) {
      notifications.value.splice(index, 1);
    }
  };

  const success = (message: string, timeout?: number) => {
    return addNotification(message, 'success', timeout);
  };

  const error = (message: string, timeout?: number) => {
    return addNotification(message, 'error', timeout);
  };

  const info = (message: string, timeout?: number) => {
    return addNotification(message, 'info', timeout);
  };

  const warning = (message: string, timeout?: number) => {
    return addNotification(message, 'warning', timeout);
  };

  return {
    notifications,
    addNotification,
    removeNotification,
    success,
    error,
    info,
    warning
  };
}
