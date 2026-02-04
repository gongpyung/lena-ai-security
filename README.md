# LENA AI Security Mail Automation v3.0

Gmail 보안 메일링 리스트를 자동 수집하고, Gemini AI로 분석하여 보안 보고서를 발송하는 Google Apps Script 프로젝트입니다.

## 주요 기능

- **Gmail 라벨 기반 자동 수집** - 제품별 Gmail 라벨(`LENA-TOMCAT`, `LENA-APACHE`, `LENA-NGINX`)에서 미읽은 보안 메일 자동 수집
- **스마트 제품 분류** - 동일 라벨을 공유하는 제품(Tomcat/TomEE)을 키워드 기반으로 자동 분류
- **CVE 추출 및 중복 제거** - 메일 본문에서 CVE ID를 자동 추출하고, 중복 메일을 필터링
- **Gemini AI 구조화 분석** - Structured Output(JSON Schema)으로 일관된 분석 결과 생성
- **이중 보고서** - 경영진용 Executive Summary + 기술진용 Technical Details
- **LENA 버전 영향도 분석** - 사용 중인 엔진 버전과 취약점 영향 범위 자동 비교
- **Daily Digest** - 제품별 분석 결과를 통합한 일일 종합 보고서
- **Outlook 호환 HTML 템플릿** - MSO 조건부 주석 포함, table 기반 이메일 렌더링
- **이력 관리** - Google Sheets 기반 CVE/발송 이력 추적
- **관리자 알림** - 일일 알림 횟수 제한(10건)으로 알림 폭주 방지

## 모니터링 대상 제품

| 제품 | Gmail 라벨 | 현재 버전 |
|------|-----------|----------|
| Apache HTTP Server | `LENA-APACHE` | 2.4.66 |
| Apache Tomcat | `LENA-TOMCAT` | 7.0.107, 8.5.100, 9.0.113, 10.1.50 |
| Apache TomEE | `LENA-TOMCAT` | 1.7.2, 7.1.4, 8.0.16 |
| Nginx | `LENA-NGINX` | 1.29.3 |

## 아키텍처

```
Gmail 라벨 수집 (Collector)
    ↓
제품 분류 + 중복 제거 (Collector)
    ↓
Gemini AI 분석 (Analyzer + Schema)
    ↓
HTML 보고서 렌더링 (Renderer)
    ↓
Daily Digest 조립 (Reporter)
    ↓
메일 발송 + 이력 기록 (Main + History)
    ↓
관리자 알림 (Notifier)
```

## 파일 구조

| 파일 | 역할 |
|------|------|
| `Config.js` | 제품 설정, API 키 관리, 상수 정의 |
| `Main.js` | 파이프라인 오케스트레이터 (메인 진입점) |
| `Core.js` | 레거시 핵심 로직 (개별 제품 처리) |
| `Collector.js` | 메일 수집, 제품 분류, CVE 추출, 중복 제거 |
| `Analyzer.js` | Gemini Structured Output 기반 AI 분석 |
| `AI.js` | Gemini API 호출, 프롬프트 생성, 응답 파싱 |
| `Schema.js` | Gemini 응답 JSON Schema 정의 |
| `Renderer.js` | table 기반 HTML 이메일 템플릿 엔진 |
| `Reporter.js` | Daily Digest 통합 보고서 조립 |
| `Email.js` | 레거시 HTML 보고서 생성 |
| `History.js` | Google Sheets 이력 관리 (CVE/발송) |
| `Notifier.js` | 관리자 알림 (에러/일일 요약) |
| `Setup.js` | 초기 설정 마법사 (API 키, 라벨, 트리거) |
| `Test.js` | 단위 테스트 |

## 사전 요구사항

- Google 계정
- [Gemini API 키](https://aistudio.google.com/app/apikey)
- [clasp](https://github.com/nicksqudge/clasp-env) (로컬 개발 시)

## 빠른 시작

[QUICKSTART.md](QUICKSTART.md) 참조

## 배포

[DEPLOYMENT.md](DEPLOYMENT.md) 참조

## 테스트

[TESTING.md](TESTING.md) 참조

## 기여

[CONTRIBUTING.md](CONTRIBUTING.md) 참조

## 라이선스

[MIT License](LICENSE)
