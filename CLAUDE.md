# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

LENA AI Security — Google Apps Script(GAS) 기반 보안 취약점 자동 분석·리포팅 시스템.
Gmail에서 Apache HTTP Server, Tomcat, TomEE, Nginx 보안 메일을 수집하고, Gemini API(Structured Output)로 CVE를 분석한 뒤 Daily Digest 이메일을 발송한다.

## Tech Stack

- **Runtime:** Google Apps Script (V8), JavaScript (.js 로컬 / .gs Apps Script 편집기)
- **AI:** Gemini API (`gemini-3-flash-preview` → `gemini-2.5-flash` fallback)
- **Storage:** Gmail (수집), Google Sheets (CVE/발송 이력), PropertiesService (시크릿)
- **Deploy:** `clasp` CLI (`clasp push` / `clasp deploy`)
- **No build tools** — 코드가 GAS V8 런타임에서 직접 실행됨

## Commands

```bash
# Apps Script에 코드 업로드
clasp push

# 배포 버전 생성
clasp deploy --description "v3.x.x"

# 배포 목록 확인
clasp deployments
```

**테스트는 Apps Script 편집기에서 실행:**
- `testAll()` — 전체 단위 테스트 8개 실행
- `checkConfiguration()` — 설정 상태 검증 (API 키, 스프레드시트, 라벨, 트리거)
- `runDailySecurityDigest()` — 전체 파이프라인 수동 실행 (실제 Gmail/Gemini 호출)

개별 테스트: `testExtractCveIds()`, `testGroupAndDeduplicate()`, `testSchemaValidity()`, `testCveSeverityTable()`, `testAggregateStats()`, `testBuildDigestSubject()`, `testBuildEngineVersions()`, `testGetApiKey()`

## Architecture

### Pipeline (Main.js → 순차 실행)

```
collectUnreadMails (Collector) → groupAndDeduplicate (Collector)
  → analyzeGroup (Analyzer → Gemini API) → recordCveHistory (History → Sheets)
  → buildDailyDigest (Reporter → Renderer) → sendDigest (GmailApp)
  → notifySummary (Notifier)
```

### Module Responsibilities

| Module | Role |
|--------|------|
| **Main.js** | 파이프라인 오케스트레이터, 트리거 핸들러 |
| **Config.js** | 제품 정의(버전·라벨·키워드), 수신자, API 설정, 상수 |
| **Collector.js** | Gmail 라벨 기반 수집, 키워드 분류, 버전 필터링, messageId 중복 제거 |
| **Analyzer.js** | Gemini Structured Output 호출, few-shot 프롬프팅, 모델 fallback, 재시도 |
| **Schema.js** | Gemini 응답 JSON Schema (CVE item, version analysis, full report) |
| **Renderer.js** | table 기반 HTML 이메일 템플릿 (Outlook MSO 호환, inline style) |
| **Reporter.js** | Daily Digest 조립, 통계 집계, 제목 생성 |
| **Email.js** | 개별 보고서 HTML 빌더 (Renderer 재사용) |
| **History.js** | Sheets CVE 이력 + 발송 이력 (O(1) 캐시 기반 중복 검출) |
| **Notifier.js** | 관리자 에러 알림 (일 10건 rate limit) + 일일 요약 |
| **Setup.js** | 초기 설정 위저드 |
| **Test.js** | 단위 테스트 (mock 데이터 기반, GAS 네이티브 assert) |

### Key Design Decisions

- **공유 Gmail 라벨:** Tomcat과 TomEE가 `LENA-TOMCAT` 라벨을 공유 → Collector에서 키워드 점수 기반 분류
- **다중 메이저 버전:** Config의 `versions`가 배열일 때 각 버전을 독립 평가 후 최고 위험도로 최종 verdict 결정 (REQUIRED > RECOMMENDED > NOT_AFFECTED)
- **Gemini 모델 fallback:** primary 실패 시 fallback 모델 시도, 429/503은 재시도(최대 3회), 400/401은 즉시 다음 모델
- **HTML 이메일:** CSS class 불가(Gmail 제거) → 모든 스타일 inline, table 레이아웃, MSO conditional comment
- **개별 메일 실패 비전파:** 한 메일 분석 실패가 전체 파이프라인을 중단하지 않음

## Coding Conventions

- 모듈별 로그 태그: `Logger.log("[ModuleName] 메시지")`
- API 키는 `PropertiesService`에만 저장, 코드에 하드코딩 금지
- `.clasp.json`은 `.gitignore`에 포함 (스크립트 ID 보호)
- 각 파일은 단일 책임, JSDoc 주석 사용
- 트리거: `runDailySecurityDigest()` — 평일 08:00 KST

## Version History

현재 v3.0.3. 변경 이력은 CHANGELOG.md 참조.
