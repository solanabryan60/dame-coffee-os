'use client';

import { useEffect, useState } from 'react';
import BeanStateImage, { seasonalBeanFor, type BeanState } from './bean-state';

export default function SeasonalBean({ className }: { className?: string }) {
  const [state, setState] = useState<BeanState | null>(null);

  useEffect(() => {
    setState(seasonalBeanFor(new Date()));
  }, []);

  if (!state) return <span className="dame-seasonal-bean-placeholder" aria-hidden="true" />;

  return <BeanStateImage state={state} className={className} decorative />;
}
