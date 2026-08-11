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

const beanCopy: Record<BeanState, { src: string; alt: string }> = {
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
};

export function seasonalBeanFor(date = new Date()): BeanState {
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
  state: BeanState;
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
