// 데스크탑 푸터 — 출처: 원본 shop/screens-desktop.jsx DesktopFooter
import MicozLogo from './MicozLogo'

const LINK_ROW = ['이용약관', '개인정보처리방침', '이메일무단수집거부', 'FAQ', '1:1문의']

const Dot = () => (
  <span
    style={{
      display: 'inline-block',
      width: 1,
      height: 11,
      background: 'rgba(245,237,247,0.22)',
      margin: '0 14px',
      verticalAlign: 'middle',
    }}
  />
)

export default function DesktopFooter() {
  return (
    <footer style={{ background: '#352a50', color: 'var(--plum-100)', padding: '80px 56px 48px', height: '377px' }}>
      <div style={{ maxWidth: 1440, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 40, flexWrap: 'wrap' }}>
          {/* 좌측: 로고 + 정보 */}
          <div style={{ flex: 1, minWidth: 480 }}>
            <MicozLogo size={28} color="var(--cream)" />

            {/* 링크 행 */}
            <div
              style={{
                marginTop: 32,
                marginBottom: 28,
                fontSize: 13,
                color: 'var(--cream)',
                display: 'flex',
                flexWrap: 'wrap',
                alignItems: 'center',
                columnGap: 28,
                rowGap: 8,
                letterSpacing: '0.01em',
                opacity: 0.92,
              }}
            >
              {LINK_ROW.map((l, i) => (
                <a key={i} href="#" style={{ color: 'inherit', textDecoration: 'none', fontFamily: 'var(--sans)' }}>
                  {l}
                </a>
              ))}
            </div>

            {/* 회사 정보 */}
            <div
              style={{
                fontSize: 12.5,
                color: 'var(--plum-200)',
                lineHeight: 2,
                fontFamily: 'var(--sans)',
                letterSpacing: '-0.005em',
                opacity: 0.85,
              }}
            >
              <div>
                미코즈(주)
                <Dot />
                대표 : 강수아
                <Dot />
                대표전화 : 1551-3301
              </div>
              <div>
                본사 : 경기 화성시 동탄기흥로 614 더퍼스트타워2차 715 (영천동)
                <Dot />
                영업본부 : 서울시 송파구 올림픽로 342 아울타워 6층
              </div>
              <div>
                사업자등록번호 : 570-87-01756
                <Dot />
                통신판매업신고번호 : 제 2020-화성동탄-0970호
              </div>
              <div>정보책임자 E-mail : micoz123@naver.com</div>
            </div>

            <div
              style={{
                marginTop: 32,
                fontSize: 11.5,
                color: 'var(--plum-200)',
                opacity: 0.55,
                letterSpacing: '0.04em',
                fontFamily: 'var(--sans)',
              }}
            >
              Copyright © MICOZ. All Rights Reserved.
            </div>
          </div>

          {/* 우측: CS CENTER */}
          <div style={{ textAlign: 'right', minWidth: 200 }}>
            <div style={{ fontFamily: 'var(--serif-en)', fontSize: 13, letterSpacing: '0.4em', color: 'var(--cream)', opacity: 0.7, marginBottom: 14 }}>
              CS CENTER
            </div>
            <div style={{ fontFamily: 'var(--serif-en)', fontSize: 36, fontWeight: 500, color: 'var(--cream)', letterSpacing: '-0.01em', lineHeight: 1 }}>
              1551-3301
            </div>
            <div style={{ marginTop: 14, fontSize: 12, color: 'var(--plum-200)', opacity: 0.7, lineHeight: 1.7 }}>
              평일 10:00 — 17:00
              <br />
              점심 12:30 — 13:30
              <br />
              주말 · 공휴일 휴무
            </div>
          </div>
        </div>
      </div>
    </footer>
  )
}
