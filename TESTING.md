# Testing Guide

## 단위 테스트

### 전체 테스트 실행

Apps Script 편집기에서 `testAll()` 함수를 실행합니다.

### 개별 테스트

| 테스트 함수 | 검증 대상 |
|------------|----------|
| `testBuildEngineVersions()` | PRODUCTS에서 엔진 버전 맵 생성 |
| `testGetApiKey()` | API 키 설정/미설정 양쪽 경로 |
| `testExtractCveIds()` | CVE ID 정규식 추출 및 중복 제거 |
| `testGroupAndDeduplicate()` | 메일 그룹핑 및 CVE 기반 중복 제거 |
| `testSchemaValidity()` | Gemini 응답 JSON Schema 구조 |
| `testCveSeverityTable()` | CVE 심각도 테이블 HTML 렌더링 및 정렬 |
| `testAggregateStats()` | 전체 통계 집계 (CVE 중복 카운트 포함) |
| `testBuildDigestSubject()` | Digest 제목 생성 (Critical/High/일반) |

### 테스트 결과 확인

실행 후 **실행 로그**에서 결과를 확인합니다:

```
[TEST] buildEngineVersions: PASS
[TEST] extractCveIds: PASS
[TEST] getApiKey: PASS
[TEST] groupAndDeduplicate: PASS
[TEST] renderCveSeverityTable: PASS
[TEST] aggregateStats: PASS
[TEST] buildDigestSubject: PASS
[TEST] schema validity: PASS
=== ALL TESTS PASSED ===
```

## 통합 테스트

### 설정 확인

```javascript
// 전체 설정 상태 확인 (API 키, 스프레드시트, 라벨, 트리거, 제품)
checkConfiguration()
```

### 단일 제품 테스트

```javascript
// 특정 제품만 처리 (레거시 Core.js 기반)
testSingleProduct("apache-tomcat")
testSingleProduct("nginx")
```

### 전체 파이프라인 테스트

```javascript
// 전체 Daily Digest 파이프라인 수동 실행
runDailySecurityDigest()
```

> 실제 Gmail 메일을 수집하고 Gemini API를 호출하므로 API 쿼터에 유의하세요.

## 테스트 시 주의사항

- `testGetApiKey()`는 API 키가 설정되지 않은 환경에서도 PASS합니다 (에러 경로 검증)
- `testGroupAndDeduplicate()`는 모킹된 데이터를 사용하므로 Gmail 연결 불필요
- 통합 테스트(`runDailySecurityDigest`)는 실제 메일 발송이 발생하므로 수신자 주소를 확인하세요
- Gemini API 호출 테스트 시 일일 쿼터 제한에 주의하세요

## 디버깅

### 로그 확인

Apps Script 편집기에서:
1. **실행 > 실행 로그** - 최근 실행 로그
2. **보기 > Stackdriver 로깅** - 상세 로그

### 주요 로그 태그

| 태그 | 모듈 |
|------|------|
| `[Main]` | 파이프라인 단계 진행 |
| `[Collector]` | 메일 수집/분류 |
| `[Analyzer]` | Gemini AI 분석 |
| `[History]` | 이력 기록 |
| `[Notifier]` | 관리자 알림 |
| `[TEST]` | 단위 테스트 |
