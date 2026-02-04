// ============================================
// Main.gs - 파이프라인 오케스트레이터
// LENA AI 보안 메일 자동화 v3.0
// ============================================

/**
 * 메인 진입점 (트리거에서 호출)
 */
function runDailySecurityDigest() {
  var today = new Date();
  var day = today.getDay();

  // 주말 건너뜀
  if (day === 6 || day === 0) {
    Logger.log("[Main] 주말 - 실행 건너뜀");
    return;
  }

  var errors = [];
  var allResults = {};

  try {
    // Step 1: 수집
    Logger.log("[Main] === Step 1: 메일 수집 ===");
    var mails = collectUnreadMails();

    if (mails.length === 0) {
      Logger.log("[Main] 새 메일 없음 - 발송 건너뜀");
      return;
    }

    // Step 2: 그룹핑 + 중복제거
    Logger.log("[Main] === Step 2: 그룹핑 + 중복제거 ===");
    var groups = groupAndDeduplicate(mails);

    // Step 3: 제품별 분석
    Logger.log("[Main] === Step 3: Gemini 분석 ===");
    for (var key in groups) {
      try {
        var results = analyzeGroup(groups[key]);
        if (results.length > 0) {
          allResults[key] = results;
        }
      } catch (analysisError) {
        var errMsg = "[" + groups[key].productName + "] 분석 실패: " + analysisError.toString();
        Logger.log("[Main] " + errMsg);
        errors.push(errMsg);
        notifyAdmin("API_ERROR", analysisError.toString(), {
          productName: groups[key].productName,
          stackTrace: analysisError.stack || ""
        });
      }

      // 제품 간 대기
      Utilities.sleep(API_CALL_DELAY);
    }

    // Step 4: 이력 기록
    Logger.log("[Main] === Step 4: 이력 기록 ===");
    try {
      for (var rKey in allResults) {
        recordCveHistory(allResults[rKey]);
      }
    } catch (historyError) {
      var histErrMsg = "이력 기록 실패: " + historyError.toString();
      Logger.log("[Main] " + histErrMsg);
      errors.push(histErrMsg);
      // 이력 기록 실패는 발송을 중단하지 않음
    }

    // Step 5: 보고서 생성 + 발송
    Logger.log("[Main] === Step 5: 보고서 생성 + 발송 ===");
    var hasResults = Object.keys(allResults).length > 0;

    if (hasResults) {
      var digest = buildDailyDigest(allResults, today);
      var stats = aggregateStats(allResults);
      sendDigest(digest, today, stats, errors);
    } else {
      Logger.log("[Main] 분석 결과 없음 - 모든 메일 분석 실패");
      var emptyDigest2 = buildEmptyDigest(today);
      sendDigest(emptyDigest2, today, { totalMails: mails.length, totalCves: 0, criticalCount: 0, highCount: 0, requiredUpdates: 0, highestRisk: "INFORMATIONAL" }, errors);
    }

    // Step 6: 원본 메일 읽음 처리
    Logger.log("[Main] === Step 6: 읽음 처리 ===");
    markAllAsRead(mails);

  } catch (fatalError) {
    Logger.log("[Main] FATAL: " + fatalError.toString());
    notifyAdmin("SYSTEM_ERROR", fatalError.toString(), {
      stackTrace: fatalError.stack || ""
    });
  }

  // Step 7: 일일 요약 발송
  Logger.log("[Main] === Step 7: 관리자 요약 ===");
  try {
    var finalStats = Object.keys(allResults).length > 0 ?
      aggregateStats(allResults) :
      { totalMails: 0, totalCves: 0, criticalCount: 0, highCount: 0, requiredUpdates: 0, highestRisk: "INFORMATIONAL" };
    notifySummary(finalStats, errors);
  } catch (e) {
    Logger.log("[Main] 요약 발송 실패: " + e.toString());
  }

  Logger.log("[Main] === 파이프라인 완료 ===");
}

/**
 * Digest 발송
 */
function sendDigest(digest, reportDate, stats, errors) {
  var recipients = RECIPIENT_GROUPS.security.join(",");

  try {
    GmailApp.sendEmail(recipients, digest.subject, "", {
      htmlBody: digest.htmlBody
    });
    Logger.log("[Main] Digest 발송 완료: " + digest.subject);
    recordSendHistory(digest.subject, recipients, stats, "SUCCESS");
  } catch (sendError) {
    var errMsg = "발송 실패: " + sendError.toString();
    Logger.log("[Main] " + errMsg);
    errors.push(errMsg);
    recordSendHistory(digest.subject, recipients, stats, "FAILED: " + sendError.toString());
    notifyAdmin("SEND_ERROR", sendError.toString(), {});
  }
}

/**
 * 모든 수집된 메일을 읽음 처리
 */
function markAllAsRead(mails) {
  for (var i = 0; i < mails.length; i++) {
    try {
      mails[i].thread.markRead();
    } catch (e) {
      Logger.log("[Main] 읽음 처리 실패: " + e.toString());
    }
  }
  Logger.log("[Main] " + mails.length + "건 읽음 처리 완료");
}

/**
 * 최초 1회 실행용 트리거 설정 함수
 */
function setupDailyTrigger() {
  // 기존 트리거 모두 삭제
  var triggers = ScriptApp.getProjectTriggers();
  for (var i = 0; i < triggers.length; i++) {
    var funcName = triggers[i].getHandlerFunction();
    if (funcName === "summarizeEmailSystem" || funcName === "runDailySecurityDigest") {
      ScriptApp.deleteTrigger(triggers[i]);
      Logger.log("[Main] 기존 트리거 삭제: " + funcName);
    }
  }

  // 신규 트리거 생성
  ScriptApp.newTrigger("runDailySecurityDigest")
    .timeBased()
    .atHour(8)
    .everyDays(1)
    .inTimezone("Asia/Seoul")
    .create();

  Logger.log("[Main] 일일 트리거 생성 완료: runDailySecurityDigest (매일 08:00 KST)");
}
