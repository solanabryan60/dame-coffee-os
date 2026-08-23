import Image from 'next/image';

export type BeanState =
  | 'walking'
  | 'sleeping'
  | 'confused'
  | 'sold-out'
  | 'celebrating'
  | 'driving'
  | 'rewards'
  | 'pouring'
  | 'spring'
  | 'summer'
  | 'autumn'
  | 'halloween'
  | 'winter';

export type BeanHolidayState =
  | 'new-year'
  | 'valentines'
  | 'dia-de-reyes'
  | 'lunar-new-year'
  | 'st-patricks'
  | 'easter'
  | 'earth-day'
  | 'mothers-day'
  | 'fathers-day'
  | 'memorial-day'
  | 'cinco-de-mayo'
  | 'pride'
  | 'juneteenth'
  | 'fourth-of-july'
  | 'labor-day'
  | 'mexican-independence'
  | 'indigenous-peoples-day'
  | 'halloween'
  | 'dia-de-muertos'
  | 'veterans-day'
  | 'thanksgiving'
  | 'hanukkah'
  | 'las-posadas'
  | 'christmas'
  | 'kwanzaa'
  | 'eid';

export type BeanUtilityState =
  | 'loading-start'
  | 'loading-sip'
  | 'loading-ready'
  | 'waving'
  | 'chef'
  | 'croissant'
  | 'binoculars'
  | 'construction'
  | 'birthday';

export type DameBeanState = BeanState | BeanHolidayState | BeanUtilityState;

export const beanCopy: Record<DameBeanState, { src: string; alt: string }> = {
  walking: {
    src: '/assets/bean-states/bean-walking.png',
    alt: 'The Dame Bean walking with a cup of coffee',
  },
  sleeping: {
    src: '/assets/bean-states/bean-sleeping.png',
    alt: 'The Dame Bean resting beside a coffee cup',
  },
  confused: {
    src: '/assets/bean-states/bean-confused.png',
    alt: 'The Dame Bean checking a map',
  },
  'sold-out': {
    src: '/assets/bean-states/bean-sold-out.png',
    alt: 'The Dame Bean checking an empty coffee cup',
  },
  celebrating: {
    src: '/assets/bean-states/bean-celebrating.png',
    alt: 'The Dame Bean celebrating with a finished coffee',
  },
  driving: {
    src: '/assets/bean-states/bean-driving.png',
    alt: 'The Dame Bean driving the coffee cart',
  },
  rewards: {
    src: '/assets/bean-states/bean-rewards.png',
    alt: 'The Dame Bean presenting a reward token',
  },
  pouring: {
    src: '/assets/bean-states/bean-pouring.png',
    alt: 'The Dame Bean carefully pouring cold brew',
  },
  spring: {
    src: '/assets/bean-states/bean-spring.png',
    alt: 'The Dame Bean watering a spring flower',
  },
  summer: {
    src: '/assets/bean-states/bean-summer.png',
    alt: 'The Dame Bean enjoying an iced drink in summer',
  },
  autumn: {
    src: '/assets/bean-states/bean-autumn.png',
    alt: 'The Dame Bean bundled in a scarf with autumn leaves',
  },
  halloween: {
    src: '/assets/bean-states/bean-halloween.png',
    alt: 'The Dame Bean dressed for Halloween',
  },
  winter: {
    src: '/assets/bean-states/bean-winter.png',
    alt: 'The Dame Bean carrying a winter gift',
  },
  'new-year': { src: '/assets/bean-states/bean-new-year.png', alt: 'The Dame Bean celebrating the New Year' },
  valentines: { src: '/assets/bean-states/bean-valentines.png', alt: 'The Dame Bean holding a heart for Valentine’s Day' },
  'dia-de-reyes': { src: '/assets/bean-states/bean-dia-de-reyes.png', alt: 'The Dame Bean sharing rosca for Día de Reyes' },
  'lunar-new-year': { src: '/assets/bean-states/bean-lunar-new-year.png', alt: 'The Dame Bean celebrating Lunar New Year' },
  'st-patricks': { src: '/assets/bean-states/bean-st-patricks.png', alt: 'The Dame Bean wearing a clover for Saint Patrick’s Day' },
  easter: { src: '/assets/bean-states/bean-easter.png', alt: 'The Dame Bean carrying an Easter basket' },
  'earth-day': { src: '/assets/bean-states/bean-earth-day.png', alt: 'The Dame Bean holding a seedling for Earth Day' },
  'mothers-day': { src: '/assets/bean-states/bean-mothers-day.png', alt: 'The Dame Bean offering flowers for Mother’s Day' },
  'fathers-day': { src: '/assets/bean-states/bean-fathers-day.png', alt: 'The Dame Bean carrying a Father’s Day gift' },
  'memorial-day': { src: '/assets/bean-states/bean-memorial-day.png', alt: 'The Dame Bean holding a poppy for Memorial Day' },
  'cinco-de-mayo': { src: '/assets/bean-states/bean-cinco-de-mayo.png', alt: 'The Dame Bean celebrating with papel picado' },
  pride: { src: '/assets/bean-states/bean-pride.png', alt: 'The Dame Bean celebrating Pride' },
  juneteenth: { src: '/assets/bean-states/bean-juneteenth.png', alt: 'The Dame Bean celebrating Juneteenth' },
  'fourth-of-july': { src: '/assets/bean-states/bean-fourth-of-july.png', alt: 'The Dame Bean celebrating the Fourth of July' },
  'labor-day': { src: '/assets/bean-states/bean-labor-day.png', alt: 'The Dame Bean serving coffee for Labor Day' },
  'mexican-independence': { src: '/assets/bean-states/bean-mexican-independence.png', alt: 'The Dame Bean celebrating Mexican Independence Day' },
  'indigenous-peoples-day': { src: '/assets/bean-states/bean-indigenous-peoples-day.png', alt: 'The Dame Bean honoring Indigenous Peoples’ Day' },
  'dia-de-muertos': { src: '/assets/bean-states/bean-dia-de-muertos.png', alt: 'The Dame Bean holding a candle for Día de Muertos' },
  'veterans-day': { src: '/assets/bean-states/bean-veterans-day.png', alt: 'The Dame Bean honoring Veterans Day' },
  thanksgiving: { src: '/assets/bean-states/bean-thanksgiving.png', alt: 'The Dame Bean sharing pie for Thanksgiving' },
  hanukkah: { src: '/assets/bean-states/bean-hanukkah.png', alt: 'The Dame Bean celebrating Hanukkah' },
  'las-posadas': { src: '/assets/bean-states/bean-las-posadas.png', alt: 'The Dame Bean carrying a lantern for Las Posadas' },
  christmas: { src: '/assets/bean-states/bean-christmas.png', alt: 'The Dame Bean sharing coffee and a Christmas gift' },
  kwanzaa: { src: '/assets/bean-states/bean-kwanzaa.png', alt: 'The Dame Bean celebrating Kwanzaa' },
  eid: { src: '/assets/bean-states/bean-eid.png', alt: 'The Dame Bean celebrating Eid' },
  'loading-start': { src: '/assets/bean-states/bean-loading-start.png', alt: 'The Dame Bean arriving with coffee' },
  'loading-sip': { src: '/assets/bean-states/bean-loading-sip.png', alt: 'The Dame Bean taking a sip of coffee' },
  'loading-ready': { src: '/assets/bean-states/bean-loading-ready.png', alt: 'The Dame Bean waving with coffee ready' },
  waving: { src: '/assets/bean-states/bean-waving.png', alt: 'The Dame Bean waving hello' },
  chef: { src: '/assets/bean-states/bean-chef.png', alt: 'The Dame Bean presenting a fresh croissant' },
  croissant: { src: '/assets/bean-states/bean-croissant.png', alt: 'The Dame Bean hugging a croissant' },
  binoculars: { src: '/assets/bean-states/bean-binoculars.png', alt: 'The Dame Bean looking for the next Dame stop' },
  construction: { src: '/assets/bean-states/bean-construction.png', alt: 'The Dame Bean building something new' },
  birthday: { src: '/assets/bean-states/bean-birthday.png', alt: 'The Dame Bean celebrating a birthday' },
};

export const beanStateGroups = {
  moments: [
    'walking',
    'sleeping',
    'confused',
    'sold-out',
    'celebrating',
    'driving',
    'rewards',
    'pouring',
  ],
  utility: [
    'loading-start',
    'loading-sip',
    'loading-ready',
    'waving',
    'chef',
    'croissant',
    'binoculars',
    'construction',
    'birthday',
  ],
  seasons: ['spring', 'summer', 'autumn', 'winter'],
  holidays: [
    'new-year',
    'valentines',
    'dia-de-reyes',
    'lunar-new-year',
    'st-patricks',
    'easter',
    'earth-day',
    'mothers-day',
    'fathers-day',
    'memorial-day',
    'cinco-de-mayo',
    'pride',
    'juneteenth',
    'fourth-of-july',
    'labor-day',
    'mexican-independence',
    'indigenous-peoples-day',
    'halloween',
    'dia-de-muertos',
    'veterans-day',
    'thanksgiving',
    'hanukkah',
    'las-posadas',
    'christmas',
    'kwanzaa',
    'eid',
  ],
} satisfies Record<string, readonly DameBeanState[]>;

function isNthWeekday(date: Date, weekday: number, occurrence: number) {
  return date.getDay() === weekday && Math.ceil(date.getDate() / 7) === occurrence;
}

function isLastWeekday(date: Date, weekday: number) {
  const nextWeek = new Date(date);
  nextWeek.setDate(date.getDate() + 7);
  return date.getDay() === weekday && nextWeek.getMonth() !== date.getMonth();
}

function easterDate(year: number) {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31) - 1;
  const day = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month, day);
}

function calendarParts(date: Date, calendar: 'chinese' | 'islamic' | 'hebrew') {
  try {
    const parts = new Intl.DateTimeFormat(`en-US-u-ca-${calendar}`, {
      month: 'long',
      day: 'numeric',
    }).formatToParts(date);
    return {
      month: parts.find((part) => part.type === 'month')?.value ?? '',
      day: Number(parts.find((part) => part.type === 'day')?.value ?? 0),
    };
  } catch {
    return { month: '', day: 0 };
  }
}

export function holidayBeanFor(date = new Date()): BeanHolidayState | null {
  const month = date.getMonth();
  const day = date.getDate();

  if (month === 0 && day === 1) return 'new-year';
  if (month === 0 && day === 6) return 'dia-de-reyes';
  if (month === 1 && day === 14) return 'valentines';

  const chinese = calendarParts(date, 'chinese');
  if (chinese.month === 'First Month' && chinese.day <= 2) return 'lunar-new-year';

  const islamic = calendarParts(date, 'islamic');
  if ((islamic.month === 'Shawwal' && islamic.day <= 3) || (islamic.month === 'Dhuʻl-Hijjah' && islamic.day >= 10 && islamic.day <= 13)) return 'eid';

  if (month === 2 && day === 17) return 'st-patricks';
  const easter = easterDate(date.getFullYear());
  if (month === easter.getMonth() && day === easter.getDate()) return 'easter';
  if (month === 3 && day === 22) return 'earth-day';
  if (month === 4 && day === 5) return 'cinco-de-mayo';
  if (month === 4 && isNthWeekday(date, 0, 2)) return 'mothers-day';
  if (month === 4 && isLastWeekday(date, 1)) return 'memorial-day';
  if (month === 5 && day === 19) return 'juneteenth';
  if (month === 5 && isNthWeekday(date, 0, 3)) return 'fathers-day';
  if (month === 5) return 'pride';
  if (month === 6 && day === 4) return 'fourth-of-july';
  if (month === 8 && isNthWeekday(date, 1, 1)) return 'labor-day';
  if (month === 8 && day === 16) return 'mexican-independence';
  if (month === 9 && isNthWeekday(date, 1, 2)) return 'indigenous-peoples-day';
  if (month === 9 && day === 31) return 'halloween';
  if (month === 10 && day <= 2) return 'dia-de-muertos';
  if (month === 10 && day === 11) return 'veterans-day';
  if (month === 10 && isNthWeekday(date, 4, 4)) return 'thanksgiving';

  const hebrew = calendarParts(date, 'hebrew');
  if ((hebrew.month === 'Kislev' && hebrew.day >= 25) || (hebrew.month === 'Tevet' && hebrew.day <= 3)) return 'hanukkah';

  if (month === 11 && day >= 16 && day <= 24) return 'las-posadas';
  if (month === 11 && day === 25) return 'christmas';
  if (month === 11 && day >= 26 && day <= 31) return 'kwanzaa';
  return null;
}

export function seasonalBeanFor(date = new Date()): DameBeanState {
  const holiday = holidayBeanFor(date);
  if (holiday) return holiday;
  const month = date.getMonth();
  if (month === 9) return 'halloween';
  if (month === 11 || month <= 1) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  return 'autumn';
}

export default function BeanStateImage({
  state,
  className,
  priority = false,
  decorative = false,
}: {
  state: DameBeanState;
  className?: string;
  priority?: boolean;
  decorative?: boolean;
}) {
  const bean = beanCopy[state];

  return (
    <Image
      src={bean.src}
      alt={decorative ? '' : bean.alt}
      width={1254}
      height={1254}
      className={className}
      priority={priority}
      sizes="(max-width: 720px) 52vw, 320px"
      aria-hidden={decorative || undefined}
    />
  );
}
