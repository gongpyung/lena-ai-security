// ============================================
// Config.gs - LENA AI 보안 메일 자동화 v3.0 설정
// ============================================

// === 이메일 설정 ===
var RECIPIENT_GROUPS = {
  security: ["your-security-team@example.com"],
  executive: [],   // Phase 9 확장용
  developer: []    // Phase 9 확장용
};
var ADMIN_EMAIL = "your-admin@example.com";
var CONTACT_EMAIL = "your-admin@example.com";

// === 처리 설정 ===
var API_CALL_DELAY = 3000;
var MAX_THREADS = 10;
var MAX_BODY_LENGTH = 10000;
var MAX_RETRIES = 3;
var RETRY_DELAY = 5000;
var RETRY_CODES = [429, 503];

// === Gemini 모델 설정 ===
var MODEL_NAME = "gemini-3-flash-preview";

// === 이력 관리 ===
var HISTORY_SHEET_NAME = "CVE_History";

// === 제품 통합 설정 객체 ===
var PRODUCTS = {
  "apache-httpd": {
    name: "Apache HTTP Server",
    gmailLabel: "LENA-APACHE",
    filterKeywords: ["SECURITY", "ANNOUNCE", "RELEASE", "Released", "CVE"],
    versions: {
      "Apache httpd": "2.4.66"
    },
    downloadUrlPattern: "https://httpd.apache.org/download.cgi",
    nvdSearchPrefix: "cpe:2.3:a:apache:http_server"
  },
  "apache-tomcat": {
    name: "Apache Tomcat",
    gmailLabel: "LENA-TOMCAT",
    filterKeywords: ["SECURITY", "ANNOUNCE", "RELEASE", "Released", "CVE", "End of Support"],
    versions: {
      "Apache Tomcat": ["7.0.107", "8.5.100", "9.0.113", "10.1.50"]
    },
    downloadUrlPattern: "https://tomcat.apache.org/download-{major}.cgi",
    nvdSearchPrefix: "cpe:2.3:a:apache:tomcat"
  },
  "apache-tomee": {
    name: "Apache TomEE",
    gmailLabel: "LENA-TOMCAT",  // Tomcat 라벨에서 TomEE 관련도 수집
    filterKeywords: ["TomEE", "SECURITY", "CVE"],
    versions: {
      "Apache TomEE": ["1.7.2", "7.1.4", "8.0.16"]
    },
    downloadUrlPattern: "https://tomee.apache.org/download.html",
    nvdSearchPrefix: "cpe:2.3:a:apache:tomee"
  },
  "nginx": {
    name: "Nginx",
    gmailLabel: "LENA-NGINX",
    filterKeywords: ["Release", "Security"],
    versions: {
      "Nginx": "1.29.3"
    },
    downloadUrlPattern: "https://nginx.org/en/download.html",
    nvdSearchPrefix: "cpe:2.3:a:f5:nginx"
  }
};

// === LENA_ENGINES (하위 호환용, PRODUCTS에서 자동 생성) ===
function buildEngineVersions() {
  var engines = {};
  for (var key in PRODUCTS) {
    var product = PRODUCTS[key];
    for (var engineName in product.versions) {
      engines[engineName] = product.versions[engineName];
    }
  }
  return engines;
}

// === API 키 관리 (PropertiesService) ===
function getApiKey() {
  var key = PropertiesService.getScriptProperties().getProperty("GEMINI_API_KEY");
  if (!key) {
    throw new Error("GEMINI_API_KEY가 설정되지 않았습니다. setupApiKey() 함수를 먼저 실행하세요.");
  }
  return key;
}

// 최초 1회 실행용 설정 함수
function setupApiKey() {
  PropertiesService.getScriptProperties().setProperty("GEMINI_API_KEY", "YOUR_API_KEY_HERE");
  Logger.log("API 키가 설정되었습니다. 이 함수의 키 값을 다시 제거하세요.");
}

// History 시트 ID도 PropertiesService로 관리
function getHistorySpreadsheetId() {
  var id = PropertiesService.getScriptProperties().getProperty("HISTORY_SPREADSHEET_ID");
  if (!id) {
    throw new Error("HISTORY_SPREADSHEET_ID가 설정되지 않았습니다.");
  }
  return id;
}

// === TLP 설정 ===
var TLP_LEVEL = "TLP:AMBER";  // 사내+고객사 공유 수준
var TLP_DESCRIPTION = "Limited disclosure, restricted to participants' organizations.";

// === 면책 문구 ===
var DISCLAIMER = "본 메일은 LENA AI 보안 어시스턴트가 자동 생성한 보고서입니다. " +
  "AI 분석 결과이므로 원본 메일을 반드시 함께 확인하세요. " +
  "본 보고서의 TLP 등급은 " + TLP_LEVEL + "입니다.";
