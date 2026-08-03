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
      return Response.json({ suggestions: [] }, { status: 502 });
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
    return Response.json({ suggestions: [] }, { status: 502 });
  }
}
