# EveryMCU 주간코황 기능

주간코황 기능을 구현한 React/Vite 프로젝트입니다.

## 시연 주소

https://every-mcu.web.app

## 핵심 기능 파일

- `WeeklyStatusFeature.jsx`

`WeeklyStatusFeature`는 React 컴포넌트이며 아래 두 props를 받습니다.

- `nickname`: 사용자 닉네임
- `onHome`: 홈 화면으로 돌아가는 함수

현재 `EveryMCU_App.jsx`에서 주간코황 메뉴에 연결해둔 상태입니다.

## 스타일/애니메이션 관련

- `src/index.css`

상단 메뉴 슬라이드, 콘텐츠 전환, 코드 입력창 확장 애니메이션 CSS가 포함되어 있습니다.

## 배포 관련

- `firebase.json`
- `.firebaserc`
- `package.json`의 `deploy:hosting` 스크립트

Firebase Hosting 배포 명령:

```bash
npm run deploy:hosting
```

## 로컬 실행

```bash
npm install
npm run dev
```

브라우저에서 표시되는 로컬 주소로 접속하면 됩니다.

## 병합 시 참고

팀 프로젝트에 합칠 때는 아래 파일을 우선 확인하면 됩니다.

- `WeeklyStatusFeature.jsx`
- `EveryMCU_App.jsx`의 주간코황 연결 부분
- `src/index.css`의 애니메이션 CSS
- Firebase Realtime Database/Hosting 설정 파일

