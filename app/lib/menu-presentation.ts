import type { SquareMenuItem } from './square';
import type { MenuItemPresentation } from './supabase-rest';

const dameDescriptions: Record<string, string> = {
  'cold brew': 'Slow-steeped for 20 hours for a deep, smooth cup with less sharp bitterness.',
  'matcha latte': 'Smooth, vibrant matcha, lightly sweetened and blended with your choice of milk.',
  'brown bear latte': 'Brown sugar and honey bring a warm, smooth sweetness to your choice of matcha or cold brew.',
  'mexicano latte': 'Cinnamon and sugar cane bring a comforting sweetness to your choice of matcha or cold brew.',
  'sugar free bear': 'Sugar-free vanilla and cinnamon create a smooth, cozy drink with matcha or cold brew.',
  'mellow marsh latte': 'Marshmallow and vanilla meet silky cold foam for a soft, creamy finish over matcha or cold brew.',
  'mello marsh latte': 'Marshmallow and vanilla meet silky cold foam for a soft, creamy finish over matcha or cold brew.',
  'mexican mocha': 'Rich chocolate and a touch of cinnamon come together with your choice of matcha or cold brew.',
  croissant: 'Buttery, flaky, and baked until golden—the perfect pairing for any Dame drink.',
};

const categoryDescriptions: Record<SquareMenuItem['category'], string> = {
  basics: 'Simple, smooth, and made fresh over ice.',
  specialty: 'A Dame original layered with smooth, balanced flavor.',
  foam: 'A cold, creamy favorite finished with silky cold foam.',
  food: 'A fresh bite made to pair with your Dame drink.',
};

function currentDescription(item: SquareMenuItem, override?: string | null) {
  const description = override?.trim()
    || dameDescriptions[item.name.trim().toLowerCase()]
    || item.description.trim()
    || categoryDescriptions[item.category];
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
