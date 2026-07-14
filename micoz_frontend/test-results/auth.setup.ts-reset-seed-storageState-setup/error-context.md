# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.setup.ts >> reset + seed + storageState
- Location: e2e\auth.setup.ts:11:1

# Error details

```
Error: [E2E] reset 거부: 비로컬 E2E_DB_HOST=remote.example.com. 로컬 DB에서만 허용된다.
```

# Test source

```ts
  1  | // 결정적 DB 리셋 — 사용자/트랜잭션 16테이블 비우기. 카탈로그 마스터·설정·참조는 보존.
  2  | // 가드: (1) PGHOST 가 로컬 + (2) E2E_ALLOW_RESET=1 동시 충족 시에만 실행(원격 DB 보호).
  3  | import '../env'
  4  | import { Client } from 'pg'
  5  | import { dbConfig, LOCAL_HOSTS } from './config'
  6  | 
  7  | /** reset 허용 여부 검증. 불충족 시 connect 전에 throw (파괴 차단). */
  8  | export function assertResetAllowed(): void {
  9  |   const host = dbConfig().host
  10 |   if (!LOCAL_HOSTS.has(host)) {
> 11 |     throw new Error(`[E2E] reset 거부: 비로컬 E2E_DB_HOST=${host}. 로컬 DB에서만 허용된다.`)
     |           ^ Error: [E2E] reset 거부: 비로컬 E2E_DB_HOST=remote.example.com. 로컬 DB에서만 허용된다.
  12 |   }
  13 |   if (process.env.E2E_ALLOW_RESET !== '1') {
  14 |     throw new Error('[E2E] reset 거부: E2E_ALLOW_RESET=1 플래그가 없다(.env.e2e 확인).')
  15 |   }
  16 | }
  17 | 
  18 | // 15테이블 TRUNCATE RESTART IDENTITY + 회원은 CUSTOMER 만 DELETE(admin 보존, 시퀀스 유지).
  19 | // 논리 FK 라 CASCADE 불필요. dat_refresh_token/dat_inquiry_reply 는 회원·문의 wipe 정합으로 포함.
  20 | const RESET_SQL = `
  21 | TRUNCATE TABLE
  22 |   mst_user_address, dat_refresh_token, dat_cart, map_product_fav,
  23 |   dat_order, dat_order_item, dat_order_shipping, dat_order_payment,
  24 |   dat_return, dat_return_item, map_user_coupon, his_point,
  25 |   dat_review, dat_inquiry, dat_inquiry_reply
  26 | RESTART IDENTITY;
  27 | DELETE FROM mst_user WHERE user_role = 'CUSTOMER';
  28 | `
  29 | 
  30 | /** 가드 통과 후 리셋 SQL 실행. 멱등(반복 실행 무결). */
  31 | export async function resetDb(): Promise<void> {
  32 |   assertResetAllowed()
  33 |   const client = new Client(dbConfig())
  34 |   await client.connect()
  35 |   try {
  36 |     await client.query(RESET_SQL)
  37 |   } finally {
  38 |     await client.end()
  39 |   }
  40 | }
  41 | 
```