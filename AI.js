// ============================================
// AI.gs - LENA AI 보안 메일 자동화 v3.0 Gemini API 연동
// ============================================

/**
 * [Phase 6] Gemini API 호출
 */
function callGeminiAPI(prompt) {
  var apiKey = getApiKey();
  var url = "https://generativelanguage.googleapis.com/v1beta/models/" + MODEL_NAME + ":generateContent?key=" + apiKey;

  var payload = {
    contents: [{
      parts: [{
        text: prompt
      }]
    }],
    generationConfig: {
      temperature: 0.2,
      topK: 40,
      topP: 0.95,
      maxOutputTokens: 2048
    }
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  var response = UrlFetchApp.fetch(url, options);
  var statusCode = response.getResponseCode();

  if (statusCode !== 200) {
    if (RETRY_CODES.indexOf(statusCode) !== -1) {
      throw new Error("API 오류 (재시도 가능): " + statusCode);
    }
    throw new Error("API 오류 (재시도 불가): " + statusCode + " - " + response.getContentText());
  }

  var json = JSON.parse(response.getContentText());

  if (!json.candidates || json.candidates.length === 0) {
    throw new Error("API 응답에 candidates 없음");
  }

  var text = json.candidates[0].content.parts[0].text;
  return text;
}

/**
 * [Phase 6] 분석 프롬프트 생성
 */
function buildAnalysisPrompt(emailData, product) {
  var engineVersions = formatEngineVersions(product.versions);

  var prompt = "당신은 LENA WAS 보안 전문가입니다. 다음 보안 메일을 분석하세요.\n\n" +
    "=== 분석 대상 메일 ===\n" +
    "제목: " + emailData.subject + "\n" +
    "발신자: " + emailData.from + "\n" +
    "날짜: " + emailData.date + "\n\n" +
    "본문:\n" + emailData.body + "\n\n" +
    "=== LENA 엔진 버전 (" + product.name + ") ===\n" +
    engineVersions + "\n\n" +
    "=== 분석 요구사항 ===\n" +
    "1. **관련성 판단**: 이 메일이 LENA 엔진 버전과 관련이 있는지 판단하세요.\n" +
    "   - '높음': 사용 중인 버전에 직접 영향\n" +
    "   - '보통': 인접 버전에 영향 또는 향후 업데이트 고려 필요\n" +
    "   - '낮음': 참고용 정보\n" +
    "   - '무관': LENA와 무관한 내용\n\n" +
    "2. **CVE 추출**: 본문에서 CVE 번호를 모두 추출하세요 (예: CVE-2024-1234).\n\n" +
    "3. **요약**: 핵심 내용을 2-3문장으로 요약하세요.\n\n" +
    "4. **영향 평가**: LENA 엔진에 미치는 영향을 평가하세요.\n\n" +
    "5. **권장 조치**: 즉시 조치 사항 또는 검토 필요 사항을 제안하세요.\n\n" +
    "=== 응답 형식 (JSON) ===\n" +
    "{\n" +
    '  "relevance": "높음|보통|낮음|무관",\n' +
    '  "cve_numbers": ["CVE-2024-1234", ...],\n' +
    '  "summary": "핵심 요약",\n' +
    '  "impact": "영향 평가",\n' +
    '  "recommendation": "권장 조치"\n' +
    "}\n\n" +
    "JSON만 응답하세요. 추가 설명은 불필요합니다.";

  return prompt;
}

/**
 * [Phase 6] AI 응답 파싱
 */
function parseAnalysisResponse(response) {
  try {
    // JSON 코드 블록 제거
    var cleaned = response.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

    var json = JSON.parse(cleaned);

    return {
      relevance: json.relevance || "무관",
      cveNumbers: json.cve_numbers || [],
      summary: json.summary || "",
      impact: json.impact || "",
      recommendation: json.recommendation || ""
    };
  } catch (e) {
    Logger.log("[오류] AI 응답 파싱 실패: " + e.toString());
    Logger.log("원본 응답:\n" + response);
    throw new Error("AI 응답 파싱 실패");
  }
}

/**
 * [유틸] 엔진 버전 포맷팅
 */
function formatEngineVersions(versions) {
  var lines = [];
  for (var name in versions) {
    var ver = versions[name];
    if (Array.isArray(ver)) {
      lines.push("- " + name + ": " + ver.join(", "));
    } else {
      lines.push("- " + name + ": " + ver);
    }
  }
  return lines.join("\n");
}

/**
 * [Phase 7] NVD API 조회 (향후 확장용)
 */
function queryNVD(cveId) {
  // TODO: Phase 7에서 구현
  // NVD API를 통해 CVE 상세 정보 조회
  Logger.log("[TODO] NVD API 조회: " + cveId);
  return null;
}

/**
 * [Phase 8] CVE 심각도 평가 (향후 확장용)
 */
function assessCVESeverity(cveData) {
  // TODO: Phase 8에서 구현
  // CVSS 점수 기반 심각도 평가
  Logger.log("[TODO] CVE 심각도 평가");
  return "알 수 없음";
}
