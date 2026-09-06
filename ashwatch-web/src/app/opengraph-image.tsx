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
          background: 'linear-gradient(135deg, #090d16 0%, #151b2b 60%, #2a1215 100%)',
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
        {/* Decorative background glow */}
        <div
          style={{
            position: 'absolute',
            top: '-100px',
            right: '-100px',
            width: '500px',
            height: '500px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(239, 68, 68, 0.25) 0%, rgba(0, 0, 0, 0) 70%)',
          }}
        />

        {/* Brand header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '16px',
              background: 'linear-gradient(135deg, #ef4444, #f97316)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
            }}
          >
            🌋
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontSize: '40px', fontWeight: 900, letterSpacing: '-1px' }}>
              Ash<span style={{ color: '#ef4444' }}>Watch</span>
            </span>
            <span style={{ fontSize: '18px', color: '#94a3b8', letterSpacing: '2px', textTransform: 'uppercase' }}>
              Darwin VAAC Monitor
            </span>
          </div>
        </div>

        {/* Main Title & Subtitle */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxWidth: '900px' }}>
          <h1
            style={{
              fontSize: '56px',
              fontWeight: 800,
              lineHeight: 1.15,
              letterSpacing: '-1.5px',
              margin: 0,
              color: '#f8fafc',
            }}
          >
            Real-Time Volcanic Ash Map for Indonesia
          </h1>
          <p style={{ fontSize: '24px', color: '#cbd5e1', lineHeight: 1.4, margin: 0 }}>
            Interactive aviation flight levels, ash cloud dispersion boundaries, and multi-volcano advisory tracking.
          </p>
        </div>

        {/* Feature Badges */}
        <div style={{ display: 'flex', gap: '16px' }}>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              background: 'rgba(239, 68, 68, 0.15)',
              border: '1px solid rgba(239, 68, 68, 0.4)',
              color: '#fca5a5',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            ● Live Darwin VAAC Ingestion
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              background: 'rgba(249, 115, 22, 0.15)',
              border: '1px solid rgba(249, 115, 22, 0.4)',
              color: '#fdba74',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            Multi-Altitude Layers (FL)
          </div>
          <div
            style={{
              padding: '10px 20px',
              borderRadius: '9999px',
              background: 'rgba(56, 189, 248, 0.15)',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              color: '#7dd3fc',
              fontSize: '18px',
              fontWeight: 600,
            }}
          >
            OpenStreetMap
          </div>
        </div>
      </div>
    ),
    {
      ...size,
    }
  );
}
