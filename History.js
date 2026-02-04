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
