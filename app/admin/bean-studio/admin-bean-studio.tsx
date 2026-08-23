'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import BeanStudio from '../../bean-studio/bean-studio';
import { getAdminAccessToken } from '../../lib/admin-session';
import AdminHeader from '../admin-header';

export default function AdminBeanStudio() {
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;

    void getAdminAccessToken().then((token) => {
      if (!active) return;
      if (!token) {
        router.replace('/admin/login');
        return;
      }
      setReady(true);
    });

    return () => {
      active = false;
    };
  }, [router]);

  if (!ready) {
    return (
      <main className="admin-shell">
        <p className="admin-empty-state">Opening Bean Studio…</p>
      </main>
    );
  }

  return (
    <main className="admin-shell admin-bean-studio-shell">
      <AdminHeader title="Bean Studio" />
      <BeanStudio />
    </main>
  );
}
