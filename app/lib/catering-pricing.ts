export const CATERING_BASE_DRINKS = 100;
export const CATERING_BASE_HOURS = 2;
export const CATERING_BASE_PRICE_DOLLARS = 750;
export const CATERING_ADDITIONAL_DRINK_DOLLARS = 4;
export const CATERING_ADDITIONAL_HOUR_DOLLARS = 150;

export function calculateCateringEstimateDollars(drinks: number, hours: number) {
  const additionalDrinks = Math.max(0, drinks - CATERING_BASE_DRINKS);
  const additionalHours = Math.max(0, hours - CATERING_BASE_HOURS);

  return (
    CATERING_BASE_PRICE_DOLLARS +
    additionalDrinks * CATERING_ADDITIONAL_DRINK_DOLLARS +
    additionalHours * CATERING_ADDITIONAL_HOUR_DOLLARS
  );
}

export function calculateCateringEstimateCents(drinks: number, hours: number) {
  return calculateCateringEstimateDollars(drinks, hours) * 100;
}
