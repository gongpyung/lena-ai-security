// ============================================
// History.gs - Google Sheets 이력 관리
// LENA AI 보안 메일 자동화 v3.0
// ============================================

/**
 * 이력 시트 초기화 (최초 1회 실행)
 */
function initHistorySheet() {
  var ssId = getHistorySpreadsheetId();
  var ss = SpreadsheetApp.openById(ssId);

  // CVE 이력 시트
  var cveSheet = ss.getSheetByName("CVE_History");
  if (!cveSheet) {
    cveSheet = ss.insertSheet("CVE_History");
    cveSheet.appendRow([
      "처리일시", "CVE ID", "제품", "CVSS 점수", "심각도",
      "영향 범위", "패치 가용", "LENA 영향", "업데이트 판단",
      "NVD URL", "메일 제목"
    ]);
    cveSheet.setFrozenRows(1);
  }

  // 발송 이력 시트
  var sendSheet = ss.getSheetByName("Send_History");
  if (!sendSheet) {
    sendSheet = ss.insertSheet("Send_History");
    sendSheet.appendRow([
      "발송일시", "보고서 제목", "수신자", "메일 수", "CVE 수",
      "최고 위험도", "필수 업데이트 수", "상태"
    ]);
    sendSheet.setFrozenRows(1);
  }

  // 처리 이력 시트
  var processSheet = ss.getSheetByName("Process_History");
  if (!processSheet) {
    processSheet = ss.insertSheet("Process_History");
    processSheet.appendRow([
      "처리일시", "Message ID", "제품키", "메일 제목", "제품명"
    ]);
    processSheet.setFrozenRows(1);
  }

  Logger.log("[History] 이력 시트 초기화 완료");
}

/**
 * CVE 분석 결과를 이력에 기록
 * @param {Array<Object>} analysisResults - 분석 결과 배열
 */
function recordCveHistory(analysisResults) {
  var ssId = getHistorySpreadsheetId();
  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName("CVE_History");

  if (!sheet) {
    Logger.log("[History] CVE_History 시트 없음 - initHistorySheet() 먼저 실행");
    return;
  }

  var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");
  var rows = [];

  // CVE 캐시 초기화 (한 번만 시트를 읽고, 이후 O(1) 조회)
  var cveCache = { loaded: false, ids: {} };

  for (var i = 0; i < analysisResults.length; i++) {
    var result = analysisResults[i];
    if (!result.cveList) continue;

    for (var j = 0; j < result.cveList.length; j++) {
      var cve = result.cveList[j];

      // 중복 체크 (캐시 기반 O(1) 조회)
      if (isCveRecorded(cveCache, sheet, cve.cveId)) {
        Logger.log("[History] 이미 기록된 CVE: " + cve.cveId);
        continue;
      }

      // 새로 기록할 CVE를 캐시에도 추가 (같은 배치 내 중복 방지)
      cveCache.ids[cve.cveId] = true;

      var lenaAffected = "N/A";
      if (result.versionAnalysis && result.versionAnalysis.length > 0) {
        lenaAffected = result.versionAnalysis[0].isAffected ? "영향 있음" : "영향 없음";
      }

      var verdict = "N/A";
      if (result.versionAnalysis && result.versionAnalysis.length > 0) {
        verdict = VERDICT_LABELS[result.versionAnalysis[0].updateVerdict] || result.versionAnalysis[0].updateVerdict;
      }

      rows.push([
        timestamp,
        cve.cveId,
        result.productName,
        cve.cvssScore >= 0 ? cve.cvssScore : "-",
        cve.cvssSeverity,
        cve.affectedVersions,
        cve.patchAvailable ? "가용" : "미가용",
        lenaAffected,
        verdict,
        cve.nvdUrl,
        result._metadata ? result._metadata.originalSubject : "-"
      ]);
    }
  }

  if (rows.length > 0) {
    sheet.getRange(sheet.getLastRow() + 1, 1, rows.length, rows[0].length).setValues(rows);
    Logger.log("[History] CVE " + rows.length + "건 기록 완료");
  }
}

/**
 * CVE ID 중복 체크 (캐시 기반 O(1) 조회)
 *
 * [성능 개선]
 * 기존: 매 CVE마다 sheet.getDataRange().getValues() 호출 -> O(N*M)
 * 개선: 첫 호출 시 전체 시트를 읽어 Set(Object) 캐시 생성 -> 이후 O(1) 조회
 *
 * @param {Object} cveCache - { loaded: boolean, ids: { cveId: true } }
 * @param {Sheet} sheet - CVE_History 시트
 * @param {string} cveId - 확인할 CVE ID
 * @returns {boolean} 이미 기록된 CVE면 true
 */
function isCveRecorded(cveCache, sheet, cveId) {
  // 최초 호출 시 캐시 로드 (1회만 시트 읽기)
  if (!cveCache.loaded) {
    var data = sheet.getDataRange().getValues();
    cveCache.ids = {};
    for (var i = 1; i < data.length; i++) {  // 헤더 제외
      if (data[i][1]) {
        cveCache.ids[data[i][1]] = true;
      }
    }
    cveCache.loaded = true;
    Logger.log("[History] CVE 캐시 로드 완료: " + Object.keys(cveCache.ids).length + "건");
  }

  return cveCache.ids[cveId] === true;
}

/**
 * 발송 이력 기록
 */
function recordSendHistory(subject, recipients, stats, status) {
  var ssId = getHistorySpreadsheetId();
  var ss = SpreadsheetApp.openById(ssId);
  var sheet = ss.getSheetByName("Send_History");

  if (!sheet) return;

  var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

  sheet.appendRow([
    timestamp,
    subject,
    recipients,
    stats.totalMails,
    stats.totalCves,
    stats.highestRisk,
    stats.requiredUpdates,
    status
  ]);

  Logger.log("[History] 발송 이력 기록: " + status);
}

/**
 * 메일 처리 이력 중복 체크 (캐시 기반 O(1) 조회)
 *
 * 복합키: messageId + "|" + productKey
 * isCveRecorded()와 동일한 캐시 패턴 적용
 *
 * @param {Object} processCache - { loaded: boolean, ids: { compositeKey: true } }
 * @param {Sheet|null} sheet - Process_History 시트 (null이면 자동 조회/생성)
 * @param {string} messageId - Gmail 메시지 ID
 * @param {string} productKey - 제품키 (예: "apache-tomcat")
 * @returns {Object} { isDuplicate: boolean, sheet: Sheet } - 시트 참조도 반환 (자동 생성 대응)
 */
function isProcessed(processCache, sheet, messageId, productKey) {
  // 시트 미존재 시 자동 조회/생성
  if (!sheet) {
    var ssId = getHistorySpreadsheetId();
    var ss = SpreadsheetApp.openById(ssId);
    sheet = ss.getSheetByName("Process_History");
    if (!sheet) {
      sheet = ss.insertSheet("Process_History");
      sheet.appendRow(["처리일시", "Message ID", "제품키", "메일 제목", "제품명"]);
      sheet.setFrozenRows(1);
      processCache.loaded = true;
      processCache.ids = {};
      return { isDuplicate: false, sheet: sheet };
    }
  }

  // 최초 호출 시 캐시 로드 (1회만 시트 읽기)
  if (!processCache.loaded) {
    var data = sheet.getDataRange().getValues();
    processCache.ids = {};
    for (var i = 1; i < data.length; i++) {
      if (data[i][1] && data[i][2]) {
        processCache.ids[data[i][1] + "|" + data[i][2]] = true;
      }
    }
    processCache.loaded = true;
    Logger.log("[History] Process 캐시 로드 완료: " + Object.keys(processCache.ids).length + "건");
  }

  var compositeKey = messageId + "|" + productKey;
  return { isDuplicate: processCache.ids[compositeKey] === true, sheet: sheet };
}

/**
 * 메일 처리 이력 기록
 *
 * @param {Object} processCache - isProcessed()에서 사용하는 캐시 객체
 * @param {Sheet} sheet - Process_History 시트
 * @param {string} messageId - Gmail 메시지 ID
 * @param {string} productKey - 제품키
 * @param {string} subject - 메일 제목
 * @param {string} productName - 제품명
 */
function recordProcessHistory(processCache, sheet, messageId, productKey, subject, productName) {
  var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

  sheet.appendRow([timestamp, messageId, productKey, subject, productName]);

  // 캐시에 즉시 반영 (같은 실행 내 중복 방지)
  if (processCache && processCache.ids) {
    processCache.ids[messageId + "|" + productKey] = true;
  }

  Logger.log("[History] 처리 이력 기록: " + productName + " - " + subject);
}

/**
 * 90일 초과 이력 정리 (주간 트리거용)
 * Process_History, CVE_History 시트에서 오래된 행 삭제
 */
function cleanupHistory() {
  var ssId = getHistorySpreadsheetId();
  var ss = SpreadsheetApp.openById(ssId);
  var cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  var totalDeleted = 0;
  var sheetNames = ["Process_History", "CVE_History"];

  for (var s = 0; s < sheetNames.length; s++) {
    var sheet = ss.getSheetByName(sheetNames[s]);
    if (!sheet) continue;

    var data = sheet.getDataRange().getValues();
    var rowsToDelete = [];

    // 첫 번째 컬럼(처리일시)이 90일 초과인 행 수집 (헤더 제외)
    for (var i = data.length - 1; i >= 1; i--) {
      var rowDate = new Date(data[i][0]);
      if (rowDate < cutoffDate) {
        rowsToDelete.push(i + 1);  // 시트 행번호는 1-based
      }
    }

    // 역순으로 삭제 (행번호 변동 방지)
    for (var j = 0; j < rowsToDelete.length; j++) {
      sheet.deleteRow(rowsToDelete[j]);
    }

    if (rowsToDelete.length > 0) {
      Logger.log("[History] " + sheetNames[s] + ": " + rowsToDelete.length + "건 정리 완료 (90일 초과)");
    }

    totalDeleted += rowsToDelete.length;
  }

  Logger.log("[History] 이력 정리 완료: 총 " + totalDeleted + "건 삭제");
}
