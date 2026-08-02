import { ImageResponse } from 'next/og';

export const runtime = 'edge';

export function GET() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: 'column',
          background: '#961010',
          color: '#ffffff',
          border: '22px solid #d9d9d9',
          fontFamily: 'serif',
        }}
      >
        <span style={{ fontSize: 104, fontFamily: 'sans-serif', fontWeight: 900, letterSpacing: 18 }}>
          DAME
        </span>
        <span style={{ marginTop: 4, fontSize: 92, letterSpacing: 3 }}>COFFEE</span>
        <span style={{ marginTop: 18, fontSize: 24, fontFamily: 'sans-serif', fontWeight: 700, letterSpacing: 12 }}>
          DAME VIDA
        </span>
      </div>
    ),
    { width: 512, height: 512 },
  );
}
