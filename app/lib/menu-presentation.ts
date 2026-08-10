import type { SquareMenuItem } from './square';
import type { MenuItemPresentation } from './supabase-rest';

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
      if (!entry) return item;

      return {
        ...item,
        description: entry.description?.trim() || item.description,
        imageUrl: entry.image_url?.trim() || item.imageUrl,
        isFeatured: entry.is_featured,
        isSeasonal: entry.is_seasonal,
      };
    });
}
