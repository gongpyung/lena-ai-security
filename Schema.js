// ============================================
// Schema.gs - Gemini Structured Output Schema 정의
// LENA AI 보안 메일 자동화 v3.0
// ============================================

/**
 * 개별 CVE 분석 결과 스키마
 */
function getCveItemSchema() {
  return {
    type: "OBJECT",
    properties: {
      cveId: {
        type: "STRING",
        description: "CVE 식별자 (예: CVE-2024-12345)"
      },
      title: {
        type: "STRING",
        description: "취약점 제목 (한국어)"
      },
      description: {
        type: "STRING",
        description: "취약점 상세 설명 (한국어, 2-3문장)"
      },
      cvssScore: {
        type: "NUMBER",
        description: "CVSS v3.1/v4.0 기본 점수 (0.0~10.0). 알 수 없으면 -1"
      },
      cvssSeverity: {
        type: "STRING",
        description: "CVSS 심각도 등급",
        enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "NONE", "UNKNOWN"]
      },
      cvssVector: {
        type: "STRING",
        description: "CVSS 벡터 문자열 (예: CVSS:3.1/AV:N/AC:L/...). 알 수 없으면 빈 문자열"
      },
      nvdUrl: {
        type: "STRING",
        description: "NVD 상세 페이지 URL (https://nvd.nist.gov/vuln/detail/CVE-...)"
      },
      affectedVersions: {
        type: "STRING",
        description: "영향 받는 버전 범위 (예: 'Apache Tomcat 9.0.0 ~ 9.0.112')"
      },
      fixedVersion: {
        type: "STRING",
        description: "수정된 버전 (예: '9.0.113'). 미패치 시 '미패치'"
      },
      patchAvailable: {
        type: "BOOLEAN",
        description: "패치 가용 여부"
      },
      exploitExists: {
        type: "STRING",
        description: "익스플로잇 존재 여부",
        enum: ["KNOWN_EXPLOIT", "POC_EXISTS", "NO_KNOWN_EXPLOIT", "UNKNOWN"]
      }
    },
    required: ["cveId", "title", "description", "cvssScore", "cvssSeverity",
               "nvdUrl", "affectedVersions", "fixedVersion", "patchAvailable", "exploitExists"]
  };
}

/**
 * 버전 영향 분석 결과 스키마
 */
function getVersionAnalysisSchema() {
  return {
    type: "OBJECT",
    properties: {
      productName: {
        type: "STRING",
        description: "제품명 (예: Apache Tomcat)"
      },
      lenaVersions: {
        type: "STRING",
        description: "LENA 사용 버전 (쉼표 구분)"
      },
      mailMentionedVersions: {
        type: "STRING",
        description: "메일에서 언급된 버전"
      },
      isAffected: {
        type: "BOOLEAN",
        description: "LENA 버전이 영향 범위에 포함되는지"
      },
      updateVerdict: {
        type: "STRING",
        description: "업데이트 판단",
        enum: ["REQUIRED", "RECOMMENDED", "NOT_AFFECTED", "UNDETERMINED"]
      },
      updateVerdictReason: {
        type: "STRING",
        description: "판단 근거 (1-2문장)"
      }
    },
    required: ["productName", "lenaVersions", "mailMentionedVersions",
               "isAffected", "updateVerdict", "updateVerdictReason"]
  };
}

/**
 * 메일 분석 전체 응답 스키마 (Gemini responseSchema용)
 */
function getMailAnalysisSchema() {
  return {
    type: "OBJECT",
    properties: {
      // === 메타 정보 ===
      reportTag: {
        type: "STRING",
        description: "보고서 분류 태그",
        enum: ["Security", "Release", "Notice"]
      },
      productName: {
        type: "STRING",
        description: "대상 제품명"
      },
      reportTitle: {
        type: "STRING",
        description: "보고서 제목 (형식: [태그] 제품명 핵심내용)"
      },

      // === Executive Summary (경영진용) ===
      executiveSummary: {
        type: "STRING",
        description: "경영진 보고용 요약 (2-3문장, 비기술적 언어)"
      },
      overallRiskLevel: {
        type: "STRING",
        description: "전체 위험 수준",
        enum: ["CRITICAL", "HIGH", "MEDIUM", "LOW", "INFORMATIONAL"]
      },
      immediateActionRequired: {
        type: "BOOLEAN",
        description: "즉각 조치 필요 여부"
      },

      // === Technical Details (기술진용) ===
      technicalSummary: {
        type: "STRING",
        description: "기술적 상세 분석 (여러 문단 가능)"
      },
      cveList: {
        type: "ARRAY",
        description: "CVE 목록 (없으면 빈 배열)",
        items: getCveItemSchema()
      },

      // === 영향 분석 ===
      impactAnalysis: {
        type: "STRING",
        description: "서비스 영향 분석 내용"
      },
      actionGuide: {
        type: "ARRAY",
        description: "조치 가이드 목록 (순서대로)",
        items: {
          type: "STRING",
          description: "개별 조치 항목"
        }
      },
      downloadLinks: {
        type: "ARRAY",
        description: "다운로드/참고 링크 목록",
        items: {
          type: "OBJECT",
          properties: {
            label: { type: "STRING", description: "링크 설명" },
            url: { type: "STRING", description: "URL" }
          },
          required: ["label", "url"]
        }
      },

      // === 버전 영향도 ===
      versionAnalysis: {
        type: "ARRAY",
        description: "LENA 버전별 영향 분석",
        items: getVersionAnalysisSchema()
      }
    },
    required: ["reportTag", "productName", "reportTitle",
               "executiveSummary", "overallRiskLevel", "immediateActionRequired",
               "technicalSummary", "cveList",
               "impactAnalysis", "actionGuide", "downloadLinks",
               "versionAnalysis"]
  };
}

/**
 * Gemini API generationConfig에 포함할 설정
 */
function getGenerationConfig() {
  return {
    responseMimeType: "application/json",
    responseSchema: getMailAnalysisSchema(),
    temperature: 0.1  // 보안 분석은 창의성보다 정확성
  };
}
