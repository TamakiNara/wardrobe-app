type HolidayResult = {
  isHoliday: boolean;
  name: string | null;
};

const FIXED_HOLIDAYS: Array<{
  month: number;
  day: number;
  name: string;
  startYear?: number;
  endYear?: number;
}> = [
  { month: 1, day: 1, name: "元日" },
  { month: 2, day: 11, name: "建国記念の日" },
  { month: 2, day: 23, name: "天皇誕生日", startYear: 2020 },
  { month: 4, day: 29, name: "昭和の日" },
  { month: 5, day: 3, name: "憲法記念日" },
  { month: 5, day: 4, name: "みどりの日", startYear: 2007 },
  { month: 5, day: 5, name: "こどもの日" },
  { month: 8, day: 11, name: "山の日", startYear: 2016 },
  { month: 11, day: 3, name: "文化の日" },
  { month: 11, day: 23, name: "勤労感謝の日" },
];

function parseDateString(date: string): {
  year: number;
  month: number;
  day: number;
} | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(date);

  if (!match) {
    return null;
  }

  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
  };
}

function getNthWeekdayOfMonth(
  year: number,
  month: number,
  weekday: number,
  nth: number,
): number {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const offset = (7 + weekday - firstDay) % 7;

  return 1 + offset + (nth - 1) * 7;
}

function getVernalEquinoxDay(year: number): number {
  return Math.floor(
    20.8431 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4),
  );
}

function getAutumnalEquinoxDay(year: number): number {
  return Math.floor(
    23.2488 + 0.242194 * (year - 1980) - Math.floor((year - 1980) / 4),
  );
}

function buildBaseHolidayMap(year: number): Map<string, string> {
  const holidays = new Map<string, string>();

  for (const holiday of FIXED_HOLIDAYS) {
    if (holiday.startYear && year < holiday.startYear) {
      continue;
    }

    if (holiday.endYear && year > holiday.endYear) {
      continue;
    }

    holidays.set(
      `${year}-${String(holiday.month).padStart(2, "0")}-${String(holiday.day).padStart(2, "0")}`,
      holiday.name,
    );
  }

  holidays.set(
    `${year}-01-${String(getNthWeekdayOfMonth(year, 1, 1, 2)).padStart(2, "0")}`,
    "成人の日",
  );
  holidays.set(
    `${year}-07-${String(getNthWeekdayOfMonth(year, 7, 1, 3)).padStart(2, "0")}`,
    "海の日",
  );
  holidays.set(
    `${year}-09-${String(getNthWeekdayOfMonth(year, 9, 1, 3)).padStart(2, "0")}`,
    "敬老の日",
  );
  holidays.set(
    `${year}-10-${String(getNthWeekdayOfMonth(year, 10, 1, 2)).padStart(2, "0")}`,
    "スポーツの日",
  );
  holidays.set(
    `${year}-03-${String(getVernalEquinoxDay(year)).padStart(2, "0")}`,
    "春分の日",
  );
  holidays.set(
    `${year}-09-${String(getAutumnalEquinoxDay(year)).padStart(2, "0")}`,
    "秋分の日",
  );

  return holidays;
}

function applyCitizensHoliday(year: number, holidays: Map<string, string>) {
  for (let month = 1; month <= 12; month += 1) {
    const lastDay = new Date(year, month, 0).getDate();

    for (let day = 2; day < lastDay; day += 1) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = date.getDay();
      const dateKey = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
      const prevKey = `${year}-${String(month).padStart(2, "0")}-${String(day - 1).padStart(2, "0")}`;
      const nextKey = `${year}-${String(month).padStart(2, "0")}-${String(day + 1).padStart(2, "0")}`;

      if (dayOfWeek === 0 || holidays.has(dateKey)) {
        continue;
      }

      if (holidays.has(prevKey) && holidays.has(nextKey)) {
        holidays.set(dateKey, "国民の休日");
      }
    }
  }
}

function applySubstituteHoliday(year: number, holidays: Map<string, string>) {
  const entries = Array.from(holidays.entries()).sort(([a], [b]) =>
    a.localeCompare(b),
  );

  for (const [dateKey] of entries) {
    const [entryYear, entryMonth, entryDay] = dateKey.split("-").map(Number);
    const holidayDate = new Date(entryYear, entryMonth - 1, entryDay);

    if (holidayDate.getDay() !== 0) {
      continue;
    }

    const substituteDate = new Date(holidayDate);
    substituteDate.setDate(substituteDate.getDate() + 1);

    while (true) {
      const substituteKey = `${substituteDate.getFullYear()}-${String(
        substituteDate.getMonth() + 1,
      ).padStart(2, "0")}-${String(substituteDate.getDate()).padStart(2, "0")}`;

      if (!holidays.has(substituteKey)) {
        holidays.set(substituteKey, "振替休日");
        break;
      }

      substituteDate.setDate(substituteDate.getDate() + 1);
    }
  }
}

function buildHolidayMap(year: number): Map<string, string> {
  const holidays = buildBaseHolidayMap(year);
  applyCitizensHoliday(year, holidays);
  applySubstituteHoliday(year, holidays);

  return holidays;
}

const holidayMapCache = new Map<number, Map<string, string>>();

function getHolidayMap(year: number): Map<string, string> {
  const cached = holidayMapCache.get(year);

  if (cached) {
    return cached;
  }

  const holidayMap = buildHolidayMap(year);
  holidayMapCache.set(year, holidayMap);
  return holidayMap;
}

export function getJapaneseHoliday(date: string): HolidayResult {
  const parsed = parseDateString(date);

  if (!parsed) {
    return {
      isHoliday: false,
      name: null,
    };
  }

  const holidayName = getHolidayMap(parsed.year).get(date) ?? null;

  return {
    isHoliday: holidayName !== null,
    name: holidayName,
  };
}
