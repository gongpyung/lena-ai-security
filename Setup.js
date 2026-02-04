// ============================================
// Setup.gs - LENA AI 보안 메일 자동화 v3.0 초기 설정
// ============================================

/**
 * [설치] 초기 설정 마법사
 *
 * 실행 순서:
 * 1. setupApiKey() - API 키 설정
 * 2. setupHistorySpreadsheet() - History 스프레드시트 생성
 * 3. setupGmailLabels() - Gmail 라벨 생성
 * 4. setupTriggers() - 자동 실행 트리거 설정
 */
function runSetupWizard() {
  try {
    Logger.log("=== LENA AI 보안 메일 자동화 초기 설정 시작 ===\n");

    // Step 1: API 키 확인
    Logger.log("[Step 1/4] API 키 확인");
    try {
      getApiKey();
      Logger.log("✓ API 키 설정 완료\n");
    } catch (e) {
      Logger.log("✗ API 키 미설정");
      Logger.log("setupApiKey() 함수를 먼저 실행하여 API 키를 설정하세요.\n");
      return;
    }

    // Step 2: History 스프레드시트
    Logger.log("[Step 2/4] History 스프레드시트 생성");
    var ssId = createHistorySpreadsheet();
    Logger.log("✓ 스프레드시트 생성 완료: " + ssId + "\n");

    // Step 3: Gmail 라벨
    Logger.log("[Step 3/4] Gmail 라벨 생성");
    createGmailLabels();
    Logger.log("✓ Gmail 라벨 생성 완료\n");

    // Step 4: 트리거
    Logger.log("[Step 4/4] 자동 실행 트리거 설정");
    createTriggers();
    Logger.log("✓ 트리거 설정 완료\n");

    Logger.log("=== 초기 설정 완료 ===");
    Logger.log("이제 processSecurityEmails() 함수가 매일 자동 실행됩니다.");
    Logger.log("즉시 테스트하려면 processSecurityEmails() 함수를 수동 실행하세요.");

  } catch (e) {
    Logger.log("[오류] 초기 설정 실패: " + e.toString());
  }
}

/**
 * [설치] History 스프레드시트 생성
 */
function createHistorySpreadsheet() {
  try {
    // 기존 ID 확인
    try {
      var existingId = getHistorySpreadsheetId();
      Logger.log("  기존 스프레드시트 사용: " + existingId);
      return existingId;
    } catch (e) {
      // 없으면 새로 생성
    }

    // 새 스프레드시트 생성
    var ss = SpreadsheetApp.create("LENA AI Security Mail History");
    var ssId = ss.getId();

    // ID 저장
    PropertiesService.getScriptProperties().setProperty("HISTORY_SPREADSHEET_ID", ssId);

    // History 시트 초기화
    initHistorySheet();

    Logger.log("  새 스프레드시트 생성: " + ssId);
    Logger.log("  URL: " + ss.getUrl());

    return ssId;
  } catch (e) {
    throw new Error("스프레드시트 생성 실패: " + e.toString());
  }
}

/**
 * [설치] Gmail 라벨 생성
 */
function createGmailLabels() {
  var created = 0;
  var existing = 0;

  for (var key in PRODUCTS) {
    var product = PRODUCTS[key];
    if (!product.gmailLabel) continue;

    try {
      var label = GmailApp.getUserLabelByName(product.gmailLabel);
      if (!label) {
        GmailApp.createLabel(product.gmailLabel);
        Logger.log("  생성: " + product.gmailLabel);
        created++;
      } else {
        Logger.log("  존재: " + product.gmailLabel);
        existing++;
      }
    } catch (e) {
      Logger.log("  오류: " + product.gmailLabel + " - " + e.toString());
    }
  }

  Logger.log("  생성: " + created + "개, 기존: " + existing + "개");
}

/**
 * [설치] 자동 실행 트리거 생성
 */
function createTriggers() {
  // 기존 트리거 삭제
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    if (triggers[i].getHandlerFunction() === "processSecurityEmails" ||
        triggers[i].getHandlerFunction() === "cleanupHistory") {
      ScriptApp.deleteTrigger(triggers[i]);
    }
  }

  // 메일 처리 트리거 (매일 오전 8시)
  ScriptApp.newTrigger("processSecurityEmails")
    .timeBased()
    .everyDays(1)
    .atHour(8)
    .create();

  Logger.log("  생성: processSecurityEmails (매일 08:00)");

  // 이력 정리 트리거 (매주 일요일 오전 3시)
  ScriptApp.newTrigger("cleanupHistory")
    .timeBased()
    .onWeekDay(ScriptApp.WeekDay.SUNDAY)
    .atHour(3)
    .create();

  Logger.log("  생성: cleanupHistory (매주 일요일 03:00)");
}

/**
 * [관리] 트리거 목록 조회
 */
function listTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  Logger.log("=== 설정된 트리거 ===");

  if (triggers.length === 0) {
    Logger.log("설정된 트리거가 없습니다.");
    return;
  }

  for (var i = 0; i < triggers.length; i++) {
    var trigger = triggers[i];
    Logger.log((i + 1) + ". " + trigger.getHandlerFunction());
    Logger.log("   유형: " + trigger.getEventType());
    Logger.log("   생성일: " + trigger.getTriggerSource());
  }
}

/**
 * [관리] 트리거 삭제
 */
function deleteTriggers() {
  var triggers = ScriptApp.getProjectTriggers();
  var count = 0;

  for (var i = 0; i < triggers.length; i++) {
    ScriptApp.deleteTrigger(triggers[i]);
    count++;
  }

  Logger.log("트리거 " + count + "개 삭제 완료");
}

/**
 * [테스트] 설정 확인
 */
function checkConfiguration() {
  Logger.log("=== LENA AI 보안 메일 자동화 설정 확인 ===\n");

  // 1. API 키
  Logger.log("[1] API 키");
  try {
    getApiKey();
    Logger.log("✓ 설정됨\n");
  } catch (e) {
    Logger.log("✗ 미설정: " + e.toString() + "\n");
  }

  // 2. History 스프레드시트
  Logger.log("[2] History 스프레드시트");
  try {
    var ssId = getHistorySpreadsheetId();
    var ss = SpreadsheetApp.openById(ssId);
    Logger.log("✓ 연결됨: " + ss.getName());
    Logger.log("  URL: " + ss.getUrl() + "\n");
  } catch (e) {
    Logger.log("✗ 미설정: " + e.toString() + "\n");
  }

  // 3. Gmail 라벨
  Logger.log("[3] Gmail 라벨");
  var labelCount = 0;
  for (var key in PRODUCTS) {
    var product = PRODUCTS[key];
    if (!product.gmailLabel) continue;

    var label = GmailApp.getUserLabelByName(product.gmailLabel);
    if (label) {
      var threadCount = label.getThreads().length;
      Logger.log("✓ " + product.gmailLabel + ": " + threadCount + "개 스레드");
      labelCount++;
    } else {
      Logger.log("✗ " + product.gmailLabel + ": 없음");
    }
  }
  Logger.log("  총 " + labelCount + "개 라벨\n");

  // 4. 트리거
  Logger.log("[4] 자동 실행 트리거");
  var triggers = ScriptApp.getProjectTriggers();
  if (triggers.length > 0) {
    for (var i = 0; i < triggers.length; i++) {
      Logger.log("✓ " + triggers[i].getHandlerFunction());
    }
  } else {
    Logger.log("✗ 설정된 트리거 없음");
  }
  Logger.log("");

  // 5. 제품 설정
  Logger.log("[5] 제품 설정");
  for (var key in PRODUCTS) {
    var product = PRODUCTS[key];
    Logger.log("✓ " + product.name);
    Logger.log("  라벨: " + (product.gmailLabel || "미설정"));
    Logger.log("  버전: " + JSON.stringify(product.versions));
  }

  Logger.log("\n=== 확인 완료 ===");
}

/**
 * [테스트] 단일 제품 테스트
 */
function testSingleProduct(productKey) {
  Logger.log("=== " + productKey + " 테스트 ===");

  if (!PRODUCTS[productKey]) {
    Logger.log("✗ 존재하지 않는 제품: " + productKey);
    return;
  }

  var product = PRODUCTS[productKey];
  Logger.log("제품: " + product.name);
  Logger.log("라벨: " + product.gmailLabel);

  var result = processProductEmails(productKey, product);
  Logger.log("\n처리 결과: " + result.processed + "건 성공, " + result.errors + "건 실패");
}
