/**
 * Офлайн-список городов для места рождения: координаты и IANA-пояс
 * (исторические смещения — декретное/летнее время СССР — даёт ICU через Intl).
 * Внешний геокодер не нужен: данные рождения не уходят третьим лицам.
 */
export type City = { id: string; ru: string; en: string; lat: number; lon: number; tz: string };

export const CITIES: City[] = [
  { id: 'moscow', ru: 'Москва', en: 'Moscow', lat: 55.7558, lon: 37.6173, tz: 'Europe/Moscow' },
  { id: 'spb', ru: 'Санкт-Петербург', en: 'Saint Petersburg', lat: 59.9343, lon: 30.3351, tz: 'Europe/Moscow' },
  { id: 'novosibirsk', ru: 'Новосибирск', en: 'Novosibirsk', lat: 55.0084, lon: 82.9357, tz: 'Asia/Novosibirsk' },
  { id: 'yekaterinburg', ru: 'Екатеринбург', en: 'Yekaterinburg', lat: 56.8389, lon: 60.6057, tz: 'Asia/Yekaterinburg' },
  { id: 'kazan', ru: 'Казань', en: 'Kazan', lat: 55.7963, lon: 49.1088, tz: 'Europe/Moscow' },
  { id: 'nizhny', ru: 'Нижний Новгород', en: 'Nizhny Novgorod', lat: 56.2965, lon: 43.9361, tz: 'Europe/Moscow' },
  { id: 'chelyabinsk', ru: 'Челябинск', en: 'Chelyabinsk', lat: 55.1644, lon: 61.4368, tz: 'Asia/Yekaterinburg' },
  { id: 'samara', ru: 'Самара', en: 'Samara', lat: 53.1959, lon: 50.1002, tz: 'Europe/Samara' },
  { id: 'omsk', ru: 'Омск', en: 'Omsk', lat: 54.9885, lon: 73.3242, tz: 'Asia/Omsk' },
  { id: 'rostov', ru: 'Ростов-на-Дону', en: 'Rostov-on-Don', lat: 47.2357, lon: 39.7015, tz: 'Europe/Moscow' },
  { id: 'ufa', ru: 'Уфа', en: 'Ufa', lat: 54.7388, lon: 55.9721, tz: 'Asia/Yekaterinburg' },
  { id: 'krasnoyarsk', ru: 'Красноярск', en: 'Krasnoyarsk', lat: 56.0153, lon: 92.8932, tz: 'Asia/Krasnoyarsk' },
  { id: 'voronezh', ru: 'Воронеж', en: 'Voronezh', lat: 51.672, lon: 39.1843, tz: 'Europe/Moscow' },
  { id: 'perm', ru: 'Пермь', en: 'Perm', lat: 58.0105, lon: 56.2502, tz: 'Asia/Yekaterinburg' },
  { id: 'volgograd', ru: 'Волгоград', en: 'Volgograd', lat: 48.708, lon: 44.5133, tz: 'Europe/Volgograd' },
  { id: 'krasnodar', ru: 'Краснодар', en: 'Krasnodar', lat: 45.0355, lon: 38.9753, tz: 'Europe/Moscow' },
  { id: 'saratov', ru: 'Саратов', en: 'Saratov', lat: 51.5331, lon: 46.0342, tz: 'Europe/Saratov' },
  { id: 'tyumen', ru: 'Тюмень', en: 'Tyumen', lat: 57.153, lon: 65.5343, tz: 'Asia/Yekaterinburg' },
  { id: 'tolyatti', ru: 'Тольятти', en: 'Tolyatti', lat: 53.5078, lon: 49.4204, tz: 'Europe/Samara' },
  { id: 'izhevsk', ru: 'Ижевск', en: 'Izhevsk', lat: 56.8526, lon: 53.2045, tz: 'Europe/Samara' },
  { id: 'barnaul', ru: 'Барнаул', en: 'Barnaul', lat: 53.3548, lon: 83.7698, tz: 'Asia/Barnaul' },
  { id: 'irkutsk', ru: 'Иркутск', en: 'Irkutsk', lat: 52.2869, lon: 104.305, tz: 'Asia/Irkutsk' },
  { id: 'khabarovsk', ru: 'Хабаровск', en: 'Khabarovsk', lat: 48.4802, lon: 135.0719, tz: 'Asia/Vladivostok' },
  { id: 'vladivostok', ru: 'Владивосток', en: 'Vladivostok', lat: 43.1155, lon: 131.8855, tz: 'Asia/Vladivostok' },
  { id: 'yaroslavl', ru: 'Ярославль', en: 'Yaroslavl', lat: 57.6261, lon: 39.8845, tz: 'Europe/Moscow' },
  { id: 'tomsk', ru: 'Томск', en: 'Tomsk', lat: 56.4846, lon: 84.9476, tz: 'Asia/Tomsk' },
  { id: 'orenburg', ru: 'Оренбург', en: 'Orenburg', lat: 51.7682, lon: 55.097, tz: 'Asia/Yekaterinburg' },
  { id: 'kemerovo', ru: 'Кемерово', en: 'Kemerovo', lat: 55.3547, lon: 86.0873, tz: 'Asia/Novokuznetsk' },
  { id: 'sochi', ru: 'Сочи', en: 'Sochi', lat: 43.5855, lon: 39.7231, tz: 'Europe/Moscow' },
  { id: 'kaliningrad', ru: 'Калининград', en: 'Kaliningrad', lat: 54.7104, lon: 20.4522, tz: 'Europe/Kaliningrad' },
  { id: 'murmansk', ru: 'Мурманск', en: 'Murmansk', lat: 68.9585, lon: 33.0827, tz: 'Europe/Moscow' },
  { id: 'arkhangelsk', ru: 'Архангельск', en: 'Arkhangelsk', lat: 64.5401, lon: 40.5433, tz: 'Europe/Moscow' },
  { id: 'yakutsk', ru: 'Якутск', en: 'Yakutsk', lat: 62.0355, lon: 129.6755, tz: 'Asia/Yakutsk' },
  { id: 'minsk', ru: 'Минск', en: 'Minsk', lat: 53.9006, lon: 27.559, tz: 'Europe/Minsk' },
  { id: 'kyiv', ru: 'Киев', en: 'Kyiv', lat: 50.4501, lon: 30.5234, tz: 'Europe/Kyiv' },
  { id: 'almaty', ru: 'Алматы', en: 'Almaty', lat: 43.222, lon: 76.8512, tz: 'Asia/Almaty' },
  { id: 'astana', ru: 'Астана', en: 'Astana', lat: 51.1694, lon: 71.4491, tz: 'Asia/Almaty' },
  { id: 'tashkent', ru: 'Ташкент', en: 'Tashkent', lat: 41.2995, lon: 69.2401, tz: 'Asia/Tashkent' },
  { id: 'bishkek', ru: 'Бишкек', en: 'Bishkek', lat: 42.8746, lon: 74.5698, tz: 'Asia/Bishkek' },
  { id: 'baku', ru: 'Баку', en: 'Baku', lat: 40.4093, lon: 49.8671, tz: 'Asia/Baku' },
  { id: 'yerevan', ru: 'Ереван', en: 'Yerevan', lat: 40.1792, lon: 44.4991, tz: 'Asia/Yerevan' },
  { id: 'tbilisi', ru: 'Тбилиси', en: 'Tbilisi', lat: 41.7151, lon: 44.8271, tz: 'Asia/Tbilisi' },
  { id: 'chisinau', ru: 'Кишинёв', en: 'Chisinau', lat: 47.0105, lon: 28.8638, tz: 'Europe/Chisinau' },
  { id: 'riga', ru: 'Рига', en: 'Riga', lat: 56.9496, lon: 24.1052, tz: 'Europe/Riga' },
  { id: 'berlin', ru: 'Берлин', en: 'Berlin', lat: 52.52, lon: 13.405, tz: 'Europe/Berlin' },
  { id: 'london', ru: 'Лондон', en: 'London', lat: 51.5074, lon: -0.1278, tz: 'Europe/London' },
  { id: 'paris', ru: 'Париж', en: 'Paris', lat: 48.8566, lon: 2.3522, tz: 'Europe/Paris' },
  { id: 'istanbul', ru: 'Стамбул', en: 'Istanbul', lat: 41.0082, lon: 28.9784, tz: 'Europe/Istanbul' },
  { id: 'dubai', ru: 'Дубай', en: 'Dubai', lat: 25.2048, lon: 55.2708, tz: 'Asia/Dubai' },
  { id: 'newyork', ru: 'Нью-Йорк', en: 'New York', lat: 40.7128, lon: -74.006, tz: 'America/New_York' },
];

export function findCity(id: string | null | undefined): City | null {
  return CITIES.find((city) => city.id === id) ?? null;
}
