// 쇼핑몰 브랜드 스토리 — 출처: 원본 shop/screens-desktop2.jsx StoryPage/StoryFeature
// presentational. 이미지 경로만 '/image/..' 절대경로로(라우트 무관 로딩). 푸터는 ShopLayout 이 렌더.
import type { ReactNode } from 'react'
import { useIsMobile } from '../../lib/useIsMobile'
import MobileStory from './mobile/MobileStory'

// 뷰포트 분기 — 한쪽 트리만 렌더
export default function StoryPage() {
  const isMobile = useIsMobile()
  return isMobile ? <MobileStory /> : <DesktopStory />
}

function DesktopStory() {
  return (
    <main style={{ background: 'var(--cream)' }}>
      {/* About micoz intro */}
      <section style={{ padding: '120px 56px' }}>
        <div style={{ maxWidth: 1080, margin: '0 auto', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 100, alignItems: 'center' }}>
          {/* brand image */}
          <div
            style={{
              aspectRatio: '4 / 3',
              background: 'linear-gradient(135deg, #ece2d4 0%, #d8c9b3 50%, #e6d8c5 100%)',
              backgroundImage: 'url(/image/brand1.png)',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              position: 'relative',
            }}
          />

          <div>
            <div style={{ fontFamily: 'var(--serif-en)', fontSize: 12, letterSpacing: '0.32em', color: 'var(--plum-500)', marginBottom: 24, fontStyle: 'italic' }}>About micoz</div>
            <h2 style={{ fontFamily: 'var(--serif)', fontWeight: 400, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em', lineHeight: 1.4, height: '60px', width: '500px', fontSize: '28px' }}>
              미코즈(주)의 기술력으로
              <br />
              건강하고 아름다운 미래를 만들어 갑니다.
            </h2>
            <p style={{ marginTop: 32, fontFamily: 'var(--serif)', fontSize: 15.5, lineHeight: 2, color: 'var(--muted)', fontWeight: 300 }}>
              미코즈㈜는 헬스와 뷰티 디바이스, 화장품 전문회사로
              <br />
              인간의 노화에서는 세포와 피부의 재생을 효과적으로 해결해
              <br />
              최고 아름답게 만들어드리는 제조, 유통, 콘텐츠가 합쳐진
              <br />
              플랫폼 기반의 글로벌 회사입니다.
            </p>
          </div>
        </div>
      </section>

      {/* CEO greeting */}
      <section style={{ background: '#352a50', color: 'var(--cream)' }}>
        <div style={{ maxWidth: 1200, margin: '0 auto', display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: 80, alignItems: 'center' }}>
          <div>
            <h2 style={{ fontFamily: 'var(--serif-en)', fontWeight: 500, fontSize: 56, margin: 0, letterSpacing: '-0.01em', color: 'var(--cream)' }}>More Healthy Life</h2>
            <p style={{ marginTop: 36, fontFamily: 'var(--serif)', fontSize: 15, lineHeight: 2.1, color: 'rgba(245,237,247,0.78)', fontWeight: 300, maxWidth: 540 }}>
              안녕하세요 미코즈㈜ 김정희회장입니다.
              <br />
              항상 미코즈에 깊은 관심과 사랑으로 성원해 주시는 분들께 진심으로 감사드립니다.
              <br />
              <br />
              저희는 성장을 발판으로 책임감있는 경영과 윤리적인 경영을 실천하기 위해 항상 일정 서고 있으며, 뷰티 업계 26년의 경력과 경험으로 모두가 추구하는 가치를 이루어가기 위해 노력하고 있습니다.
              <br />
              <br />
              앞으로도 미코즈㈜에 지속적인 관심과 사랑 부탁드립니다. 감사합니다.
            </p>
            <div style={{ marginTop: 40 }}>
              <img src="/image/sign01.png" alt="미코즈㈜ 회장 김정희" style={{ display: 'block', height: 56, width: 'auto', filter: 'invert(1) brightness(1.1)' }} />
            </div>
          </div>
          {/* CEO portrait */}
          <img src="/image/brand2.png" alt="CEO" style={{ display: 'block', width: 360, height: 'auto', justifySelf: 'end', marginRight: -56, padding: 0, border: 'none' }} />
        </div>
      </section>

      {/* Philosophy & Vision band */}
      <section style={{ padding: '120px 56px', background: 'linear-gradient(180deg, #f8f3ec 0%, #ede5d8 50%, #f5edf7 100%)', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: 'radial-gradient(ellipse at 30% 50%, rgba(255,255,255,0.45), transparent 50%), radial-gradient(ellipse at 80% 60%, rgba(196,176,216,0.18), transparent 60%)',
            pointerEvents: 'none',
          }}
        />
        <div style={{ position: 'relative' }}>
          <h2 style={{ fontFamily: 'var(--serif-en)', fontWeight: 500, fontSize: 38, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.005em' }}>Company Philosophy &amp; Vision</h2>
          <p style={{ marginTop: 28, fontFamily: 'var(--serif)', fontSize: 15.5, lineHeight: 2.2, color: 'var(--muted)', fontWeight: 300 }}>
            미코즈는 성장을 발판으로 책임감있는 경영과
            <br />
            윤리적인 경영을 실천하기위해 경영이념을 세기며 실천해 나아가고있습니다.
            <br />
            앞으로도 최선을 <span style={{ color: 'var(--plum-700)' }}>다하는 기업</span>이 되겠습니다.
          </p>
        </div>
      </section>

      {/* Trusted Company */}
      <StoryFeature
        title={['Trusted Company', 'For Everyone']}
        body={['도덕성과 정직함을 바탕으로 연구개발을 진행해', '신뢰받는 기업으로 도약합니다.']}
        imageGrad="linear-gradient(155deg, #e8d8f0 0%, #c4b0d8 40%, #9a7fb8 80%, #6b4d8f 100%)"
        imageLabel="LAB · RESEARCH"
        imageSrc="/image/brand3.jpg"
        imageOnLeft={true}
      />

      {/* Flexible Development Workforce */}
      <StoryFeature
        title={['Flexible Development', 'Workforce']}
        body={['인재들의 잠재력을 이끌어내어 성장을 극대화하여', '사회발전에 기여합니다.']}
        imageGrad="linear-gradient(165deg, #f5f1ea 0%, #e8dfd2 35%, #d0c3b0 70%, #b09c80 100%)"
        imageLabel="CREAM · TEXTURE"
        imageSrc="/image/brand4.jpg"
        imageOnLeft={false}
      />

      {/* Fostering Workforce */}
      <StoryFeature
        title={['Fostering', 'Workforce']}
        body={['유연한 연구개발을 진행하여', '새로운 가치를 창출하고 시도합니다.']}
        imageGrad="linear-gradient(155deg, #f5e6c0 0%, #e8c878 35%, #c89a3c 70%, #8a6420 100%)"
        imageLabel="MOLECULES · GOLD"
        imageSrc="/image/brand5.png"
        imageOnLeft={true}
      />
    </main>
  )
}

type FeatureProps = {
  kicker?: ReactNode
  title: [string, string]
  body: [string, string]
  imageGrad: string
  imageLabel: string
  imageSrc?: string
  imageOnLeft: boolean
}

function StoryFeature({ kicker, title, body, imageGrad, imageLabel, imageSrc, imageOnLeft }: FeatureProps) {
  const imageBlock = (
    <div style={{ width: '100%', aspectRatio: '1', background: imageGrad, backgroundImage: imageSrc ? `url(${imageSrc})` : undefined, backgroundSize: 'cover', backgroundPosition: 'center', position: 'relative', overflow: 'hidden' }}>
      {!imageSrc && (
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.55)', fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.32em' }}>
          {imageLabel}
        </div>
      )}
    </div>
  )

  const textBlock = (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '60px 48px' }}>
      {kicker && <div style={{ fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em', color: 'var(--plum-500)', marginBottom: 18 }}>{kicker}</div>}
      <h3 style={{ fontFamily: 'var(--serif-en)', fontWeight: 500, fontSize: 36, margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.005em', lineHeight: 1.2 }}>
        {title[0]}
        <br />
        {title[1]}
      </h3>
      <p style={{ marginTop: 28, fontFamily: 'var(--serif)', fontSize: 14.5, lineHeight: 2, color: 'var(--muted)', fontWeight: 300 }}>
        {body[0]}
        <br />
        {body[1]}
      </p>
    </div>
  )

  return (
    <section style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', background: 'var(--cream)' }}>
      {imageOnLeft ? imageBlock : textBlock}
      {imageOnLeft ? textBlock : imageBlock}
    </section>
  )
}
