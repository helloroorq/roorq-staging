import { ImageResponse } from 'next/og'

export const runtime = 'edge'
export const alt = 'Roorq - Curated Vintage Drops'
export const size = {
  width: 1200,
  height: 630,
}
export const contentType = 'image/png'

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '72px',
          background: 'linear-gradient(135deg, #0f0f0f 0%, #242424 48%, #8f1111 100%)',
          color: '#ffffff',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 4, textTransform: 'uppercase', fontWeight: 700 }}>
          Roorq
        </div>
        <div style={{ fontSize: 70, fontWeight: 900, lineHeight: 1.08, maxWidth: '80%' }}>
          Vintage with a verified story.
        </div>
        <div style={{ fontSize: 28, letterSpacing: 2, textTransform: 'uppercase', color: '#f3f4f6' }}>
          Curated drops for India
        </div>
      </div>
    ),
    size
  )
}
