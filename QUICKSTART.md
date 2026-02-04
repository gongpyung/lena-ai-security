# Quick Start

LENA AI Security Mail Automation을 처음 설정하는 가이드입니다.

## 1. 사전 준비

### Gemini API 키 발급

1. [Google AI Studio](https://aistudio.google.com/app/apikey)에 접속
2. **Create API Key** 클릭
3. 발급된 API 키를 안전하게 보관

### clasp 설치 (로컬 개발용)

```bash
npm install -g @google/clasp
clasp login
```

## 2. Apps Script에 배포

### 방법 A: clasp으로 배포 (권장)

```bash
# 프로젝트 클론 (기존 스크립트가 있는 경우)
clasp clone <스크립트ID>

# 또는 새 프로젝트 생성
clasp create --title "LENA AI Security" --type standalone

# 코드 업로드
clasp push
```

### 방법 B: 수동 배포

1. [script.google.com](https://script.google.com) 접속
2. **새 프로젝트** 생성
3. 각 `.js` 파일의 내용을 `.gs` 파일로 복사

## 3. 초기 설정

### Step 1: API 키 설정

Apps Script 편집기에서 `setupApiKey()` 함수 수정 후 실행:

```javascript
function setupApiKey() {
  PropertiesService.getScriptProperties().setProperty(
    "GEMINI_API_KEY", "여기에_실제_API_키_입력"
  );
}
```

> 실행 후 반드시 코드에서 API 키를 제거하세요.

### Step 2: 설정 마법사 실행

Apps Script 편집기에서 `runSetupWizard()` 함수를 실행합니다.

자동으로 수행되는 작업:
- API 키 확인
- History 스프레드시트 생성
- Gmail 라벨 생성 (`LENA-TOMCAT`, `LENA-APACHE`, `LENA-NGINX`)
- 일일 실행 트리거 설정 (매일 08:00 KST)

### Step 3: Gmail 필터 설정

Gmail에서 보안 메일링 리스트의 메일이 자동으로 라벨에 분류되도록 필터를 생성합니다:

| 라벨 | 필터 조건 예시 |
|------|-------------|
| `LENA-TOMCAT` | `from:announce@tomcat.apache.org` |
| `LENA-APACHE` | `from:announce@httpd.apache.org` |
| `LENA-NGINX` | `from:nginx-announce@nginx.org` |

## 4. 설정 확인

`checkConfiguration()` 함수를 실행하여 모든 설정이 올바른지 확인합니다.

## 5. 테스트 실행

```javascript
// 수동 실행으로 동작 확인
runDailySecurityDigest()
```

실행 로그는 Apps Script 편집기의 **실행 > 실행 로그**에서 확인할 수 있습니다.

## 6. 제품 버전 업데이트

`Config.js`의 `PRODUCTS` 객체에서 LENA 엔진 버전을 최신으로 유지하세요:

```javascript
var PRODUCTS = {
  "apache-tomcat": {
    versions: {
      "Apache Tomcat": ["7.0.107", "8.5.100", "9.0.113", "10.1.50"]
    }
    // ...
  }
};
```

## 문제 해결

| 증상 | 해결 방법 |
|------|----------|
| API 키 오류 | `setupApiKey()` 재실행 |
| 라벨을 찾을 수 없음 | Gmail에서 라벨 수동 생성 또는 `createGmailLabels()` 실행 |
| 메일이 수집되지 않음 | Gmail 필터가 올바르게 설정되었는지 확인 |
| 트리거가 실행되지 않음 | `listTriggers()`로 확인 후 `setupDailyTrigger()` 재실행 |
