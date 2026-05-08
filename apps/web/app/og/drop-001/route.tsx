import { ImageResponse } from 'next/og'

export const runtime = 'edge'

const WIDTH = 1200
const HEIGHT = 630

const BG = '#f7f4ee'
const INK = '#171717'
const INK_MUTED = '#737373'
const BRAND = '#8b1a1a'
const ACCENT = '#ece0d0'

async function loadAnton() {
  const css = await fetch('https://fonts.googleapis.com/css2?family=Anton').then((res) =>
    res.text()
  )
  const match = css.match(/src:\s*url\((.+?)\)\s*format\('(opentype|truetype)'\)/)
  if (!match) throw new Error('Anton font URL not found')
  return fetch(match[1]).then((res) => res.arrayBuffer())
}

export async function GET() {
  let antonRegular: ArrayBuffer | null = null
  try {
    antonRegular = await loadAnton()
  } catch {
    antonRegular = null
  }

  const fontStack = antonRegular ? 'Anton, Arial Narrow, sans-serif' : 'Arial Narrow, sans-serif'

  return new ImageResponse(
    (
      <div
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          padding: '64px 72px',
          background: BG,
          color: INK,
          position: 'relative',
        }}
      >
        <div
          style={{
            position: 'absolute',
            right: -120,
            top: -120,
            width: 360,
            height: 360,
            borderRadius: '50%',
            background: ACCENT,
            opacity: 0.7,
          }}
        />

        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              background: BRAND,
              color: 'white',
              padding: '10px 20px',
              borderRadius: 999,
              fontSize: 18,
              fontWeight: 800,
              letterSpacing: 4,
              textTransform: 'uppercase',
            }}
          >
            <span
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: 'white',
              }}
            />
            IITR FIRST · MAY 13
          </div>
          <div
            style={{
              fontSize: 16,
              letterSpacing: 6,
              textTransform: 'uppercase',
              color: INK_MUTED,
              fontWeight: 700,
            }}
          >
            ROORQ
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <div
            style={{
              fontFamily: fontStack,
              fontSize: 220,
              lineHeight: 0.85,
              letterSpacing: -8,
              color: INK,
            }}
          >
            DROP 001
          </div>
          <div
            style={{
              fontFamily: fontStack,
              fontSize: 76,
              lineHeight: 0.95,
              letterSpacing: -2,
              color: BRAND,
              display: 'flex',
              flexDirection: 'column',
            }}
          >
            <span>PIECES YOUR BATCHMATES</span>
            <span>WON&apos;T HAVE.</span>
          </div>
        </div>

        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'flex-end',
            paddingTop: 24,
            borderTop: `2px solid ${INK}`,
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 4,
            }}
          >
            <div
              style={{
                fontSize: 18,
                letterSpacing: 4,
                textTransform: 'uppercase',
                color: INK_MUTED,
                fontWeight: 700,
              }}
            >
              Tuesday · 8 PM IST
            </div>
            <div
              style={{
                fontSize: 28,
                fontWeight: 800,
                color: INK,
                letterSpacing: -0.5,
              }}
            >
              ~30 hand-picked pieces · IIT Roorkee
            </div>
          </div>
          <div
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: BRAND,
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            roorq.com/drop-001
          </div>
        </div>
      </div>
    ),
    {
      width: WIDTH,
      height: HEIGHT,
      fonts: antonRegular
        ? [{ name: 'Anton', data: antonRegular, style: 'normal', weight: 400 }]
        : undefined,
      headers: {
        'Cache-Control': 'public, max-age=3600, s-maxage=86400, stale-while-revalidate=604800',
      },
    }
  )
}
