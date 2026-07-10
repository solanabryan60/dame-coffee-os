export type LiveLocation = {
  title: string;
  address: string;
  directions: string;
  hours: string;
  isOpen: boolean;
  mobileOrdering: boolean;
  waitMinutes: number;
  mapsUrl: string;
};

// Temporary control center for the live location section.
// Edit these values in GitHub and Vercel will redeploy automatically.
// In the next phase, these fields will move into the private admin dashboard.
export const liveLocation: LiveLocation = {
  title: 'VENICE BEACH',
  address: 'Ocean Front Walk near The Waterfront, Venice, CA',
  directions: 'Look for the white Dame Coffee cart along Ocean Front Walk near The Waterfront.',
  hours: '6:00 AM–4:00 PM',
  isOpen: true,
  mobileOrdering: false,
  waitMinutes: 10,
  mapsUrl: 'https://www.google.com/maps/search/?api=1&query=The+Waterfront+Venice+CA',
};

export const missionStatement =
  'A nurturing communal space with intentionality towards quality, that stays true to Mexican culture through visual beauty, while being of service to the community so that all customers feel valued and at home.';
