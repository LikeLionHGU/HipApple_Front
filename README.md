<img width="1024" height="559" alt="hipapple" src="https://github.com/user-attachments/assets/3f2748a2-3de0-45cb-8a4a-e04a71d3d418" />

# HipApple

**저장고 상태와 시장 시세를 함께 분석해, 사과를 가장 잘 팔 수 있는 순간을 알려주는 서비스.**

> 🔗 **[hip-apple.vercel.app](https://hip-apple.vercel.app)**

<br />

## 왜 만들었나

경북은 전국 사과 생산의 큰 몫을 차지하지만, **출하 시점은 여전히 감각으로 정해집니다.**

- 사과를 직접 꺼내 먹어보며 후숙 상태를 확인하고, 개인의 경험으로 출하 여부를 판단합니다
- **한번 출하한 사과는 되돌릴 수 없어**, 기대보다 낮은 가격에도 팔 수밖에 없습니다
- 매년 비슷한 점검을 반복하지만 **다음 판단에 쓸 데이터는 남지 않습니다**

이 판단을 데이터로 옮기면 농가 한 곳당 연간 약 1,000만 원의 손실을 줄일 수 있습니다.

<br />

## 기능

### 🌡️ 저장고 현황 모니터링

온도 · 습도 · **에틸렌 가스 농도**를 한눈에 보고, 권장 기준을 벗어나면 알려줍니다. 에틸렌은 후숙을 앞당기는 기체라 저장 품질을 가르는 지표입니다.

### 📈 시세 예측

향후 **7일 도매 시세**를 예측합니다. 예측가와 실제가를 마이페이지에서 비교해 볼 수 있어, 예측이 맞았는지 이력이 쌓입니다.

### 🤖 출하 시점 추천

저장 상태와 시세 예측을 함께 분석해 **내일부터 7일 뒤까지 날짜별 분석 카드**를 만듭니다. 각 카드에는 예상 가격과 판단 근거가 붙고, 가장 유리한 날에 배지가 달립니다.

### 📷 사진으로 품질 진단

사과 사진을 올리면 등급(우수 · 불량)을 판정합니다. 사진 없이도 진행할 수 있습니다.

<br />

## 기술

`React` `TypeScript` `Vite` `React Router` `oxlint`

```bash
npm install
npm run dev       # 개발 서버
npm run build     # tsc 타입 검사 후 빌드
npm run lint      # oxlint
npm run preview   # 빌드 결과 미리보기
```

로그인은 구글 OAuth를 씁니다 (`/auth/callback`).

<br />

## 구조

```
src/pages/
├─ LandingPage           문제 제기부터 기능 소개까지
├─ LoginPage · SignupInfo · SignupComplete · AuthCallbackPage
├─ MarketPricePage       도매 시세와 예측
├─ Storage*              저장고 등록 · 수정 · 현황
├─ ShipmentAiPage        출하 시점 추천 (7일치 분석 카드)
├─ PhotoUploadPage       사과 사진 품질 진단
└─ MyPage                가격 예측 이력 (예측가 vs 실제가)
```

백엔드가 특정 날짜의 분석을 아직 내려주지 않아도 **카드 모양은 항상 7개를 유지**하고, 값이 빈 자리는 안내 문구로 채웁니다. 화면이 들쭉날쭉해 보이지 않게 하기 위해서입니다.

<br />

---

멋쟁이사자처럼 한동대학교 · 멋쟁이사과 팀
[백엔드 저장소](https://github.com/LikeLionHGU/HipApple_Backend)
