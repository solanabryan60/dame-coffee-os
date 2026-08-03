import { calculateCateringEstimateCents } from './catering-pricing';

const SQUARE_API_VERSION = '2026-07-15';

export type MenuCategoryId = 'basics' | 'specialty' | 'foam' | 'food';

export type SquareMenuVariation = {
  id: string;
  name: string;
  priceAmount: number;
  priceLabel: string;
};

export type SquareMenuModifier = {
  id: string;
  name: string;
  priceAmount: number;
  priceLabel: string;
};

export type SquareMenuModifierGroup = {
  id: string;
  name: string;
  selectionType: 'SINGLE' | 'MULTIPLE';
  minSelected: number;
  maxSelected: number | null;
  options: SquareMenuModifier[];
};

export type SquareMenuItem = {
  id: string;
  name: string;
  description: string;
  category: MenuCategoryId;
  categoryLabel: string;
  imageUrl: string | null;
  variations: SquareMenuVariation[];
  modifierGroups: SquareMenuModifierGroup[];
};

export type SquareCatalogResult = {
  configured: boolean;
  items: SquareMenuItem[];
};

type SquareMoney = {
  amount?: number;
  currency?: string;
};

type CatalogObject = {
  id: string;
  type: string;
  is_deleted?: boolean;
  present_at_all_locations?: boolean;
  present_at_location_ids?: string[];
  category_data?: {
    name?: string;
  };
  image_data?: {
    url?: string;
  };
  modifier_list_data?: {
    name?: string;
    selection_type?: 'SINGLE' | 'MULTIPLE';
    min_selected_modifiers?: number;
    max_selected_modifiers?: number;
    modifiers?: CatalogObject[];
  };
  modifier_data?: {
    name?: string;
    price_money?: SquareMoney;
  };
  item_data?: {
    name?: string;
    description?: string;
    description_html?: string;
    categories?: Array<{ id?: string }>;
    category_id?: string;
    image_ids?: string[];
    modifier_list_info?: Array<{
      modifier_list_id?: string;
      min_selected_modifiers?: number;
      max_selected_modifiers?: number;
    }>;
    variations?: CatalogObject[];
  };
  item_variation_data?: {
    name?: string;
    sellable?: boolean;
    price_money?: SquareMoney;
    location_overrides?: Array<{
      location_id?: string;
      sold_out?: boolean;
      track_inventory?: boolean;
    }>;
  };
};

type SquareListCatalogResponse = {
  objects?: CatalogObject[];
  cursor?: string;
  errors?: Array<{ detail?: string; code?: string }>;
};

type CheckoutLine = {
  variationId: string;
  quantity: number;
  modifierIds: string[];
};

type CheckoutCustomer = {
  name: string;
  phone: string;
  email?: string;
  note?: string;
};

function isExclusiveModifierGroup(groupName: string) {
  return /\b(milk|coffee)\b/i.test(groupName);
}

export type PickupOrderLineItemSnapshot = {
  item_name: string;
  variation_name: string;
  quantity: number;
  modifier_names: string[];
  unit_amount_cents: number;
  line_total_cents: number;
};

export type SquareCustomer = {
  id: string;
  given_name?: string;
  email_address?: string;
  phone_number?: string;
};

type SquareOrder = {
  line_items?: Array<{
    catalog_object_id?: string;
  }>;
  total_money?: SquareMoney;
  total_tax_money?: SquareMoney;
  total_tip_money?: SquareMoney;
  total_service_charge_money?: SquareMoney;
  fulfillments?: Array<{
    type?: string;
    state?: SquareFulfillmentState;
  }>;
};

export type SquareFulfillmentState =
  | 'PROPOSED'
  | 'RESERVED'
  | 'PREPARED'
  | 'COMPLETED'
  | 'CANCELED'
  | 'FAILED';

const fallbackItems: SquareMenuItem[] = [
  {
    id: 'fallback-cold-brew',
    name: 'Cold Brew',
    description: 'Our smooth house cold brew, steeped for 16 hours.',
    category: 'basics',
    categoryLabel: 'The Basics',
    imageUrl: null,
    variations: [{ id: 'fallback-cold-brew-variation', name: 'Regular', priceAmount: 600, priceLabel: '$6.00' }],
    modifierGroups: [],
  },
  {
    id: 'fallback-matcha-latte',
    name: 'Matcha Latte',
    description: 'Matcha, simple syrup, and your choice of milk.',
    category: 'basics',
    categoryLabel: 'The Basics',
    imageUrl: null,
    variations: [{ id: 'fallback-matcha-latte-variation', name: 'Regular', priceAmount: 650, priceLabel: '$6.50' }],
    modifierGroups: [],
  },
  {
    id: 'fallback-brown-bear',
    name: 'Brown Bear Latte',
    description: 'Brown sugar honey syrup with matcha or cold brew.',
    category: 'specialty',
    categoryLabel: 'Specialty Drinks',
    imageUrl: null,
    variations: [{ id: 'fallback-brown-bear-variation', name: 'Regular', priceAmount: 700, priceLabel: '$7.00' }],
    modifierGroups: [],
  },
  {
    id: 'fallback-mexicano',
    name: 'Mexicano Latte',
    description: 'Cinnamon and sugar cane syrup with matcha or cold brew.',
    category: 'specialty',
    categoryLabel: 'Specialty Drinks',
    imageUrl: null,
    variations: [{ id: 'fallback-mexicano-variation', name: 'Regular', priceAmount: 700, priceLabel: '$7.00' }],
    modifierGroups: [],
  },
  {
    id: 'fallback-sugar-free-bear',
    name: 'Sugar Free Bear',
    description: 'Sugar-free vanilla cinnamon with matcha or cold brew.',
    category: 'specialty',
    categoryLabel: 'Specialty Drinks',
    imageUrl: null,
    variations: [{ id: 'fallback-sugar-free-bear-variation', name: 'Regular', priceAmount: 725, priceLabel: '$7.25' }],
    modifierGroups: [],
  },
  {
    id: 'fallback-mellow-marsh',
    name: 'Mellow Marsh Latte',
    description: 'Marshmallow fluff, vanilla, milk, and cold foam with matcha or cold brew.',
    category: 'foam',
    categoryLabel: 'Cold Foam Lovers',
    imageUrl: null,
    variations: [{ id: 'fallback-mellow-marsh-variation', name: 'Regular', priceAmount: 800, priceLabel: '$8.00' }],
    modifierGroups: [],
  },
  {
    id: 'fallback-croissant',
    name: 'Croissant',
    description: 'Fresh flavors available while supplies last.',
    category: 'food',
    categoryLabel: 'Food Items',
    imageUrl: null,
    variations: [{ id: 'fallback-croissant-variation', name: 'Regular', priceAmount: 500, priceLabel: '$5.00' }],
    modifierGroups: [],
  },
];

function getSquareConfig() {
  const accessToken = process.env.SQUARE_ACCESS_TOKEN;
  const locationId = process.env.SQUARE_LOCATION_ID;
  const environment = process.env.SQUARE_ENVIRONMENT === 'sandbox' ? 'sandbox' : 'production';

  if (!accessToken || !locationId) return null;

  return {
    accessToken,
    locationId,
    baseUrl:
      environment === 'sandbox'
        ? 'https://connect.squareupsandbox.com'
        : 'https://connect.squareup.com',
  };
}

function moneyLabel(amount = 0) {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount / 100);
}

function stripHtml(value = '') {
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

function inferCategory(name: string, squareCategory = ''): MenuCategoryId {
  const normalizedName = name.toLowerCase();
  const normalizedCategory = squareCategory.toLowerCase();

  if (normalizedName.includes('croissant') || normalizedCategory.includes('food')) return 'food';
  if (normalizedName.includes('mellow marsh') || normalizedName.includes('cold foam')) return 'foam';
  if (
    normalizedName === 'cold brew' ||
    normalizedName === 'cold brew latte' ||
    normalizedName === 'matcha latte'
  ) {
    return 'basics';
  }
  return 'specialty';
}

function categoryLabel(category: MenuCategoryId) {
  if (category === 'basics') return 'The Basics';
  if (category === 'foam') return 'Cold Foam Lovers';
  if (category === 'food') return 'Food Items';
  return 'Specialty Drinks';
}

function objectIsAtLocation(object: CatalogObject, locationId: string) {
  if (object.present_at_all_locations !== false) return true;
  return object.present_at_location_ids?.includes(locationId) ?? false;
}

async function listCatalogObjects(required = false) {
  const config = getSquareConfig();
  if (!config) {
    if (required) throw new Error('Square ordering has not been configured yet.');
    return null;
  }

  const objects: CatalogObject[] = [];
  let cursor = '';

  for (let page = 0; page < 10; page += 1) {
    const params = new URLSearchParams({
      types: 'ITEM,CATEGORY,MODIFIER_LIST,IMAGE',
    });
    if (cursor) params.set('cursor', cursor);

    const response = await fetch(`${config.baseUrl}/v2/catalog/list?${params}`, {
      headers: {
        Authorization: `Bearer ${config.accessToken}`,
        'Content-Type': 'application/json',
        'Square-Version': SQUARE_API_VERSION,
      },
      cache: 'no-store',
    });

    const payload = (await response.json()) as SquareListCatalogResponse;
    if (!response.ok) {
      const detail = payload.errors?.[0]?.detail || 'Square could not load the menu.';
      if (required) throw new Error(detail);
      return null;
    }

    objects.push(...(payload.objects ?? []));
    cursor = payload.cursor ?? '';
    if (!cursor) break;
  }

  return { config, objects };
}

export async function getSquareCatalog(options: { required?: boolean } = {}): Promise<SquareCatalogResult> {
  const catalog = await listCatalogObjects(options.required);
  if (!catalog) {
    return { configured: false, items: fallbackItems };
  }

  const categories = new Map(
    catalog.objects
      .filter((object) => object.type === 'CATEGORY')
      .map((object) => [object.id, object.category_data?.name ?? '']),
  );
  const images = new Map(
    catalog.objects
      .filter((object) => object.type === 'IMAGE')
      .map((object) => [object.id, object.image_data?.url ?? '']),
  );
  const modifierLists = new Map(
    catalog.objects
      .filter((object) => object.type === 'MODIFIER_LIST')
      .map((object) => [object.id, object]),
  );

  const items = catalog.objects
    .filter(
      (object) =>
        object.type === 'ITEM' &&
        !object.is_deleted &&
        object.item_data?.name &&
        objectIsAtLocation(object, catalog.config.locationId),
    )
    .filter((object) => object.item_data?.name?.toLowerCase() !== 'milk only')
    .map((object): SquareMenuItem | null => {
      const itemData = object.item_data!;
      const variations = (itemData.variations ?? [])
        .filter((variation) => {
          if (variation.is_deleted || variation.item_variation_data?.sellable === false) return false;
          const locationOverride = variation.item_variation_data?.location_overrides?.find(
            (override) => override.location_id === catalog.config.locationId,
          );
          return !locationOverride?.sold_out;
        })
        .map((variation) => {
          const amount = variation.item_variation_data?.price_money?.amount ?? 0;
          return {
            id: variation.id,
            name: variation.item_variation_data?.name || 'Regular',
            priceAmount: amount,
            priceLabel: moneyLabel(amount),
          };
        });

      if (!variations.length) return null;

      const modifierGroups = (itemData.modifier_list_info ?? [])
        .map((info): SquareMenuModifierGroup | null => {
          if (!info.modifier_list_id) return null;
          const list = modifierLists.get(info.modifier_list_id);
          if (!list?.modifier_list_data) return null;

          const options = (list.modifier_list_data.modifiers ?? [])
            .filter((modifier) => !modifier.is_deleted && modifier.modifier_data?.name)
            .map((modifier) => {
              const amount = modifier.modifier_data?.price_money?.amount ?? 0;
              return {
                id: modifier.id,
                name: modifier.modifier_data?.name ?? 'Option',
                priceAmount: amount,
                priceLabel: amount ? `+${moneyLabel(amount)}` : 'Included',
              };
            });

          if (!options.length) return null;

          const itemMin = info.min_selected_modifiers;
          const itemMax = info.max_selected_modifiers;
          const inheritListLimits = itemMin === -1 && itemMax === -1;
          const rawMin = inheritListLimits
            ? list.modifier_list_data.min_selected_modifiers ?? 0
            : itemMin ?? 0;
          const rawMax = inheritListLimits
            ? list.modifier_list_data.max_selected_modifiers ?? 0
            : itemMax ?? 0;

          return {
            id: list.id,
            name: list.modifier_list_data.name || 'Customize',
            selectionType: list.modifier_list_data.selection_type || 'MULTIPLE',
            minSelected: rawMin > 0 ? rawMin : 0,
            maxSelected: rawMax > 0 ? rawMax : null,
            options,
          };
        })
        .filter((group): group is SquareMenuModifierGroup => Boolean(group));

      const firstCategoryId = itemData.categories?.[0]?.id || itemData.category_id || '';
      const category = inferCategory(itemData.name!, categories.get(firstCategoryId) ?? '');
      const imageId = itemData.image_ids?.[0];

      return {
        id: object.id,
        name: itemData.name!,
        description: stripHtml(itemData.description_html || itemData.description || ''),
        category,
        categoryLabel: categoryLabel(category),
        imageUrl: imageId ? images.get(imageId) || null : null,
        variations,
        modifierGroups,
      };
    })
    .filter((item): item is SquareMenuItem => Boolean(item))
    .sort((a, b) => a.name.localeCompare(b.name));

  return {
    configured: true,
    items: items.length ? items : fallbackItems,
  };
}

export function normalizeSquarePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith('1')) return `+${digits}`;
  throw new Error('Enter a valid 10-digit phone number.');
}

async function squareRequest<T>(
  path: string,
  init: RequestInit = {},
  options: { allowNotFound?: boolean } = {},
): Promise<T | null> {
  const config = getSquareConfig();
  if (!config) return null;

  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': SQUARE_API_VERSION,
      ...init.headers,
    },
    cache: 'no-store',
  });
  const payload = (await response.json()) as T & {
    errors?: Array<{ detail?: string; code?: string }>;
  };

  if (options.allowNotFound && response.status === 404) return null;
  if (!response.ok) {
    throw new Error(payload.errors?.[0]?.detail || 'Square is temporarily unavailable.');
  }
  return payload;
}

export async function getSquareCustomer(customerId: string) {
  const payload = await squareRequest<{ customer?: SquareCustomer }>(
    `/v2/customers/${encodeURIComponent(customerId)}`,
    {},
    { allowNotFound: true },
  );
  return payload?.customer ?? null;
}

export async function getSquareOrderRewardContext(orderId: string) {
  const payload = await squareRequest<{ order?: SquareOrder }>(
    `/v2/orders/${encodeURIComponent(orderId)}`,
    {},
    { allowNotFound: true },
  );
  const order = payload?.order;
  if (!order) return null;

  const total = order.total_money?.amount ?? 0;
  const tax = order.total_tax_money?.amount ?? 0;
  const tip = order.total_tip_money?.amount ?? 0;
  const serviceCharges = order.total_service_charge_money?.amount ?? 0;
  const eligibleAmountCents = Math.max(0, total - tax - tip - serviceCharges);
  const variationIds = new Set(
    (order.line_items ?? [])
      .map((line) => line.catalog_object_id)
      .filter((id): id is string => Boolean(id)),
  );
  const categories = new Set<MenuCategoryId>();

  if (variationIds.size) {
    const catalog = await getSquareCatalog({ required: true });
    for (const item of catalog.items) {
      if (item.variations.some((variation) => variationIds.has(variation.id))) {
        categories.add(item.category);
      }
    }
  }

  return {
    eligibleAmountCents,
    categories: [...categories],
  };
}

export async function getSquarePickupFulfillmentState(orderId: string) {
  const payload = await squareRequest<{ order?: SquareOrder }>(
    `/v2/orders/${encodeURIComponent(orderId)}`,
    {},
    { allowNotFound: true },
  );
  const pickup = payload?.order?.fulfillments?.find(
    (fulfillment) => fulfillment.type === 'PICKUP',
  );
  return pickup?.state ?? null;
}

function productionUrl() {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, '');
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) {
    return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  }
  return 'https://www.damecoffeeco.com';
}

export async function createSquarePaymentLink(
  lines: CheckoutLine[],
  customer: CheckoutCustomer,
  waitMinutes: number,
  redirectPath = '/order/complete',
) {
  const catalog = await getSquareCatalog({ required: true });
  const config = getSquareConfig();
  if (!config || !catalog.configured) throw new Error('Square ordering has not been configured yet.');

  const variationItems = new Map(
    catalog.items.flatMap((item) =>
      item.variations.map((variation) => [variation.id, { item, variation }] as const),
    ),
  );

  const preparedLines = lines.map((line) => {
    const match = variationItems.get(line.variationId);
    if (!match) throw new Error('One item is no longer available.');
    const { item, variation } = match;
    if (!Number.isInteger(line.quantity) || line.quantity < 1 || line.quantity > 12) {
      throw new Error('Choose a quantity between 1 and 12.');
    }

    const validModifiers = new Set(
      item.modifierGroups.flatMap((group) => group.options.map((option) => option.id)),
    );
    if (line.modifierIds.some((id) => !validModifiers.has(id))) {
      throw new Error('One customization is no longer available.');
    }

    for (const group of item.modifierGroups) {
      const groupOptionIds = new Set(group.options.map((option) => option.id));
      const selectedCount = line.modifierIds.filter((id) => groupOptionIds.has(id)).length;
      const minimum = isExclusiveModifierGroup(group.name)
        ? Math.min(group.minSelected, 1)
        : group.minSelected;
      if (selectedCount < minimum) {
        throw new Error(`Choose the required ${group.name} option.`);
      }
      if (isExclusiveModifierGroup(group.name) && selectedCount > 1) {
        throw new Error(`Too many ${group.name} options were selected.`);
      }
    }

    const selectedModifiers = item.modifierGroups.flatMap((group) =>
      group.options.filter((option) => line.modifierIds.includes(option.id)),
    );
    const unitAmountCents = variation.priceAmount + selectedModifiers.reduce(
      (total, modifier) => total + modifier.priceAmount,
      0,
    );

    return {
      squareLine: {
        quantity: String(line.quantity),
        catalog_object_id: line.variationId,
        modifiers: line.modifierIds.map((id) => ({
          catalog_object_id: id,
          quantity: '1',
        })),
      },
      snapshot: {
        item_name: item.name,
        variation_name: variation.name,
        quantity: line.quantity,
        modifier_names: selectedModifiers.map((modifier) => modifier.name),
        unit_amount_cents: unitAmountCents,
        line_total_cents: unitAmountCents * line.quantity,
      } satisfies PickupOrderLineItemSnapshot,
    };
  });

  const snapshots = preparedLines.map((line) => line.snapshot);
  const subtotalCents = snapshots.reduce((total, line) => total + line.line_total_cents, 0);

  const response = await fetch(`${config.baseUrl}/v2/online-checkout/payment-links`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': SQUARE_API_VERSION,
    },
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      description: 'Dame Coffee pickup order',
      order: {
        location_id: config.locationId,
        line_items: preparedLines.map((line) => line.squareLine),
        pricing_options: {
          auto_apply_discounts: true,
          auto_apply_taxes: true,
        },
        fulfillments: [
          {
            type: 'PICKUP',
            state: 'PROPOSED',
            pickup_details: {
              recipient: {
                display_name: customer.name.trim().slice(0, 255),
                email_address: customer.email?.trim().toLowerCase().slice(0, 255) || undefined,
                phone_number: normalizeSquarePhone(customer.phone),
              },
              schedule_type: 'ASAP',
              prep_time_duration: `PT${Math.max(1, Math.min(waitMinutes, 120))}M`,
              note: customer.note?.trim().slice(0, 500) || undefined,
            },
          },
        ],
      },
      checkout_options: {
        allow_tipping: true,
        ask_for_shipping_address: false,
        merchant_support_email: 'info@damecoffeeco.com',
        redirect_url: `${productionUrl()}${redirectPath.startsWith('/') ? redirectPath : `/${redirectPath}`}`,
      },
      payment_note: `Dame Coffee pickup for ${customer.name.trim().slice(0, 120)}`,
    }),
    cache: 'no-store',
  });

  const payload = (await response.json()) as {
    payment_link?: { url?: string; order_id?: string };
    errors?: Array<{ detail?: string }>;
  };

  if (!response.ok || !payload.payment_link?.url || !payload.payment_link.order_id) {
    throw new Error(payload.errors?.[0]?.detail || 'Square could not start checkout.');
  }

  return {
    url: payload.payment_link.url,
    orderId: payload.payment_link.order_id,
    lineItems: snapshots,
    subtotalCents,
  };
}

export type CateringDepositRequest = {
  name: string;
  email: string;
  phone: string;
  address: string;
  date: string;
  startTime: string;
  drinks: number;
  hours: number;
};

export async function createSquareCateringDepositLink(
  request: CateringDepositRequest,
  requestId: string,
) {
  const config = getSquareConfig();
  if (!config) throw new Error('Square payments have not been configured yet.');

  const estimateCents = calculateCateringEstimateCents(request.drinks, request.hours);
  const eventSummary = [
    `Event: ${request.date} at ${request.startTime}`,
    `Address: ${request.address}`,
    `Package: ${request.drinks} drinks / ${request.hours} hours`,
    `Website estimate: ${moneyLabel(estimateCents)} plus applicable tax`,
    'This $200 deposit requests the date and is applied to the final balance after Dame confirms availability.',
  ].join('\n');

  const response = await fetch(`${config.baseUrl}/v2/online-checkout/payment-links`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.accessToken}`,
      'Content-Type': 'application/json',
      'Square-Version': SQUARE_API_VERSION,
    },
    body: JSON.stringify({
      idempotency_key: crypto.randomUUID(),
      description: 'Dame Coffee catering date-request deposit',
      order: {
        location_id: config.locationId,
        line_items: [
          {
            name: 'Catering date-request deposit',
            quantity: '1',
            base_price_money: { amount: 20000, currency: 'USD' },
            note: eventSummary.slice(0, 2000),
          },
        ],
      },
      checkout_options: {
        allow_tipping: false,
        ask_for_shipping_address: false,
        merchant_support_email: 'info@damecoffeeco.com',
        redirect_url: `${productionUrl()}/catering/complete?request=${encodeURIComponent(requestId)}`,
      },
      pre_populated_data: {
        buyer_email: request.email.trim().toLowerCase(),
        buyer_phone_number: normalizeSquarePhone(request.phone),
      },
      payment_note: `Dame catering request for ${request.name.trim().slice(0, 120)} · ${request.date}`,
    }),
    cache: 'no-store',
  });

  const payload = (await response.json()) as {
    payment_link?: { url?: string; order_id?: string };
    errors?: Array<{ detail?: string }>;
  };

  if (!response.ok || !payload.payment_link?.url || !payload.payment_link.order_id) {
    throw new Error(payload.errors?.[0]?.detail || 'Square could not start the deposit checkout.');
  }

  return {
    url: payload.payment_link.url,
    orderId: payload.payment_link.order_id,
  };
}
