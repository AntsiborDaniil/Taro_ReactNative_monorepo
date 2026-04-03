export function formatDate({
  dateStr,
  todayText,
  yesterdayText,
}: {
  dateStr: string;
  todayText: string;
  yesterdayText: string;
}) {
  const spreadDate: Date = new Date(dateStr);
  const today: Date = new Date();
  const yesterday: Date = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  const spreadDay: string = spreadDate.toISOString().split('T')[0];
  const todayDay: string = today.toISOString().split('T')[0];
  const yesterdayDay: string = yesterday.toISOString().split('T')[0];

  if (spreadDay === todayDay) {
    return todayText;
  }
  if (spreadDay === yesterdayDay) {
    return yesterdayText;
  }

  return spreadDate.toLocaleDateString();
}
