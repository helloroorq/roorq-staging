import { ImageResponse } from 'next/og'

export const runtime = 'edge'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const title = searchParams.get('title') ?? 'Roorq Weekly Drops'
  const subtitle = searchParams.get('subtitle') ?? 'IIT Roorkee Campus Exclusives'

  return new ImageResponse(
    (
      <div
        style={{
          width: '1200px',
          height: '630px',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '80px',
          background:
            'linear-gradient(135deg, rgba(12,12,12,1) 0%, rgba(30,30,30,1) 45%, rgba(120,0,0,1) 100%)',
          color: '#ffffff',
          fontFamily: 'Arial, Helvetica, sans-serif',
        }}
      >
        <div style={{ fontSize: 24, letterSpacing: 6, textTransform: 'uppercase', fontWeight: 700 }}>
          Roorq
        </div>
        <div style={{ fontSize: 72, fontWeight: 900, lineHeight: 1.1 }}>{title}</div>
        <div style={{ fontSize: 28, letterSpacing: 2, textTransform: 'uppercase', color: '#f5f5f5' }}>
          {subtitle}
        </div>
      </div>
    ),
    {
      width: 1200,
      height: 630,
    }
  )
}
