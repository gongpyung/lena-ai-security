// ============================================
// Test.gs - 단위 테스트
// LENA AI 보안 메일 자동화 v3.0
// ============================================

function testAll() {
  testBuildEngineVersions();
  testGetApiKey();
  testExtractCveIds();
  testGroupAndDeduplicate();
  testSchemaValidity();
  testCveSeverityTable();
  testAggregateStats();
  testBuildDigestSubject();
  Logger.log("=== ALL TESTS PASSED ===");
}

function testBuildEngineVersions() {
  var engines = buildEngineVersions();
  assert(engines["Apache httpd"] === "2.4.66", "httpd version");
  assert(engines["Apache Tomcat"].length === 4, "tomcat versions count");
  assert(engines["Apache TomEE"].length === 3, "tomee versions count");
  assert(engines["Nginx"] === "1.29.3", "nginx version");
  Logger.log("[TEST] buildEngineVersions: PASS");
}

function testExtractCveIds() {
  var text = "Fixed CVE-2024-12345 and CVE-2024-67890. Also CVE-2024-12345 again.";
  var ids = extractCveIds(text);
  assert(ids.length === 2, "unique CVE count");
  assert(ids[0] === "CVE-2024-12345", "first CVE");
  assert(ids[1] === "CVE-2024-67890", "second CVE");
  Logger.log("[TEST] extractCveIds: PASS");
}

function testGetApiKey() {
  // PropertiesService에 키가 설정된 경우 정상 반환 확인
  // 참고: 이 테스트는 실제 PropertiesService에 키가 설정된 환경에서만 PASS
  var threw = false;
  try {
    var key = getApiKey();
    assert(typeof key === "string", "API key is string");
    assert(key.length > 0, "API key is not empty");
  } catch (e) {
    // 키 미설정 시 에러가 발생하는 것이 정상 동작
    threw = true;
    assert(e.message.indexOf("GEMINI_API_KEY") !== -1, "error mentions GEMINI_API_KEY");
  }
  Logger.log("[TEST] getApiKey: PASS" + (threw ? " (key not set - error path verified)" : ""));
}

function testGroupAndDeduplicate() {
  // 테스트 데이터: 동일 CVE, 다른 messageId 메일 2건 + 진짜 중복 1건 + 다른 제품 1건
  var mails = [
    {
      productKey: "apache-tomcat",
      productName: "Apache Tomcat",
      gmailLabel: "LENA-TOMCAT",
      body: "Fixed CVE-2024-12345 in Apache Tomcat 9.0.98",
      subject: "Security: CVE-2024-12345",
      messageId: "msg1"
    },
    {
      productKey: "apache-tomcat",
      productName: "Apache Tomcat",
      gmailLabel: "LENA-TOMCAT",
      body: "Fixed CVE-2024-12345 in Apache Tomcat 10.1.34",
      subject: "Security: CVE-2024-12345 (10.x)",
      messageId: "msg2"
    },
    {
      productKey: "apache-tomcat",
      productName: "Apache Tomcat",
      gmailLabel: "LENA-TOMCAT",
      body: "Fixed CVE-2024-12345 in Apache Tomcat 9.0.98",
      subject: "Security: CVE-2024-12345",
      messageId: "msg1"
    },
    {
      productKey: "nginx",
      productName: "Nginx",
      gmailLabel: "LENA-NGINX",
      body: "CVE-2024-99999 Nginx buffer overflow",
      subject: "Security: CVE-2024-99999",
      messageId: "msg3"
    }
  ];

  var groups = groupAndDeduplicate(mails);

  // apache-tomcat: msg1과 msg2 모두 유지 (같은 CVE지만 다른 messageId), 중복 msg1 제거
  assert(groups["apache-tomcat"] !== undefined, "tomcat group exists");
  assert(groups["apache-tomcat"].mails.length === 2, "tomcat: 2 mails (same CVE but different messageId)");
  assert(groups["apache-tomcat"].cveIds.length === 1, "tomcat: 1 unique CVE");
  assert(groups["apache-tomcat"].cveIds[0] === "CVE-2024-12345", "tomcat: correct CVE ID");

  // nginx: 1건
  assert(groups["nginx"] !== undefined, "nginx group exists");
  assert(groups["nginx"].mails.length === 1, "nginx: 1 mail");
  assert(groups["nginx"].cveIds[0] === "CVE-2024-99999", "nginx: correct CVE ID");

  Logger.log("[TEST] groupAndDeduplicate: PASS");
}

function testCveSeverityTable() {
  // CVE 목록으로 테이블 HTML 생성 테스트
  var cveList = [
    {
      cveId: "CVE-2024-11111",
      title: "Low severity test",
      cvssScore: 2.5,
      cvssSeverity: "LOW",
      nvdUrl: "https://nvd.nist.gov/vuln/detail/CVE-2024-11111",
      patchAvailable: true,
      exploitExists: "NO_KNOWN_EXPLOIT"
    },
    {
      cveId: "CVE-2024-99999",
      title: "Critical severity test",
      cvssScore: 9.8,
      cvssSeverity: "CRITICAL",
      nvdUrl: "https://nvd.nist.gov/vuln/detail/CVE-2024-99999",
      patchAvailable: false,
      exploitExists: "KNOWN_EXPLOIT"
    }
  ];

  var html = renderCveSeverityTable(cveList);

  // HTML이 빈 문자열이 아님
  assert(html.length > 0, "HTML is not empty");
  // Critical이 먼저 나와야 함 (심각도 정렬)
  var criticalPos = html.indexOf("CVE-2024-99999");
  var lowPos = html.indexOf("CVE-2024-11111");
  assert(criticalPos < lowPos, "Critical CVE appears before Low CVE");
  // table 기반 확인
  assert(html.indexOf('<table role="presentation"') !== -1, "uses table presentation");
  // display:flex 미사용 확인
  assert(html.indexOf("display:flex") === -1, "no display:flex");
  // NVD 링크 포함 확인
  assert(html.indexOf("nvd.nist.gov") !== -1, "NVD link present");
  // 빈 CVE 목록 테스트
  assert(renderCveSeverityTable([]) === '', "empty list returns empty string");
  assert(renderCveSeverityTable(null) === '', "null returns empty string");

  Logger.log("[TEST] renderCveSeverityTable: PASS");
}

function testAggregateStats() {
  var allResults = {
    "apache-tomcat": [
      {
        overallRiskLevel: "HIGH",
        cveList: [
          { cveId: "CVE-2024-11111", cvssSeverity: "HIGH" },
          { cveId: "CVE-2024-22222", cvssSeverity: "CRITICAL" }
        ],
        versionAnalysis: [
          { updateVerdict: "REQUIRED" }
        ]
      }
    ],
    "nginx": [
      {
        overallRiskLevel: "MEDIUM",
        cveList: [
          { cveId: "CVE-2024-33333", cvssSeverity: "MEDIUM" },
          { cveId: "CVE-2024-11111", cvssSeverity: "HIGH" }  // 중복 CVE
        ],
        versionAnalysis: [
          { updateVerdict: "NOT_AFFECTED" }
        ]
      }
    ]
  };

  var stats = aggregateStats(allResults);

  assert(stats.totalMails === 2, "totalMails = 2");
  assert(stats.totalCves === 3, "totalCves = 3 (unique, CVE-2024-11111 counted once)");
  assert(stats.criticalCount === 1, "criticalCount = 1");
  assert(stats.highCount === 1, "highCount = 1");
  assert(stats.requiredUpdates === 1, "requiredUpdates = 1");
  assert(stats.highestRisk === "HIGH", "highestRisk = HIGH");
  assert(stats.uniqueCveIds.length === 3, "3 unique CVE IDs");

  Logger.log("[TEST] aggregateStats: PASS");
}

function testBuildDigestSubject() {
  // Critical이 있는 경우
  var stats1 = { criticalCount: 2, highCount: 1, totalCves: 5, totalMails: 3 };
  var subject1 = buildDigestSubject("2026-02-03", stats1);
  assert(subject1.indexOf("[LENA Security Digest]") !== -1, "has prefix");
  assert(subject1.indexOf("2026-02-03") !== -1, "has date");
  assert(subject1.indexOf("CRITICAL(2)") !== -1, "has critical count");
  assert(subject1.indexOf("5 CVEs") !== -1, "has CVE count");

  // Critical 없고 High만 있는 경우
  var stats2 = { criticalCount: 0, highCount: 3, totalCves: 3, totalMails: 2 };
  var subject2 = buildDigestSubject("2026-02-03", stats2);
  assert(subject2.indexOf("HIGH(3)") !== -1, "has high count");
  assert(subject2.indexOf("CRITICAL") === -1, "no critical");

  // 둘 다 없는 경우
  var stats3 = { criticalCount: 0, highCount: 0, totalCves: 1, totalMails: 1 };
  var subject3 = buildDigestSubject("2026-02-03", stats3);
  assert(subject3.indexOf("CRITICAL") === -1, "no critical");
  assert(subject3.indexOf("HIGH") === -1, "no high");
  assert(subject3.indexOf("1 CVEs") !== -1, "has CVE count");

  Logger.log("[TEST] buildDigestSubject: PASS");
}

function testSchemaValidity() {
  var schema = getMailAnalysisSchema();
  assert(schema.type === "OBJECT", "root type");
  assert(schema.properties.cveList.type === "ARRAY", "cveList is array");
  assert(schema.required.indexOf("executiveSummary") !== -1, "executiveSummary required");
  assert(schema.required.indexOf("cveList") !== -1, "cveList required");
  Logger.log("[TEST] schema validity: PASS");
}

function assert(condition, message) {
  if (!condition) {
    throw new Error("ASSERTION FAILED: " + message);
  }
}
