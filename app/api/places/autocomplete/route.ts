type GooglePlaceSuggestion = {
  placePrediction?: {
    placeId?: string;
    text?: { text?: string };
    structuredFormat?: {
      mainText?: { text?: string };
      secondaryText?: { text?: string };
    };
  };
};

type GoogleAutocompleteResponse = {
  suggestions?: GooglePlaceSuggestion[];
};

type GoogleLegacyAutocompleteResponse = {
  status?: string;
  predictions?: Array<{
    place_id?: string;
    description?: string;
    structured_formatting?: { main_text?: string; secondary_text?: string };
  }>;
};

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  const apiKey = process.env.GOOGLE_MAPS_API_KEY;
  const input = new URL(request.url).searchParams.get('input')?.trim() ?? '';

  if (input.length < 4 || input.length > 180) {
    return Response.json({ suggestions: [] });
  }
  if (!apiKey) {
    return Response.json({ suggestions: [], configured: false });
  }

  try {
    const response = await fetch('https://places.googleapis.com/v1/places:autocomplete', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        'X-Goog-FieldMask': [
          'suggestions.placePrediction.placeId',
          'suggestions.placePrediction.text.text',
          'suggestions.placePrediction.structuredFormat.mainText.text',
          'suggestions.placePrediction.structuredFormat.secondaryText.text',
        ].join(','),
      },
      body: JSON.stringify({
        input,
        includedRegionCodes: ['us'],
        languageCode: 'en',
        regionCode: 'us',
        locationBias: {
          rectangle: {
            low: { latitude: 32.3, longitude: -121.0 },
            high: { latitude: 36.2, longitude: -114.0 },
          },
        },
      }),
      cache: 'no-store',
    });

    if (!response.ok) {
      const upstreamMessage = (await response.text()).slice(0, 800);
      console.error('Google Places autocomplete request failed.', {
        status: response.status,
        upstreamMessage,
      });
      // Some existing Google Cloud keys have Places API (Legacy) enabled while
      // the new endpoint is still restricted. Support both during migration.
      const legacyUrl = new URL('https://maps.googleapis.com/maps/api/place/autocomplete/json');
      legacyUrl.searchParams.set('input', input);
      legacyUrl.searchParams.set('types', 'address');
      legacyUrl.searchParams.set('components', 'country:us');
      legacyUrl.searchParams.set('language', 'en');
      legacyUrl.searchParams.set('location', '34.05,-117.85');
      legacyUrl.searchParams.set('radius', '250000');
      legacyUrl.searchParams.set('key', apiKey);
      const legacyResponse = await fetch(legacyUrl, { cache: 'no-store' });
      const legacy = (await legacyResponse.json()) as GoogleLegacyAutocompleteResponse;
      if (legacyResponse.ok && legacy.status === 'OK') {
        const suggestions = (legacy.predictions ?? []).slice(0, 5).flatMap((prediction) => {
          const fullText = prediction.description?.trim() ?? '';
          const placeId = prediction.place_id?.trim() ?? '';
          if (!fullText || !placeId) return [];
          return [{ placeId, fullText, mainText: prediction.structured_formatting?.main_text?.trim() || fullText, secondaryText: prediction.structured_formatting?.secondary_text?.trim() || '' }];
        });
        return Response.json({ suggestions, configured: true }, { headers: { 'Cache-Control': 'private, max-age=30' } });
      }
      console.error('Google Places legacy fallback failed.', { status: legacyResponse.status, apiStatus: legacy.status });
      return Response.json({ suggestions: [], error: 'Google address suggestions are temporarily unavailable.' }, { status: 502 });
    }

    const payload = (await response.json()) as GoogleAutocompleteResponse;
    const suggestions = (payload.suggestions ?? [])
      .flatMap((suggestion) => {
        const prediction = suggestion.placePrediction;
        const fullText = prediction?.text?.text?.trim() ?? '';
        const placeId = prediction?.placeId?.trim() ?? '';
        if (!fullText || !placeId) return [];
        return [{
          placeId,
          fullText,
          mainText: prediction?.structuredFormat?.mainText?.text?.trim() || fullText,
          secondaryText: prediction?.structuredFormat?.secondaryText?.text?.trim() || '',
        }];
      })
      .slice(0, 5);

    return Response.json(
      { suggestions, configured: true },
      { headers: { 'Cache-Control': 'private, max-age=30' } },
    );
  } catch (error) {
    console.error('Google Places autocomplete could not be reached.', error);
    return Response.json(
      { suggestions: [], error: 'Google address suggestions are temporarily unavailable.' },
      { status: 502 },
    );
  }
}
