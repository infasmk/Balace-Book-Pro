
export const notificationService = {
  requestPermission: async () => {
    if (!('Notification' in window)) {
      console.warn('This browser does not support notifications.');
      return false;
    }
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  },

  send: (title: string, body: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;

    // Use a hash of the content to prevent spamming the same notification
    const lastNotif = localStorage.getItem('bbpro_last_notif_body');
    if (lastNotif === body) return;

    new Notification(title, {
      body,
      icon: '/favicon.ico', // Fallback to root favicon
      badge: '/favicon.ico'
    });
    
    localStorage.setItem('bbpro_last_notif_body', body);
  },

  hasPermission: () => {
    return 'Notification' in window && Notification.permission === 'granted';
  }
};
