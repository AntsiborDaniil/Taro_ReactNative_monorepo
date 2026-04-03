export function getCurrentWeekBounds() {
  const now = new Date();

  // Копируем дату
  const start = new Date(now);
  const day = now.getDay();

  // Смещение до понедельника
  const diffToMonday = day === 0 ? -6 : 1 - day;

  // Устанавливаем понедельник 00:00:00
  start.setDate(now.getDate() + diffToMonday);
  start.setHours(0, 0, 0, 0);

  // Конец недели — воскресенье 23:59:59.999
  const end = new Date(start);
  end.setDate(start.getDate() + 6);
  end.setHours(23, 59, 59, 999);

  // Формируем массив дней недели
  const days = [];
  for (let i = 1; i < 8; i++) {
    const dayDate = new Date(start);
    dayDate.setDate(start.getDate() + i);
    days.push(dayDate);
  }

  return { start, end, days };
}
