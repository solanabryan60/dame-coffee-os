export type SiteSettings = {
  id: number;
  location_title: string;
  address: string;
  directions: string;
  hours: string;
  is_open: boolean;
  mobile_ordering: boolean;
  wait_minutes: number;
  maps_url: string;
};

export type AuthUser = {
  id: string;
  email?: string;
  email_confirmed_at?: string | null;
  user_metadata?: Record<string, unknown>;
};

export type AuthSession = {
  access_token: string;
  refresh_token: string;
  expires_in: number;
  expires_at?: number;
  token_type?: string;
  user: AuthUser;
};

export type CustomerProfile = {
  user_id: string;
  first_name: string;
  email: string | null;
  phone: string | null;
  birthday: string | null;
  marketing_opt_in: boolean;
  referral_code: string;
  created_at: string;
  updated_at: string;
};

export type UpcomingEvent = {
  id: string;
  title: string;
  event_date: string;
  start_time: string | null;
  end_time: string | null;
  address: string;
  details: string;
  maps_url: string;
  is_published: boolean;
  created_at: string;
  updated_at: string;
};

export type MenuItemAvailability = {
  square_item_id: string;
  is_sold_out: boolean;
  updated_at: string;
};

export type MenuItemPresentation = {
  square_item_id: string;
  description: string | null;
  image_url: string | null;
  is_featured: boolean;
  is_seasonal: boolean;
  is_hidden: boolean;
  updated_at: string;
};

export type CustomerFavorite = {
  user_id: string;
  square_item_id: string;
  created_at: string;
};

export type InventoryCategory =
  | 'ingredients'
  | 'milk'
  | 'packaging'
  | 'food'
  | 'merchandise'
  | 'other';

export type InventoryItem = {
  id: string;
  name: string;
  category: InventoryCategory;
  quantity: number;
  unit: string;
  low_stock_at: number;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type PrepPhase = 'opening' | 'service' | 'closing';

export type PrepTask = {
  id: number;
  title: string;
  phase: PrepPhase;
  sort_order: number;
  last_completed_on: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
};

export type CateringRequestStatus =
  | 'awaiting_payment'
  | 'deposit_paid'
  | 'contacted'
  | 'confirmed'
  | 'alternate_proposed'
  | 'refund_pending'
  | 'refunded'
  | 'cancelled'
  | 'completed';

export type CateringRequest = {
  id: string;
  customer_user_id: string | null;
  name: string;
  email: string;
  phone: string;
  company: string;
  guest_count: number | null;
  event_setting: 'indoor' | 'outdoor' | 'both' | 'unsure';
  budget_cents: number | null;
  customer_notes: string;
  address: string;
  event_date: string;
  start_time: string;
  drinks: number;
  service_hours: number;
  estimate_cents: number;
  deposit_cents: number;
  status: CateringRequestStatus;
  square_order_id: string;
  square_payment_id: string | null;
  internal_notes: string;
  deposit_paid_at: string | null;
  confirmed_at: string | null;
  refunded_at: string | null;
  created_at: string;
  updated_at: string;
};

export type StaffProfile = {
  user_id: string;
  display_name: string;
  role: 'owner' | 'manager' | 'barista';
  active: boolean;
  created_at: string;
  updated_at: string;
};

export type StaffShift = {
  id: string;
  user_id: string;
  shift_date: string;
  starts_at: string;
  ends_at: string;
  location: string;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type EmployeeTimeEntry = {
  id: string;
  user_id: string;
  clocked_in_at: string;
  clocked_out_at: string | null;
  notes: string;
  created_at: string;
  updated_at: string;
};

export type EmployeeResource = {
  id: string;
  resource_type: 'recipe' | 'training';
  title: string;
  content: string;
  media_url: string | null;
  active: boolean;
  sort_order: number;
  created_at: string;
  updated_at: string;
};

export type PickupOrderStatus =
  | 'awaiting_payment'
  | 'paid'
  | 'preparing'
  | 'ready'
  | 'picked_up'
  | 'refund_pending'
  | 'refunded'
  | 'cancelled';

export type PickupOrderLineItem = {
  item_name: string;
  variation_name: string;
  quantity: number;
  modifier_names: string[];
  unit_amount_cents: number;
  line_total_cents: number;
};

export type PickupOrder = {
  id: string;
  customer_user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_note: string;
  line_items: PickupOrderLineItem[];
  subtotal_cents: number;
  paid_cents: number | null;
  status: PickupOrderStatus;
  square_order_id: string;
  square_payment_id: string | null;
  tracking_token_hash: string;
  location_title: string;
  location_address: string;
  quoted_wait_minutes: number;
  internal_notes: string;
  paid_at: string | null;
  preparing_at: string | null;
  ready_at: string | null;
  picked_up_at: string | null;
  refunded_at: string | null;
  cancelled_at: string | null;
  created_at: string;
  updated_at: string;
};

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

function requireConfig() {
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Supabase environment variables are missing in Vercel.');
  }
  return { supabaseUrl, supabaseKey };
}

export async function readSiteSettings(): Promise<SiteSettings> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/site_settings?id=eq.1&select=*`,
    {
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${config.supabaseKey}`,
      },
      cache: 'no-store',
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Could not load site settings.');
  }

  const rows = (await response.json()) as SiteSettings[];
  if (!rows[0]) throw new Error('The site_settings row has not been created.');
  return rows[0];
}

async function publicRequest<T>(path: string, accessToken?: string): Promise<T> {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1${path}`, {
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${accessToken || config.supabaseKey}`,
    },
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not load Dame Coffee.'));
  return payload as T;
}

export async function readMenuAvailability() {
  return publicRequest<MenuItemAvailability[]>(
    '/menu_item_availability?select=*&order=updated_at.desc',
  );
}

export async function readMenuPresentation() {
  return publicRequest<MenuItemPresentation[]>(
    '/menu_item_presentation?select=*&order=updated_at.desc',
  );
}

export async function listMenuAvailabilityForAdmin(accessToken: string) {
  return publicRequest<MenuItemAvailability[]>(
    '/menu_item_availability?select=*&order=updated_at.desc',
    accessToken,
  );
}

export async function listMenuPresentationForAdmin(accessToken: string) {
  return publicRequest<MenuItemPresentation[]>(
    '/menu_item_presentation?select=*&order=updated_at.desc',
    accessToken,
  );
}

export async function setMenuItemPresentation(
  accessToken: string,
  input: Pick<
    MenuItemPresentation,
    | 'square_item_id'
    | 'description'
    | 'image_url'
    | 'is_featured'
    | 'is_seasonal'
    | 'is_hidden'
  >,
) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/menu_item_presentation?on_conflict=square_item_id`,
    {
      method: 'POST',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        ...input,
        description: input.description?.trim() || null,
        image_url: input.image_url?.trim() || null,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not update that menu item.'));
  const presentation = (payload as MenuItemPresentation[])[0];
  if (!presentation) throw new Error('Could not update that menu item.');
  return presentation;
}

const MENU_PHOTO_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp']);

export async function uploadMenuPhoto(
  accessToken: string,
  squareItemId: string,
  file: File,
) {
  const config = requireConfig();
  if (!MENU_PHOTO_TYPES.has(file.type)) {
    throw new Error('Choose a JPG, PNG, or WebP photo.');
  }
  if (file.size <= 0 || file.size > 5 * 1024 * 1024) {
    throw new Error('Menu photos must be smaller than 5 MB.');
  }

  const extension = file.type === 'image/png'
    ? 'png'
    : file.type === 'image/webp'
      ? 'webp'
      : 'jpg';
  const safeItemId = squareItemId.replace(/[^a-zA-Z0-9_-]/g, '').slice(0, 120) || 'menu-item';
  const objectPath = `${safeItemId}/${crypto.randomUUID()}.${extension}`;
  const encodedPath = objectPath.split('/').map(encodeURIComponent).join('/');
  const response = await fetch(
    `${config.supabaseUrl}/storage/v1/object/menu-media/${encodedPath}`,
    {
      method: 'POST',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': file.type,
        'Cache-Control': '3600',
        'x-upsert': 'false',
      },
      body: file,
    },
  );
  const payload = await response.json().catch(() => null);
  if (!response.ok) throw new Error(authError(payload, 'Could not upload that menu photo.'));

  return `${config.supabaseUrl}/storage/v1/object/public/menu-media/${encodedPath}`;
}

export async function setMenuItemSoldOut(
  accessToken: string,
  squareItemId: string,
  isSoldOut: boolean,
) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/menu_item_availability?on_conflict=square_item_id`,
    {
      method: 'POST',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'resolution=merge-duplicates,return=representation',
      },
      body: JSON.stringify({
        square_item_id: squareItemId,
        is_sold_out: isSoldOut,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not update that menu item.'));
  const availability = (payload as MenuItemAvailability[])[0];
  if (!availability) throw new Error('Could not update that menu item.');
  return availability;
}

export async function listInventoryItemsForAdmin(accessToken: string) {
  return publicRequest<InventoryItem[]>(
    '/inventory_items?select=*&order=category.asc,name.asc',
    accessToken,
  );
}

export async function createInventoryItemForAdmin(
  accessToken: string,
  input: Pick<InventoryItem, 'name' | 'category' | 'quantity' | 'unit' | 'low_stock_at' | 'notes'>,
) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/inventory_items`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(input),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not add that inventory item.'));
  const item = (payload as InventoryItem[])[0];
  if (!item) throw new Error('Could not add that inventory item.');
  return item;
}

export async function updateInventoryItemForAdmin(
  accessToken: string,
  itemId: string,
  input: Pick<InventoryItem, 'quantity' | 'low_stock_at' | 'notes'>,
) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/inventory_items?id=eq.${encodeURIComponent(itemId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ ...input, updated_at: new Date().toISOString() }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not update that inventory item.'));
  const item = (payload as InventoryItem[])[0];
  if (!item) throw new Error('Could not update that inventory item.');
  return item;
}

export async function deleteInventoryItemForAdmin(accessToken: string, itemId: string) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/inventory_items?id=eq.${encodeURIComponent(itemId)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=minimal',
      },
    },
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(authError(payload, 'Could not remove that inventory item.'));
  }
}

export async function listPrepTasksForAdmin(accessToken: string) {
  return publicRequest<PrepTask[]>(
    '/prep_tasks?select=*&order=phase.asc,sort_order.asc,id.asc',
    accessToken,
  );
}

export async function createPrepTaskForAdmin(
  accessToken: string,
  input: Pick<PrepTask, 'title' | 'phase' | 'sort_order'>,
) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/prep_tasks`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(input),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not add that prep task.'));
  const task = (payload as PrepTask[])[0];
  if (!task) throw new Error('Could not add that prep task.');
  return task;
}

export async function updatePrepTaskForAdmin(
  accessToken: string,
  taskId: number,
  input: Partial<Pick<PrepTask, 'title' | 'phase' | 'sort_order' | 'last_completed_on' | 'completed_at'>>,
) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/prep_tasks?id=eq.${taskId}`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ ...input, updated_at: new Date().toISOString() }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not update that prep task.'));
  const task = (payload as PrepTask[])[0];
  if (!task) throw new Error('Could not update that prep task.');
  return task;
}

export async function deletePrepTaskForAdmin(accessToken: string, taskId: number) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/prep_tasks?id=eq.${taskId}`,
    {
      method: 'DELETE',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=minimal',
      },
    },
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(authError(payload, 'Could not remove that prep task.'));
  }
}

export async function readUpcomingEvents(): Promise<UpcomingEvent[]> {
  const today = new Date().toISOString().slice(0, 10);
  return publicRequest<UpcomingEvent[]>(
    `/upcoming_events?is_published=is.true&event_date=gte.${today}&select=*&order=event_date.asc,start_time.asc&limit=8`,
  );
}

export async function listUpcomingEventsForAdmin(accessToken: string) {
  return publicRequest<UpcomingEvent[]>(
    '/upcoming_events?select=*&order=event_date.asc,start_time.asc',
    accessToken,
  );
}

export async function createUpcomingEvent(
  accessToken: string,
  input: Omit<UpcomingEvent, 'id' | 'created_at' | 'updated_at'>,
) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/upcoming_events`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify(input),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not add that event.'));
  const event = (payload as UpcomingEvent[])[0];
  if (!event) throw new Error('Could not add that event.');
  return event;
}

export async function setUpcomingEventPublished(
  accessToken: string,
  eventId: string,
  isPublished: boolean,
) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/upcoming_events?id=eq.${encodeURIComponent(eventId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        is_published: isPublished,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not update that event.'));
  const event = (payload as UpcomingEvent[])[0];
  if (!event) throw new Error('Could not update that event.');
  return event;
}

export async function deleteUpcomingEvent(accessToken: string, eventId: string) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/upcoming_events?id=eq.${encodeURIComponent(eventId)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=minimal',
      },
    },
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(authError(payload, 'Could not remove that event.'));
  }
}

export async function listCateringRequestsForAdmin(accessToken: string) {
  return publicRequest<CateringRequest[]>(
    '/catering_requests?select=*&order=event_date.asc,start_time.asc,created_at.desc',
    accessToken,
  );
}

export async function listPickupOrdersForAdmin(accessToken: string) {
  return publicRequest<PickupOrder[]>(
    '/pickup_orders?select=*&order=created_at.desc&limit=100',
    accessToken,
  );
}

export async function listCustomerPickupOrders(accessToken: string, userId: string) {
  return publicRequest<PickupOrder[]>(
    `/pickup_orders?customer_user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc&limit=50`,
    accessToken,
  );
}

export async function listCustomerCateringRequests(accessToken: string, userId: string) {
  return publicRequest<CateringRequest[]>(
    `/catering_requests?customer_user_id=eq.${encodeURIComponent(userId)}&select=*&order=event_date.desc,start_time.desc&limit=50`,
    accessToken,
  );
}

export async function listCustomerFavorites(accessToken: string, userId: string) {
  return publicRequest<CustomerFavorite[]>(
    `/customer_favorites?user_id=eq.${encodeURIComponent(userId)}&select=*&order=created_at.desc`,
    accessToken,
  );
}

export async function setCustomerFavorite(
  accessToken: string,
  userId: string,
  squareItemId: string,
  selected: boolean,
) {
  const config = requireConfig();
  const itemFilter = encodeURIComponent(squareItemId);
  const endpoint = selected
    ? `${config.supabaseUrl}/rest/v1/customer_favorites?on_conflict=user_id,square_item_id`
    : `${config.supabaseUrl}/rest/v1/customer_favorites?user_id=eq.${encodeURIComponent(userId)}&square_item_id=eq.${itemFilter}`;
  const response = await fetch(
    endpoint,
    selected
      ? {
          method: 'POST',
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
            Prefer: 'resolution=merge-duplicates,return=minimal',
          },
          body: JSON.stringify({ user_id: userId, square_item_id: squareItemId }),
        }
      : {
          method: 'DELETE',
          headers: {
            apikey: config.supabaseKey,
            Authorization: `Bearer ${accessToken}`,
            Prefer: 'return=minimal',
          },
        },
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(authError(payload, 'Could not update that favorite.'));
  }
}

export async function listStaffProfilesForAdmin(accessToken: string) {
  return publicRequest<StaffProfile[]>(
    '/staff_profiles?select=*&order=active.desc,display_name.asc',
    accessToken,
  );
}

export async function updateStaffProfileForAdmin(
  accessToken: string,
  userId: string,
  input: Pick<StaffProfile, 'display_name' | 'role' | 'active'>,
) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/staff_profiles?user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        display_name: input.display_name.trim(),
        role: input.role,
        active: input.active,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not update that team member.'));
  const profile = (payload as StaffProfile[])[0];
  if (!profile) throw new Error('Could not update that team member.');
  return profile;
}

export async function listStaffShiftsForAdmin(accessToken: string) {
  return publicRequest<StaffShift[]>(
    '/staff_shifts?select=*&order=shift_date.asc,starts_at.asc&limit=200',
    accessToken,
  );
}

export async function createStaffShiftForAdmin(
  accessToken: string,
  input: Pick<StaffShift, 'user_id' | 'shift_date' | 'starts_at' | 'ends_at' | 'location' | 'notes'>,
) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/staff_shifts`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ ...input, location: input.location.trim(), notes: input.notes.trim() }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not add that shift.'));
  const shift = (payload as StaffShift[])[0];
  if (!shift) throw new Error('Could not add that shift.');
  return shift;
}

export async function deleteStaffShiftForAdmin(accessToken: string, shiftId: string) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/staff_shifts?id=eq.${encodeURIComponent(shiftId)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=minimal',
      },
    },
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(authError(payload, 'Could not remove that shift.'));
  }
}

export async function listEmployeeTimeEntriesForAdmin(accessToken: string) {
  return publicRequest<EmployeeTimeEntry[]>(
    '/employee_time_entries?select=*&order=clocked_in_at.desc&limit=100',
    accessToken,
  );
}

export async function clockInForAdmin(accessToken: string, userId: string) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/employee_time_entries`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({ user_id: userId }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not clock in.'));
  const entry = (payload as EmployeeTimeEntry[])[0];
  if (!entry) throw new Error('Could not clock in.');
  return entry;
}

export async function clockOutForAdmin(accessToken: string, entryId: string) {
  const config = requireConfig();
  const now = new Date().toISOString();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/employee_time_entries?id=eq.${encodeURIComponent(entryId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({ clocked_out_at: now, updated_at: now }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not clock out.'));
  const entry = (payload as EmployeeTimeEntry[])[0];
  if (!entry) throw new Error('Could not clock out.');
  return entry;
}

export async function listEmployeeResourcesForAdmin(accessToken: string) {
  return publicRequest<EmployeeResource[]>(
    '/employee_resources?select=*&order=resource_type.asc,sort_order.asc,title.asc',
    accessToken,
  );
}

export async function createEmployeeResourceForAdmin(
  accessToken: string,
  input: Pick<EmployeeResource, 'resource_type' | 'title' | 'content' | 'media_url'>,
) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/rest/v1/employee_resources`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      Prefer: 'return=representation',
    },
    body: JSON.stringify({
      ...input,
      title: input.title.trim(),
      content: input.content.trim(),
      media_url: input.media_url?.trim() || null,
    }),
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not add that team resource.'));
  const resource = (payload as EmployeeResource[])[0];
  if (!resource) throw new Error('Could not add that team resource.');
  return resource;
}

export async function deleteEmployeeResourceForAdmin(accessToken: string, resourceId: string) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/employee_resources?id=eq.${encodeURIComponent(resourceId)}`,
    {
      method: 'DELETE',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        Prefer: 'return=minimal',
      },
    },
  );
  if (!response.ok) {
    const payload = await response.json().catch(() => null);
    throw new Error(authError(payload, 'Could not remove that team resource.'));
  }
}

export async function updatePickupOrderForAdmin(
  accessToken: string,
  orderId: string,
  input: {
    status: PickupOrderStatus;
    internal_notes: string;
  },
) {
  const config = requireConfig();
  const now = new Date().toISOString();
  const timestampFields: Partial<Pick<
    PickupOrder,
    'preparing_at' | 'ready_at' | 'picked_up_at' | 'cancelled_at'
  >> = {};
  if (input.status === 'preparing') timestampFields.preparing_at = now;
  if (input.status === 'ready') timestampFields.ready_at = now;
  if (input.status === 'picked_up') timestampFields.picked_up_at = now;
  if (input.status === 'cancelled') timestampFields.cancelled_at = now;

  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/pickup_orders?id=eq.${encodeURIComponent(orderId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        status: input.status,
        internal_notes: input.internal_notes.trim(),
        ...timestampFields,
        updated_at: now,
      }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not update that pickup order.'));
  const order = (payload as PickupOrder[])[0];
  if (!order) throw new Error('Could not update that pickup order.');
  return order;
}

export async function updateCateringRequestForAdmin(
  accessToken: string,
  requestId: string,
  input: {
    status: CateringRequestStatus;
    internal_notes: string;
  },
) {
  const config = requireConfig();
  const now = new Date().toISOString();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/catering_requests?id=eq.${encodeURIComponent(requestId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        status: input.status,
        internal_notes: input.internal_notes.trim(),
        ...(input.status === 'confirmed' ? { confirmed_at: now } : {}),
        updated_at: now,
      }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not update that catering request.'));
  const cateringRequest = (payload as CateringRequest[])[0];
  if (!cateringRequest) throw new Error('Could not update that catering request.');
  return cateringRequest;
}

export async function loginAdmin(email: string, password: string) {
  const session = await loginCustomer(email, password);
  const membership = await readAdminMembership(session.access_token, session.user.id);
  if (!membership) {
    throw new Error('This account does not have access to Dame Coffee OS.');
  }
  return session;
}

export async function updateSiteSettings(
  settings: SiteSettings,
  accessToken: string,
): Promise<void> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/site_settings?id=eq.1`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal',
      },
      body: JSON.stringify({
        location_title: settings.location_title,
        address: settings.address,
        directions: settings.directions,
        hours: settings.hours,
        is_open: settings.is_open,
        mobile_ordering: settings.mobile_ordering,
        wait_minutes: settings.wait_minutes,
        maps_url: settings.maps_url,
      }),
    },
  );

  if (!response.ok) {
    const message = await response.text();
    throw new Error(message || 'Could not save changes.');
  }
}

function authError(payload: unknown, fallback: string) {
  if (!payload || typeof payload !== 'object') return fallback;
  const record = payload as Record<string, unknown>;
  return String(
    record.error_description ||
      record.msg ||
      record.message ||
      record.error ||
      fallback,
  );
}

export function normalizeUsPhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  throw new Error('Enter a valid 10-digit phone number.');
}

export async function signUpCustomer(input: {
  firstName: string;
  email: string;
  phone: string;
  birthday?: string;
  password: string;
  marketingOptIn: boolean;
  referralCode?: string;
}) {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/auth/v1/signup`, {
    method: 'POST',
    headers: {
      apikey: config.supabaseKey,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      email: input.email.trim().toLowerCase(),
      password: input.password,
      data: {
        first_name: input.firstName.trim(),
        phone: normalizeUsPhone(input.phone),
        birthday: input.birthday || null,
        marketing_opt_in: input.marketingOptIn,
        referral_code: input.referralCode?.trim().toUpperCase() || null,
      },
    }),
  });

  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not create your account.'));
  return payload as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    expires_at?: number;
    user: AuthUser;
  };
}

export async function loginCustomer(email: string, password: string): Promise<AuthSession> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/auth/v1/token?grant_type=password`,
    {
      method: 'POST',
      headers: {
        apikey: config.supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email: email.trim().toLowerCase(), password }),
    },
  );

  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Sign in failed.'));
  return payload as AuthSession;
}

export async function refreshCustomerSession(refreshToken: string): Promise<AuthSession> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/auth/v1/token?grant_type=refresh_token`,
    {
      method: 'POST',
      headers: {
        apikey: config.supabaseKey,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ refresh_token: refreshToken }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Your session has expired.'));
  return payload as AuthSession;
}

export async function readAuthUser(accessToken: string): Promise<AuthUser> {
  const config = requireConfig();
  const response = await fetch(`${config.supabaseUrl}/auth/v1/user`, {
    headers: {
      apikey: config.supabaseKey,
      Authorization: `Bearer ${accessToken}`,
    },
    cache: 'no-store',
  });
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Please sign in again.'));
  return payload as AuthUser;
}

export async function readCustomerProfile(
  accessToken: string,
  userId: string,
): Promise<CustomerProfile> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/customer_profiles?user_id=eq.${encodeURIComponent(userId)}&select=*`,
    {
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not load your profile.'));
  const rows = payload as CustomerProfile[];
  if (!rows[0]) throw new Error('Your rewards profile is still being prepared.');
  return rows[0];
}

export async function updateCustomerProfile(
  accessToken: string,
  userId: string,
  profile: Pick<CustomerProfile, 'first_name' | 'phone' | 'birthday' | 'marketing_opt_in'>,
) {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/customer_profiles?user_id=eq.${encodeURIComponent(userId)}`,
    {
      method: 'PATCH',
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        first_name: profile.first_name.trim(),
        phone: profile.phone ? normalizeUsPhone(profile.phone) : null,
        birthday: profile.birthday || null,
        marketing_opt_in: profile.marketing_opt_in,
        updated_at: new Date().toISOString(),
      }),
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not save your profile.'));
  return (payload as CustomerProfile[])[0];
}

export async function readAdminMembership(
  accessToken: string,
  userId: string,
): Promise<boolean> {
  const config = requireConfig();
  const response = await fetch(
    `${config.supabaseUrl}/rest/v1/admin_users?user_id=eq.${encodeURIComponent(userId)}&select=user_id`,
    {
      headers: {
        apikey: config.supabaseKey,
        Authorization: `Bearer ${accessToken}`,
      },
      cache: 'no-store',
    },
  );
  const payload = await response.json();
  if (!response.ok) throw new Error(authError(payload, 'Could not verify admin access.'));
  return Array.isArray(payload) && payload.length > 0;
}
