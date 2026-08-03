import { getSquareCatalog } from '../../lib/square';
import AdminMenuAvailability from './menu-availability';

export const dynamic = 'force-dynamic';

export default async function AdminMenuPage() {
  const catalog = await getSquareCatalog();
  return <AdminMenuAvailability items={catalog.items} />;
}
