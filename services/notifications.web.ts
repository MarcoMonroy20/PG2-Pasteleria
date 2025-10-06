// Web: sin soporte de notificaciones locales programadas, devolvemos null
export const schedulePedidoNotification = async (
  _pedidoId: number,
  _title: string,
  _body: string,
  _triggerDate: Date
): Promise<string | null> => {
  return null;
};

export const cancelNotificationById = async (_notificationId: string | null | undefined): Promise<void> => {
  return;
};

export const scheduleMultiplePedidoNotifications = async (
  _pedidoId: number, 
  _pedidoNombre: string, 
  _fechaEntrega: string, 
  _notificationDays: number[]
): Promise<string[]> => {
  console.log('⚠️ Web platform: multiple notifications not supported');
  return [];
};


