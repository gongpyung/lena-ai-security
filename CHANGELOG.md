# Changelog

All notable changes to LENA AI Security Mail Automation will be documented in this file.

## [v3.0.3] - 2026-03-11

### Fixed
- **다중 메이저 버전 사용 시 updateVerdict 오판 수정**
  - LENA가 동일 제품의 여러 메이저 버전을 사용할 때 (예: Tomcat Native 1.3.1, 2.0.8) Gemini가 높은 버전(2.0.8) 기준으로만 판단하여 근접 버전(1.3.7 vs 1.3.1)도 `NOT_AFFECTED`로 반환하던 문제 수정
  - Analyzer.js 시스템 프롬프트에 `[다중 버전 판단 규칙]` 추가: 각 LENA 버전별 독립 판단 후 최고 위험도 채택
  - Analyzer.js Few-shot 예시 추가: Tomcat Native 1.3.7 릴리즈 + LENA 1.3.1/2.0.8 다중 버전 시나리오
  - Schema.js `updateVerdict`/`updateVerdictReason` description에 다중 버전 판단 규칙 안내 추가

## [v3.0.2] - 2026-02-13

### Fixed
- **개별 보고서 메일 HTML 렌더링 깨짐 수정** (`61f079d`)
  - Email.js의 `buildReportHTML()`이 CSS class 기반(`<style>` 태그)으로 HTML을 생성하여 Gmail/Outlook에서 스타일이 모두 제거되는 문제 수정
  - Renderer.js의 table + inline style 함수를 재사용하도록 변경 (200줄 -> 45줄)
  - Renderer.js에 `renderEngineVersions()` 함수 추가
  - 불필요한 CSS class 유틸 함수 5개 제거 (`getRelevanceClass`, `getCvssBadgeClass`, `getExploitBadge`, `getVerdictClass`, `buildEngineVersionHTML`)

### Added
- **EOL/EOS 공지 메일 필터링 지원** (`7e20ee4`)
  - `apache-tomcat` filterKeywords에 `"End of Support"` 키워드 추가
  - Tomcat Native 1.3.x 지원 종료, Tomcat 9.0.x LTS 전환 등 EOL 공지 포착 가능
- **Apache Tomcat Native 버전 관리 추가**
  - Config.js에 Tomcat Native 버전 등록 (`1.3.1`, `2.0.8`)
  - Collector.js 버전 필터링이 모든 엔진 버전을 비교하도록 수정 (기존: 첫 번째 엔진만 비교)

## [v3.0.1] - 2026-02-05

### Changed
- **v3.0 리팩토링** (`127ca6a`)
  - 버전 필터링 로직 개선
  - 처리 이력 캐시 도입
  - Schema v3.0 호환 및 UX 개선

### Added
- README 리디자인: 배지, Mermaid 다이어그램, 한국어 버전 추가 (`e3feb03`)

## [v3.0.0] - 2026-02-04

### Added
- **Initial Release** (`6eff089`)
  - Gmail 라벨 기반 보안 메일 자동 수집
  - Gemini API Structured Output 기반 AI 분석
  - 제품별 설정 (Apache HTTP Server, Tomcat, TomEE, Nginx)
  - table 기반 inline style 이메일 렌더링 엔진 (Renderer.js)
  - CVE 심각도 분석 및 LENA 버전 영향도 분석
  - Daily Digest 통합 보고서 발송
  - TLP 등급 표시 및 면책 문구
