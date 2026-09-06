import { ImageResponse } from 'next/og';

export const runtime = 'nodejs';
export const alt = 'AshWatch — Volcanic Ash Map for Indonesia';
export const size = {
  width: 1200,
  height: 630,
};
export const contentType = 'image/png';

export default async function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: 'radial-gradient(circle at top right, #1F293D 0%, #0B0F17 65%, #070A0F 100%)',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          padding: '80px',
          fontFamily: 'sans-serif',
          color: '#ffffff',
          position: 'relative',
        }}
      >
        {/* Decorative warm orange volcanic glow */}
        <div
          style={{
            position: 'absolute',
            top: '-120px',
            right: '-120px',
            width: '600px',
            height: '600px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255, 107, 26, 0.22) 0%, rgba(11, 15, 23, 0) 70%)',
          }}
        />

        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #FF6B1A, #FF8A3D)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              boxShadow: '0 8px 24px rgba(255, 107, 26, 0.35)',
            }}
          >
            🌋
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '42px', fontWeight: 900, letterSpacing: '-1px' }}>
              ASH<span style={{ color: '#FF6B1A' }}>WATCH</span>
            </span>
            <span style={{ fontSize: '16px', color: '#8B95A7', letterSpacing: '2.5px', textTransform: 'uppercase', fontWeight: 600 }}>
              Volcanic Ash Map • Indonesia
            </span>
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '960px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: '#FF8A3D',
              fontSize: '18px',
              fontWeight: 700,
              textTransform: 'uppercase',
              letterSpacing: '1px',
            }}
          >
            ● Check Volcanic Ash Near You
          </div>
          <h1
            style={{
              fontSize: '60px',
              fontWeight: 900,
              lineHeight: 1.1,
              letterSpacing: '-2px',
              margin: 0,
              color: '#F5F7FA',
            }}
          >
            Volcanic Ash Map Indonesia
          </h1>
          <p style={{ fontSize: '24px', color: '#8B95A7', lineHeight: 1.4, margin: 0 }}>
            See where volcanic ash is spreading across Indonesia and check whether your location is inside an active or forecast ash zone.
          </p>
        </div>

        {/* Feature Badges */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div
            style={{
              padding: '12px 24px',
              borderRadius: '9999px',
              background: 'rgba(255, 107, 26, 0.15)',
              border: '1px solid rgba(255, 107, 26, 0.4)',
              color: '#FF8A3D',
              fontSize: '18px',
              fontWeight: 700,
            }}
          >
            Check My Area (GPS & Search)
          </div>
          <div
            style={{
              padding: '12px 24px',
              borderRadius: '9999px',
              background: 'rgba(255, 255, 255, 0.05)',
              border: '1px solid rgba(255, 255, 255, 0.12)',
              color: '#F5F7FA',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            OpenStreetMap Engine
          </div>
          <div
            style={{
              padding: '12px 24px',
              borderRadius: '9999px',
              background: 'rgba(16, 185, 129, 0.15)',
              border: '1px solid rgba(16, 185, 129, 0.35)',
              color: '#34D399',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            Observed & Forecast (+6h/+12h/+18h)
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
