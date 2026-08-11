import type { SquareMenuItem, SquareMenuModifier, SquareMenuModifierGroup } from './square';

const VIRTUAL_MODIFIER_PREFIX = 'dame-order-option:';

export function isExclusiveModifierGroup(group: SquareMenuModifierGroup) {
  return /\b(milk|coffee)\b/i.test(group.name);
}

export function requiredSelectionsForOrdering(group: SquareMenuModifierGroup) {
  return isExclusiveModifierGroup(group) ? 1 : 0;
}

export function isVirtualOrderModifier(modifierId: string) {
  return modifierId.startsWith(VIRTUAL_MODIFIER_PREFIX);
}

function virtualModifier(
  group: SquareMenuModifierGroup,
  slug: string,
  name: string,
): SquareMenuModifier {
  return {
    id: `${VIRTUAL_MODIFIER_PREFIX}${group.id}:${slug}`,
    name,
    priceAmount: 0,
    priceLabel: 'Included',
  };
}

function addOptionIfMissing(
  options: SquareMenuModifier[],
  group: SquareMenuModifierGroup,
  slug: string,
  name: string,
) {
  const alreadyAvailable = options.some(
    (option) => option.name.trim().toLowerCase() === name.toLowerCase(),
  );
  return alreadyAvailable ? options : [...options, virtualModifier(group, slug, name)];
}

export function orderingModifierGroups(item: SquareMenuItem) {
  const visibleGroups = item.category === 'foam'
    ? item.modifierGroups
        .filter((group) => !/\bcold\s*foam\b/i.test(group.name))
        .map((group) => ({
          ...group,
          options: group.options.filter((option) => !/\bcold\s*foam\b/i.test(option.name)),
        }))
        .filter((group) => group.options.length > 0)
    : item.modifierGroups;

  return visibleGroups.map((group) => {
    let options = group.options;

    if (/\bmilk\b/i.test(group.name)) {
      options = addOptionIfMissing(options, group, 'no-milk', 'No Milk');
      options = addOptionIfMissing(options, group, 'water', 'Water');
    }

    if (/\bextras?\b/i.test(group.name)) {
      options = addOptionIfMissing(options, group, 'extra-ice', 'Extra Ice');
    }

    return { ...group, options };
  });
}
