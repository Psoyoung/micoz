// MICOZ — Auth (Login / Signup) + Cart Page (full page version)
const { useState: useStateF } = React;

// ─── 공통 Auth 레이아웃 (가운데 폼 단일 컬럼) ────────
function AuthShell({ children }) {
  return (
    <>
      <main style={{
        background: '#ffffff',
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        padding: '64px 24px 160px'
      }}>
        <div style={{ width: '100%', maxWidth: 420 }}>
          {children}
        </div>
      </main>
      <DesktopFooter />
    </>);

}

// ─── LOGIN ─────────────────────────────────────────────
function LoginPage({ onNav }) {
  const [keep, setKeep] = useStateF(true);
  return (
    <AuthShell title="문 앞에서" subtitle="WELCOME BACK">
      <div style={{
        fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em',
        color: 'var(--plum-500)', marginBottom: 14
      }}>SIGN IN</div>
      <h2 style={{
        fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 40,
        margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em'
      }}>로그인</h2>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 14, lineHeight: 1.7 }}>
        아직 회원이 아니신가요?{' '}
        <button onClick={() => onNav('signup')} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          color: 'var(--plum-700)', textDecoration: 'underline', textUnderlineOffset: 3,
          fontFamily: 'inherit', fontSize: 'inherit'
        }}>회원가입</button>
      </p>

      <form style={{ marginTop: 40 }} onSubmit={(e) => {e.preventDefault();onNav('home');}}>
        <FieldRow label="이메일" placeholder="name@email.com" />
        <FieldRow label="비밀번호" type="password" placeholder="••••••••" />

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 8, marginBottom: 28 }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', fontSize: 13, color: 'var(--ink)' }}>
            <span style={{
              width: 16, height: 16,
              background: keep ? 'var(--plum-700)' : 'transparent',
              border: `1.5px solid ${keep ? 'var(--plum-700)' : 'var(--line-strong)'}`,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }} onClick={() => setKeep(!keep)}>
              {keep && Icon.check(11, 'var(--cream)')}
            </span>
            로그인 유지
          </label>
          <button type="button" onClick={() => onNav('findidpw')} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            fontSize: 13, color: 'var(--muted)',
            textDecoration: 'underline', textUnderlineOffset: 3
          }}>아이디 / 비밀번호 찾기</button>
        </div>

        <PrimaryBtn full size="lg">로그인</PrimaryBtn>
      </form>
    </AuthShell>);

}

// ─── ID / PW 찾기 페이지 ──────────────────────────────
function FindIdPwPage({ onNav }) {
  const [tab, setTab] = useStateF('id'); // id | pw
  const [method, setMethod] = useStateF('email'); // email | phone | phoneAuth

  return (
    <AuthShell>
      <div style={{ marginBottom: 36, textAlign: "left" }}>
        <div style={{
          fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em',
          color: 'var(--plum-500)', marginBottom: 14
        }}>FIND ID · PASSWORD</div>
        <h1 style={{
          fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 36,
          margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em'
        }}>아이디 · 비밀번호 찾기</h1>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'grid', gridTemplateColumns: '1fr 1fr',
        borderBottom: '1px solid var(--line)',
        marginBottom: 32
      }}>
        {[
        ['id', '아이디 찾기'],
        ['pw', '비밀번호 찾기']].
        map(([k, l]) => {
          const active = tab === k;
          return (
            <button key={k} onClick={() => setTab(k)} style={{
              padding: '14px 0',
              background: 'transparent',
              border: 'none',
              borderBottom: `2px solid ${active ? 'var(--plum-700)' : 'transparent'}`,
              marginBottom: -1,
              cursor: 'pointer',
              fontFamily: 'var(--sans)',
              fontSize: 13.5, fontWeight: active ? 500 : 400,
              letterSpacing: '0.04em',
              color: active ? 'var(--plum-700)' : 'var(--muted)'
            }}>{l}</button>);

        })}
      </div>

      <form onSubmit={(e) => {e.preventDefault();onNav('login');}}>
        {/* 인증방법 */}
        <div style={{ marginBottom: 28 }}>
          <div style={{
            fontFamily: 'var(--serif-en)', fontSize: 10,
            letterSpacing: '0.25em', color: 'var(--muted)',
            marginBottom: 12, textTransform: 'uppercase'
          }}>인증방법</div>
          <div style={{ display: 'flex', gap: 22, flexWrap: 'wrap' }}>
            {[
            ['email', '이메일'],
            ['phone', '휴대폰번호'],
            ['phoneAuth', '휴대폰인증']].
            map(([k, l]) => {
              const sel = method === k;
              return (
                <label key={k} onClick={() => setMethod(k)} style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  cursor: 'pointer', fontSize: 13.5, color: 'var(--ink)'
                }}>
                  <span style={{
                    width: 18, height: 18, borderRadius: '50%',
                    border: `1.5px solid ${sel ? 'var(--plum-700)' : 'var(--line-strong)'}`,
                    background: '#ffffff',
                    display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0
                  }}>
                    {sel && <span style={{
                      width: 9, height: 9, borderRadius: '50%', background: 'var(--plum-700)'
                    }} />}
                  </span>
                  {l}
                </label>);

            })}
          </div>
        </div>

        {/* Fields — bordered bottom inputs to match brand */}
        <FindFieldRow
          label={tab === 'id' ? '이름' : '아이디'}
          placeholder={tab === 'id' ? '홍길동' : 'name@email.com'} />
        
        {method === 'email' &&
        <FindFieldRow label="이메일" placeholder="name@email.com" type="email" />
        }
        {(method === 'phone' || method === 'phoneAuth') &&
        <FindFieldRow label="휴대폰번호" placeholder="010-0000-0000" type="tel" />
        }

        <div style={{ marginTop: 28 }}>
          <PrimaryBtn full size="lg">확인</PrimaryBtn>
        </div>

        <p style={{
          marginTop: 28, padding: '0 4px',
          fontSize: 12, color: 'var(--muted)',
          lineHeight: 1.75, textAlign: 'center',
          display: 'flex', alignItems: 'flex-start', gap: 6, justifyContent: 'center'
        }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
            width: 14, height: 14, borderRadius: '50%',
            border: '1px solid var(--muted)', fontSize: 9,
            color: 'var(--muted)', flexShrink: 0, marginTop: 2,
            fontFamily: 'var(--serif-en)'
          }}>i</span>
          <span>
            SNS 계정으로 가입 후 별도의 휴대폰 인증을 하지 않은 경우<br />
            [휴대폰인증]으로 진행 시 아이디가 노출되지 않을 수 있습니다.
          </span>
        </p>

        <div style={{
          marginTop: 28, textAlign: 'center', fontSize: 13
        }}>
          <button type="button" onClick={() => onNav('login')} style={{
            background: 'transparent', border: 'none', cursor: 'pointer',
            color: 'var(--muted)', fontSize: 13,
            textDecoration: 'underline', textUnderlineOffset: 3
          }}>로그인으로 돌아가기</button>
        </div>
      </form>
    </AuthShell>);

}

function FindFieldRow({ label, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block', fontFamily: 'var(--serif-en)', fontSize: 10,
        color: 'var(--muted)', letterSpacing: '0.25em',
        marginBottom: 8, textTransform: 'uppercase'
      }}>{label}</label>
      <input
        type={type}
        placeholder={placeholder}
        style={{
          width: '100%', padding: '14px 0',
          background: 'transparent', border: 'none',
          borderBottom: '1px solid var(--line-strong)',
          fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)',
          outline: 'none', borderRadius: 0
        }}
        onFocus={(e) => e.target.style.borderColor = 'var(--plum-700)'}
        onBlur={(e) => e.target.style.borderColor = 'var(--line-strong)'} />
      
    </div>);

}

// ─── SIGNUP ────────────────────────────────────────────
function SignupPage({ onNav }) {
  const [agree, setAgree] = useStateF({ all: false, terms: false, privacy: false, marketing: false });
  const toggleAll = () => {
    const v = !agree.all;
    setAgree({ all: v, terms: v, privacy: v, marketing: v });
  };
  const toggle = (k) => {
    const next = { ...agree, [k]: !agree[k] };
    next.all = next.terms && next.privacy && next.marketing;
    setAgree(next);
  };

  return (
    <AuthShell title="첫 인사" subtitle="JOIN MICOZ">
      <div style={{
        fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.4em',
        color: 'var(--plum-500)', marginBottom: 14
      }}>CREATE ACCOUNT</div>
      <h2 style={{
        fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 40,
        margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em'
      }}>회원가입</h2>
      <p style={{ fontSize: 14, color: 'var(--muted)', marginTop: 14, lineHeight: 1.7 }}>
        이미 회원이신가요?{' '}
        <button onClick={() => onNav('login')} style={{
          background: 'transparent', border: 'none', cursor: 'pointer', padding: 0,
          color: 'var(--plum-700)', textDecoration: 'underline', textUnderlineOffset: 3,
          fontFamily: 'inherit', fontSize: 'inherit'
        }}>로그인</button>
      </p>

      <form style={{ marginTop: 36 }} onSubmit={(e) => {e.preventDefault();onNav('home');}}>
        <FieldRow label="이름" placeholder="홍길동" />
        <FieldRow label="이메일" placeholder="name@email.com" />
        <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'end' }}>
          <FieldRow label="휴대폰 번호" placeholder="010-0000-0000" />
          <button type="button" style={{
            padding: '14px 18px', background: 'transparent',
            border: '1px solid var(--plum-700)', color: 'var(--plum-700)',
            cursor: 'pointer', fontSize: 12, letterSpacing: '0.18em', whiteSpace: 'nowrap',
            marginBottom: 20, height: 46
          }}>인증번호 전송</button>
        </div>
        <FieldRow label="비밀번호" type="password" placeholder="영문 + 숫자 8자 이상" />
        <FieldRow label="비밀번호 확인" type="password" placeholder="••••••••" />

        {/* 약관 */}
        <div style={{
          marginTop: 12, padding: 20, background: 'var(--paper)',
          border: '1px solid var(--line)'
        }}>
          <CheckRow checked={agree.all} onClick={toggleAll} bold>전체 동의</CheckRow>
          <div style={{ height: 1, background: 'var(--line)', margin: '12px 0' }} />
          <CheckRow checked={agree.terms} onClick={() => toggle('terms')}>이용약관 동의 (필수)</CheckRow>
          <CheckRow checked={agree.privacy} onClick={() => toggle('privacy')}>개인정보 수집 및 이용 동의 (필수)</CheckRow>
          <CheckRow checked={agree.marketing} onClick={() => toggle('marketing')}>마케팅 수신 동의 (선택)</CheckRow>
        </div>

        <div style={{ marginTop: 32 }}>
          <PrimaryBtn full size="lg">가입 완료</PrimaryBtn>
        </div>
      </form>
    </AuthShell>);

}

function FieldRow({ label, placeholder, type = 'text' }) {
  return (
    <div style={{ marginBottom: 20 }}>
      <label style={{
        display: 'block', fontFamily: 'var(--serif-en)', fontSize: 10, color: 'var(--muted)',
        letterSpacing: '0.25em', marginBottom: 8, textTransform: 'uppercase'
      }}>{label}</label>
      <input type={type} placeholder={placeholder} style={{
        width: '100%', padding: '14px 0',
        background: 'transparent', border: 'none',
        borderBottom: '1px solid var(--line-strong)',
        fontFamily: 'var(--sans)', fontSize: 15, color: 'var(--ink)',
        outline: 'none', borderRadius: 0
      }} onFocus={(e) => e.target.style.borderColor = 'var(--plum-700)'}
      onBlur={(e) => e.target.style.borderColor = 'var(--line-strong)'} />
    </div>);

}

function CheckRow({ children, checked, onClick, bold }) {
  return (
    <label onClick={onClick} style={{
      display: 'flex', alignItems: 'center', gap: 12, padding: '8px 0',
      cursor: 'pointer', fontSize: bold ? 14 : 13,
      color: 'var(--ink)', fontWeight: bold ? 500 : 400
    }}>
      <span style={{
        width: 18, height: 18,
        background: checked ? 'var(--plum-700)' : 'transparent',
        border: `1.5px solid ${checked ? 'var(--plum-700)' : 'var(--line-strong)'}`,
        display: 'flex', alignItems: 'center', justifyContent: 'center'
      }}>
        {checked && Icon.check(12, 'var(--cream)')}
      </span>
      {children}
    </label>);

}

// ─── CART PAGE (full page, not drawer) ──────────────────
function CartPage({ cart, onUpdateQty, onRemove, onCheckout, onNav }) {
  const { won, PRODUCTS } = window.MICOZ_DATA;
  const sub = cart.reduce((s, i) => s + i.opt.price * i.qty, 0);
  const ship = sub === 0 ? 0 : sub >= 50000 ? 0 : 3000;
  const total = sub + ship;
  const recommended = PRODUCTS.filter((p) => !cart.some((c) => c.product.id === p.id)).slice(0, 4);

  return (
    <main style={{ background: 'var(--cream)', minHeight: '100vh' }}>
      <section style={{
        padding: '60px 56px 40px'
      }}>
        <div style={{ maxWidth: 1280, margin: '0 auto' }}>
          <h1 style={{
            fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 36,
            margin: 0, color: 'var(--plum-800)', letterSpacing: '-0.01em'
          }}>장바구니</h1>
          <p style={{ marginTop: 16, fontSize: 14, color: 'var(--muted)' }}>
            총 {cart.length}개의 제품 · 5만원 이상 구매 시 무료 배송
          </p>
        </div>
      </section>

      <section style={{ padding: '40px 56px 120px' }}>
        <div style={{
          maxWidth: 1280, margin: '0 auto',
          display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 64
        }}>
          {/* Cart items */}
          <div>
            {cart.length === 0 ?
            <div style={{
              padding: '120px 40px', textAlign: 'center',
              background: '#ffffff', border: '1px solid var(--line)'
            }}>
                <div style={{ marginBottom: 24, opacity: 0.4 }}>{Icon.bag(40, 'var(--muted)')}</div>
                <h3 style={{
                fontFamily: 'var(--serif)', fontWeight: 300, fontSize: 26,
                margin: 0, color: 'var(--plum-800)'
              }}>장바구니가 비어 있어요.</h3>
                <div style={{ height: 32 }} />
                <PrimaryBtn onClick={() => onNav('products')}>제품 둘러보기 →</PrimaryBtn>
              </div> :

            <>
                {/* table header */}
                <div style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 140px 130px 60px',
                gap: 24, padding: '16px 0',
                borderBottom: '1px solid var(--line-strong)',
                fontFamily: 'var(--serif-en)', fontSize: 11, color: 'var(--muted)', letterSpacing: '0.2em'
              }}>
                  <span>PRODUCT</span>
                  <span></span>
                  <span style={{ textAlign: 'center' }}>QTY</span>
                  <span style={{ textAlign: 'right' }}>SUBTOTAL</span>
                  <span></span>
                </div>

                {cart.map((it) =>
              <div key={it.cartId} style={{
                display: 'grid', gridTemplateColumns: '120px 1fr 140px 130px 60px',
                gap: 24, alignItems: 'center',
                padding: '28px 0', borderBottom: '1px solid var(--line)'
              }}>
                    <div style={{ width: 120, height: 150, background: it.product.grad, cursor: 'pointer' }}
                onClick={() => onNav('detail', it.product)} />
                    <div>
                      <div style={{
                    fontFamily: 'var(--serif-en)', fontSize: 10, letterSpacing: '0.3em',
                    color: 'var(--muted)', marginBottom: 6
                  }}>{it.product.line.toUpperCase()}</div>
                      <div style={{
                    fontFamily: 'var(--serif)', fontSize: 19, fontWeight: 400,
                    color: 'var(--plum-800)', cursor: 'pointer'
                  }} onClick={() => onNav('detail', it.product)}>{it.product.name}</div>
                      <div style={{ fontSize: 12, color: 'var(--muted)', marginTop: 6 }}>{it.opt.label} · {won(it.opt.price)}</div>
                      <button style={{
                    marginTop: 12, background: 'transparent', border: 'none',
                    cursor: 'pointer', fontSize: 12, color: 'var(--muted)',
                    padding: 0, display: 'flex', alignItems: 'center', gap: 6
                  }}>
                        {Icon.heart(12)} 찜하기
                      </button>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      <Counter value={it.qty} onChange={(v) => onUpdateQty(it.cartId, v)} />
                    </div>
                    <div style={{ textAlign: 'right', fontFamily: 'var(--serif-en)', fontSize: 18, color: 'var(--plum-800)' }}>
                      {won(it.opt.price * it.qty)}
                    </div>
                    <button onClick={() => onRemove(it.cartId)} style={{
                  background: 'transparent', border: 'none', cursor: 'pointer',
                  color: 'var(--muted)', padding: 8, justifySelf: 'end'
                }}>{Icon.close(16)}</button>
                  </div>
              )}

                <div style={{ marginTop: 28, display: 'flex', justifyContent: 'flex-start', alignItems: 'center' }}>
                  <ThinLink onClick={() => onNav('products')}>← 쇼핑 계속하기</ThinLink>
                </div>
              </>
            }

            {/* Recommendations — removed */}
          </div>

          {/* Summary */}
          <aside style={{
            position: 'sticky', top: 100, alignSelf: 'start',
            background: '#352a50', color: 'var(--cream)', padding: 40
          }}>
            <div style={{
              fontFamily: 'var(--serif-en)', fontSize: 11, letterSpacing: '0.3em',
              opacity: 0.6, marginBottom: 24
            }}>ORDER SUMMARY</div>

            {/* Free shipping progress */}
            {sub > 0 && sub < 50000 &&
            <div style={{ marginBottom: 24 }}>
                <div style={{ fontSize: 13, opacity: 0.85, marginBottom: 12 }}>
                  무료 배송까지 <span style={{ fontFamily: 'var(--serif-en)', color: 'var(--plum-200)' }}>{won(50000 - sub)}</span> 남음
                </div>
                <div style={{ height: 2, background: 'rgba(245,241,234,0.18)' }}>
                  <div style={{ width: `${Math.min(100, sub / 50000 * 100)}%`, height: '100%', background: 'var(--plum-200)', transition: 'width .4s' }} />
                </div>
              </div>
            }
            {sub >= 50000 &&
            <div style={{
              padding: '12px 14px', background: 'rgba(196, 176, 216, 0.12)',
              border: '1px solid rgba(196, 176, 216, 0.25)',
              fontSize: 12, marginBottom: 24, display: 'flex', alignItems: 'center', gap: 8
            }}>
                <span style={{ color: 'var(--plum-200)' }}>{Icon.check(12, 'var(--plum-200)')}</span>
                무료 배송이 적용되었어요.
              </div>
            }

            <div style={{ display: 'flex', flexDirection: 'column', gap: 12, fontSize: 14 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>소계</span>
                <span style={{ fontFamily: 'var(--serif-en)' }}>{won(sub)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>배송비</span>
                <span style={{ fontFamily: 'var(--serif-en)' }}>{ship === 0 ? '— ' : won(ship)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ opacity: 0.7 }}>적립 예정</span>
                <span style={{ fontFamily: 'var(--serif-en)', color: 'var(--plum-200)' }}>+ {won(Math.floor(sub * 0.05))}</span>
              </div>
            </div>

            {/* Coupon — removed */}

            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'baseline',
              padding: '24px 0', marginTop: 24, borderTop: '1px solid rgba(245,241,234,0.18)'
            }}>
              <span style={{ fontFamily: 'var(--serif)', fontSize: 18 }}>최종 결제</span>
              <span style={{ fontFamily: 'var(--serif-en)', fontSize: 28 }}>{won(total)}</span>
            </div>

            <PrimaryBtn full size="lg" dark={false} onClick={onCheckout} style={{
              background: 'var(--cream)', color: 'var(--plum-900)', border: 'none'
            }}>{cart.length === 0 ? '장바구니 비어있음' : '결제하기'}</PrimaryBtn>

            <div style={{ marginTop: 24, fontSize: 11, opacity: 0.5, lineHeight: 1.7, letterSpacing: '0.05em' }}>
              · VISA · Mastercard · 카카오페이 · 네이버페이<br />
              · 모든 결제는 SSL 암호화로 안전하게 보호됩니다.
            </div>
          </aside>
        </div>
      </section>
      <DesktopFooter />
    </main>);

}

Object.assign(window, { LoginPage, SignupPage, FindIdPwPage, CartPage });