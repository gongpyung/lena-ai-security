# Deployment Guide

## clasp을 이용한 배포

### 로컬 → Apps Script 업로드

```bash
# 변경사항 업로드
clasp push

# 변경사항 다운로드 (원격에서 수정한 경우)
clasp pull
```

### 배포 버전 관리

```bash
# 현재 배포 목록 확인
clasp deployments

# 새 버전 배포
clasp deploy --description "v3.0 - Daily Digest 추가"

# 특정 버전 배포 해제
clasp undeploy <배포ID>
```

## 트리거 설정

### 자동 트리거 생성

`setupDailyTrigger()` 함수 실행 시 자동 생성:

| 함수 | 주기 | 시간 |
|------|------|------|
| `runDailySecurityDigest` | 매일 (평일만) | 08:00 KST |

### 수동 트리거 관리

```javascript
// 트리거 목록 조회
listTriggers()

// 모든 트리거 삭제
deleteTriggers()

// 트리거 재생성
setupDailyTrigger()
```

또는 Apps Script 편집기에서 **트리거(시계 아이콘)**를 통해 관리합니다.

## 환경 설정

### PropertiesService 관리 항목

| 속성 키 | 용도 | 설정 방법 |
|---------|------|----------|
| `GEMINI_API_KEY` | Gemini API 인증 | `setupApiKey()` |
| `HISTORY_SPREADSHEET_ID` | 이력 스프레드시트 | `runSetupWizard()` 자동 생성 |

### Config.js 설정 항목

| 변수 | 기본값 | 설명 |
|------|--------|------|
| `RECIPIENT_GROUPS.security` | `["lena@lgcns.com"]` | 보고서 수신자 |
| `ADMIN_EMAIL` | `junho.k@lgcns.com` | 관리자 알림 수신자 |
| `MODEL_NAME` | `gemini-3-flash-preview` | Gemini 모델명 |
| `MAX_THREADS` | `10` | Gmail 라벨당 최대 처리 스레드 수 |
| `MAX_BODY_LENGTH` | `10000` | 분석 대상 본문 최대 길이 |
| `API_CALL_DELAY` | `3000` | API 호출 간 대기 시간 (ms) |
| `MAX_RETRIES` | `3` | API 호출 최대 재시도 횟수 |
| `TLP_LEVEL` | `TLP:AMBER` | 보고서 TLP 등급 |

## 제품 추가

`Config.js`의 `PRODUCTS` 객체에 새 제품을 추가합니다:

```javascript
"new-product": {
  name: "Product Name",
  gmailLabel: "LENA-PRODUCT",
  filterKeywords: ["SECURITY", "CVE", "RELEASE"],
  versions: {
    "Product Name": "1.0.0"
  },
  downloadUrlPattern: "https://example.com/download",
  nvdSearchPrefix: "cpe:2.3:a:vendor:product"
}
```

추가 후 `createGmailLabels()`를 실행하여 Gmail 라벨을 생성하세요.

## 모니터링

### 실행 로그

- Apps Script 편집기 → **실행 > 실행 로그**
- Google Cloud Console → **Logging** (Stackdriver)

### 이력 확인

History 스프레드시트에서 확인:

- **CVE_History** 시트: CVE별 분석 이력
- **Send_History** 시트: 보고서 발송 이력

### 관리자 알림

- 에러 발생 시 `ADMIN_EMAIL`로 알림 발송
- 일일 최대 10건 제한 (알림 폭주 방지)
- 매일 처리 결과 요약 메일 발송
