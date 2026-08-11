import type { SquareMenuItem } from './square';
import type { MenuItemPresentation } from './supabase-rest';

function currentDescription(item: SquareMenuItem, override?: string | null) {
  const description = override?.trim() || item.description;
  if (/cold brew/i.test(item.name)) {
    return description.replace(/16[- ]hours?/gi, '20 hours');
  }
  return description;
}

export function applyMenuPresentation(
  items: SquareMenuItem[],
  presentation: MenuItemPresentation[],
) {
  const presentationByItemId = new Map(
    presentation.map((entry) => [entry.square_item_id, entry]),
  );

  return items
    .filter((item) => !presentationByItemId.get(item.id)?.is_hidden)
    .map((item) => {
      const entry = presentationByItemId.get(item.id);
      if (!entry) return { ...item, description: currentDescription(item) };

      return {
        ...item,
        description: currentDescription(item, entry.description),
        imageUrl: entry.image_url?.trim() || item.imageUrl,
        isFeatured: entry.is_featured,
        isSeasonal: entry.is_seasonal,
      };
    });
}
