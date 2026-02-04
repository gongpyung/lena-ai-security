# Contributing Guide

## 개발 환경 설정

### 1. 저장소 클론

```bash
git clone https://github.com/<org>/lena-ai-security.git
cd lena-ai-security
```

### 2. clasp 설치 및 로그인

```bash
npm install -g @google/clasp
clasp login
```

### 3. Apps Script 프로젝트 연결

```bash
# 기존 프로젝트에 연결
clasp clone <스크립트ID> --rootDir .
```

## 개발 워크플로우

### 코드 수정

1. 로컬에서 `.js` 파일 수정
2. `clasp push`로 Apps Script에 업로드
3. Apps Script 편집기에서 테스트 실행

### 테스트

```bash
# 업로드 후 Apps Script 편집기에서 실행
clasp push
# → testAll() 함수 실행
```

### 브랜치 전략

- `main` - 프로덕션 (트리거에 연결)
- `develop` - 개발 통합
- `feature/*` - 기능 개발
- `fix/*` - 버그 수정

## 코딩 규칙

### 파일 명명

- 각 파일은 단일 책임 원칙을 따릅니다
- Apps Script에서는 `.gs` 확장자, GitHub에서는 `.js` 확장자 사용

### 함수 주석

```javascript
/**
 * 함수 설명
 * @param {string} param1 - 파라미터 설명
 * @returns {Object} 반환값 설명
 */
```

### 로그 태그

모듈별 로그 태그를 일관되게 사용합니다:

```javascript
Logger.log("[ModuleName] 메시지");
```

### 에러 처리

- API 호출은 반드시 재시도 로직 포함
- 개별 메일 처리 실패가 전체 파이프라인을 중단하지 않도록 처리
- 에러 발생 시 `notifyAdmin()`으로 관리자 알림

## Pull Request

### PR 작성 가이드

1. 변경 사항을 명확히 설명
2. 관련 테스트 추가 또는 수정
3. `testAll()` 통과 확인

### 리뷰 체크리스트

- [ ] 기존 테스트 통과 (`testAll()`)
- [ ] 새 기능에 대한 테스트 추가
- [ ] API 키 등 민감 정보 미포함
- [ ] 로그 태그 규칙 준수
- [ ] 에러 처리 포함

## 보안 주의사항

- API 키를 코드에 하드코딩하지 마세요 (`PropertiesService` 사용)
- `.clasp.json`을 커밋하지 마세요 (`.gitignore`에 포함)
- 수신자 이메일 주소를 변경할 때 주의하세요
