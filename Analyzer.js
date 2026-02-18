// ============================================
// Analyzer.gs - Gemini Structured Output 기반 분석
// LENA AI 보안 메일 자동화 v3.0
// ============================================

/**
 * Few-shot 예시를 포함한 시스템 프롬프트 생성
 * @param {string} engineInfo - LENA 엔진 버전 JSON 문자열
 * @returns {string} 시스템 프롬프트
 */
function buildSystemPrompt(engineInfo) {
  return [
    "당신은 15년 경력의 기업 보안팀 수석 분석가입니다.",
    "미들웨어 보안 패치 메일을 분석하여 정형화된 보안 보고서를 작성합니다.",
    "",
    "[역할]",
    "- CVE 취약점의 기술적 영향도를 정확히 평가",
    "- CVSS 점수 기반 심각도 분류 (None: 0, Low: 0.1-3.9, Medium: 4.0-6.9, High: 7.0-8.9, Critical: 9.0-10.0)",
    "- 경영진과 기술진 모두에게 적합한 이중 보고서 작성",
    "- LENA 제품군에 대한 구체적 영향도 분석",
    "",
    "[LENA 현재 엔진 버전]",
    engineInfo,
    "",
    "[버전 비교 규칙]",
    "- '필수(REQUIRED)': LENA 사용 버전이 취약점 영향 범위에 직접 포함",
    "- '권장(RECOMMENDED)': LENA 사용 버전이 영향 범위에 포함되지 않으나, 동일 메이저 버전 라인에서 1-2개 마이너 버전 차이 이내",
    "- '해당 없음(NOT_AFFECTED)': LENA 사용 버전이 완전히 다른 버전 라인이거나 영향 범위 밖",
    "- '판단 불가(UNDETERMINED)': 메일에서 영향 범위나 버전을 특정할 수 없는 경우",
    "",
    "[응답 규칙]",
    "- 반드시 한국어로 작성",
    "- CVSS 점수를 알 수 없으면 cvssScore를 -1로, cvssSeverity를 UNKNOWN으로 설정",
    "- NVD URL은 반드시 https://nvd.nist.gov/vuln/detail/{CVE-ID} 형식",
    "- executiveSummary는 비기술적 언어로 작성 (경영진 대상)",
    "- technicalSummary는 기술적 상세를 포함 (보안 엔지니어 대상)",
    "- CVE가 없는 Release/Notice 메일도 정상 분석 (cveList는 빈 배열)"
  ].join("\n");
}

/**
 * Few-shot 예시 생성
 * @returns {Array<Object>} Gemini contents 형식의 예시 대화
 */
function buildFewShotExamples() {
  var exampleInput = [
    "Subject: [SECURITY] CVE-2024-50379 Apache Tomcat - Request Smuggling",
    "Fixed in Apache Tomcat 11.0.2, 10.1.34, 9.0.98",
    "Versions Affected: 11.0.0-M1 to 11.0.1, 10.1.0-M1 to 10.1.33, 9.0.0.M1 to 9.0.97",
    "CVSS Score: 9.8 (Critical)",
    "Description: Improper handling of HTTP/2 requests..."
  ].join("\n");

  var exampleOutput = JSON.stringify({
    reportTag: "Security",
    productName: "Apache Tomcat",
    reportTitle: "[Security] Apache Tomcat Request Smuggling 취약점 (CVE-2024-50379)",
    executiveSummary: "Apache Tomcat에서 심각도 Critical(9.8) 수준의 Request Smuggling 취약점이 발견되었습니다. LENA에서 사용 중인 Tomcat 9.0.113은 영향 범위 밖이나, 동일 버전 라인의 근접 버전으로 예방적 업데이트를 권장합니다.",
    overallRiskLevel: "HIGH",
    immediateActionRequired: false,
    technicalSummary: "CVE-2024-50379는 HTTP/2 요청 처리 과정에서 발생하는 Request Smuggling 취약점입니다. 공격자가 비정상적인 HTTP/2 요청을 전송하여 프론트엔드와 백엔드 서버 간의 요청 경계를 혼동시킬 수 있습니다.",
    cveList: [{
      cveId: "CVE-2024-50379",
      title: "Apache Tomcat HTTP/2 Request Smuggling",
      description: "HTTP/2 요청 처리 시 부적절한 경계 검증으로 인한 Request Smuggling 취약점. 원격 공격자가 보안 통제를 우회하여 비인가 접근이 가능합니다.",
      cvssScore: 9.8,
      cvssSeverity: "CRITICAL",
      cvssVector: "CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:U/C:H/I:H/A:H",
      nvdUrl: "https://nvd.nist.gov/vuln/detail/CVE-2024-50379",
      affectedVersions: "Apache Tomcat 9.0.0.M1 ~ 9.0.97, 10.1.0-M1 ~ 10.1.33, 11.0.0-M1 ~ 11.0.1",
      fixedVersion: "9.0.98, 10.1.34, 11.0.2",
      patchAvailable: true,
      exploitExists: "POC_EXISTS"
    }],
    impactAnalysis: "본 취약점은 네트워크를 통해 원격으로 악용 가능하며, 인증 없이 공격이 가능합니다. Request Smuggling을 통해 캐시 포이즈닝, 세션 하이재킹, 웹 방화벽 우회 등의 2차 공격이 가능합니다.",
    actionGuide: [
      "LENA 사용 중인 Tomcat 9.0.113은 수정 버전(9.0.98) 이상이므로 즉각 패치는 불필요",
      "WAF/IDS에서 비정상 HTTP/2 요청 패턴 모니터링 규칙 추가 권장",
      "다음 정기 패치 윈도우에서 최신 버전 업데이트 검토"
    ],
    downloadLinks: [{
      label: "Apache Tomcat 9.0 다운로드",
      url: "https://tomcat.apache.org/download-90.cgi"
    }],
    versionAnalysis: [{
      productName: "Apache Tomcat",
      lenaVersions: "7.0.107, 8.5.100, 9.0.113, 10.1.50",
      mailMentionedVersions: "9.0.0.M1 ~ 9.0.97, 10.1.0-M1 ~ 10.1.33, 11.0.0-M1 ~ 11.0.1",
      isAffected: false,
      updateVerdict: "RECOMMENDED",
      updateVerdictReason: "LENA Tomcat 9.0.113은 수정 버전(9.0.98) 이상이나, 10.1.50도 수정 버전(10.1.34) 이상으로 직접 영향은 없습니다. 다만 동일 버전 라인의 근접 버전이므로 최신 보안 패치 적용을 권장합니다."
    }]
  }, null, 2);

  return [
    { role: "user", parts: [{ text: exampleInput }] },
    { role: "model", parts: [{ text: exampleOutput }] }
  ];
}

/**
 * Gemini API 호출 (Structured Output)
 * @param {string} mailBody - 메일 본문
 * @param {string} mailSubject - 메일 제목
 * @returns {Object|null} 파싱된 JSON 객체 또는 null
 */
function analyzeWithGemini(mailBody, mailSubject) {
  var apiKey = getApiKey();

  // 본문 크기 제한
  if (mailBody.length > MAX_BODY_LENGTH) {
    mailBody = mailBody.substring(0, MAX_BODY_LENGTH) + "\n...(이하 생략)";
    Logger.log("[Analyzer] 본문 " + MAX_BODY_LENGTH + "자 초과 - 잘림 처리");
  }

  var engineInfo = JSON.stringify(buildEngineVersions(), null, 2);
  var systemPrompt = buildSystemPrompt(engineInfo);
  var fewShotExamples = buildFewShotExamples();

  // contents 구성: system instruction + few-shot + 실제 입력
  var contents = [];

  // Few-shot 예시 추가
  for (var i = 0; i < fewShotExamples.length; i++) {
    contents.push(fewShotExamples[i]);
  }

  // 실제 분석 대상
  contents.push({
    role: "user",
    parts: [{ text: "Subject: " + mailSubject + "\n\n" + mailBody }]
  });

  var payload = {
    systemInstruction: {
      parts: [{ text: systemPrompt }]
    },
    contents: contents,
    generationConfig: getGenerationConfig()
  };

  var options = {
    method: "post",
    contentType: "application/json",
    payload: JSON.stringify(payload),
    muteHttpExceptions: true
  };

  // 모델 Fallback 재시도 로직
  var response, responseCode, responseBody;
  for (var m = 0; m < MODEL_LIST.length; m++) {
    var currentModel = MODEL_LIST[m];
    var url = "https://generativelanguage.googleapis.com/v1beta/models/" +
              currentModel + ":generateContent?key=" + apiKey;
    var succeeded = false;

    for (var attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      response = UrlFetchApp.fetch(url, options);
      responseCode = response.getResponseCode();
      responseBody = response.getContentText();

      if (responseCode === 200) { succeeded = true; break; }

      if (RETRY_CODES.indexOf(responseCode) !== -1 && attempt < MAX_RETRIES) {
        Logger.log("[Analyzer] " + currentModel + " 재시도 " + attempt + "/" + MAX_RETRIES +
                   " (HTTP " + responseCode + ") - " + (RETRY_DELAY * attempt) + "ms 대기");
        Utilities.sleep(RETRY_DELAY * attempt);
      } else {
        break;
      }
    }

    if (succeeded) break;

    // 비-재시도 오류(400, 401 등)는 다음 모델로 넘기지 않고 즉시 실패
    if (RETRY_CODES.indexOf(responseCode) === -1) {
      Logger.log("[Analyzer] API 호출 실패 (비-재시도 오류 HTTP " + responseCode + "): " + responseBody);
      throw new Error("Gemini API Error (HTTP " + responseCode + ")");
    }

    if (m < MODEL_LIST.length - 1) {
      Logger.log("[Fallback] " + currentModel + " 모두 실패 → " + MODEL_LIST[m + 1] + "으로 전환");
    } else {
      Logger.log("[Analyzer] API 호출 최종 실패 (HTTP " + responseCode + "): " + responseBody);
      throw new Error("Gemini API Error (HTTP " + responseCode + ") - 모든 모델 실패");
    }
  }

  var data = JSON.parse(responseBody);

  if (!data.candidates || data.candidates.length === 0) {
    Logger.log("[Analyzer] 응답에 candidates 없음");
    return null;
  }

  var candidate = data.candidates[0];

  if (candidate.finishReason === "SAFETY" || candidate.finishReason === "RECITATION") {
    Logger.log("[Analyzer] 안전 필터 차단: " + candidate.finishReason);
    return null;
  }

  if (candidate.content && candidate.content.parts && candidate.content.parts.length > 0) {
    try {
      var jsonText = candidate.content.parts[0].text.trim();
      var result = JSON.parse(jsonText);
      Logger.log("[Analyzer] 분석 완료: " + result.reportTitle);
      return result;
    } catch (parseError) {
      Logger.log("[Analyzer] JSON 파싱 실패: " + parseError.toString());
      return null;
    }
  }

  return null;
}

/**
 * 그룹 내 여러 메일을 순차 분석
 * @param {Object} group - groupAndDeduplicate() 결과의 단일 그룹
 * @returns {Array<Object>} 분석 결과 배열
 */
function analyzeGroup(group) {
  var results = [];

  for (var i = 0; i < group.mails.length; i++) {
    var mail = group.mails[i];

    Logger.log("[Analyzer] (" + (i + 1) + "/" + group.mails.length + ") " +
               group.productName + " 분석 중...");

    var result = analyzeWithGemini(mail.body, mail.subject);

    if (result) {
      result._metadata = {
        messageId: mail.messageId,
        originalFrom: mail.from,
        originalDate: mail.date,
        originalSubject: mail.subject,
        originalBody: mail.body,
        thread: mail.thread
      };
      results.push(result);
    } else {
      Logger.log("[Analyzer] 분석 실패/건너뜀: " + mail.subject);
    }

    // API 호출 간 대기 (마지막 제외)
    if (i < group.mails.length - 1) {
      Utilities.sleep(API_CALL_DELAY);
    }
  }

  return results;
}
