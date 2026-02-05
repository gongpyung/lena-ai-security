// ============================================
// Core.gs - LENA AI 보안 메일 자동화 v3.0 핵심 로직
// ============================================

/**
 * [Phase 1] 메인 실행 함수 - Gmail 라벨 기반 자동 수집
 */
function processSecurityEmails() {
  try {
    Logger.log("=== LENA AI 보안 메일 처리 시작 ===");

    var processedCount = 0;
    var errorCount = 0;

    // 각 제품별 처리
    for (var productKey in PRODUCTS) {
      var product = PRODUCTS[productKey];
      if (!product.gmailLabel) {
        Logger.log("[SKIP] " + product.name + " - Gmail 라벨 미설정");
        continue;
      }

      Logger.log("\n[처리 중] " + product.name + " (" + product.gmailLabel + ")");

      try {
        var result = processProductEmails(productKey, product);
        processedCount += result.processed;
        errorCount += result.errors;
      } catch (e) {
        Logger.log("[오류] " + product.name + " 처리 실패: " + e.toString());
        errorCount++;
      }

      Utilities.sleep(API_CALL_DELAY);
    }

    Logger.log("\n=== 처리 완료 ===");
    Logger.log("성공: " + processedCount + "건, 오류: " + errorCount + "건");

    if (errorCount > 0) {
      sendAdminNotification("보안 메일 처리 중 " + errorCount + "건의 오류 발생");
    }

  } catch (e) {
    Logger.log("[치명적 오류] " + e.toString());
    sendAdminNotification("보안 메일 처리 중 치명적 오류 발생: " + e.toString());
  }
}

/**
 * [Phase 2] 제품별 이메일 처리
 */
function processProductEmails(productKey, product) {
  var processed = 0;
  var errors = 0;
  var processCache = { loaded: false, ids: {} };
  var processSheet = null;

  try {
    var label = GmailApp.getUserLabelByName(product.gmailLabel);
    if (!label) {
      Logger.log("[경고] 라벨 없음: " + product.gmailLabel);
      return {processed: 0, errors: 1};
    }

    var threads = GmailApp.search("label:" + product.gmailLabel + " is:unread", 0, MAX_THREADS);
    Logger.log("  대상 스레드: " + threads.length + "개");

    for (var i = 0; i < threads.length; i++) {
      var thread = threads[i];

      try {
        // 중복 체크
        var messageId = thread.getMessages()[0].getId();
        var checkResult = isProcessed(processCache, processSheet, messageId, productKey);
        processSheet = checkResult.sheet;
        if (checkResult.isDuplicate) {
          Logger.log("  [중복] 건너뜀: " + thread.getFirstMessageSubject());
          thread.markRead();
          continue;
        }

        // 키워드 필터링
        var subject = thread.getFirstMessageSubject();
        if (!matchesKeywords(subject, product.filterKeywords)) {
          Logger.log("  [필터링] 건너뜀: " + subject);
          continue;
        }

        // AI 분석 및 메일 발송
        processThread(thread, product, productKey);
        try {
          recordProcessHistory(processCache, processSheet, messageId, productKey, subject, product.name);
        } catch (historyError) {
          Logger.log("  [경고] 처리 이력 기록 실패 (발송은 완료): " + historyError.toString());
        }
        processed++;

        // 처리 완료 표시
        thread.markRead();

      } catch (e) {
        Logger.log("  [오류] 스레드 처리 실패: " + e.toString());
        errors++;
      }

      Utilities.sleep(API_CALL_DELAY);
    }

  } catch (e) {
    Logger.log("[오류] " + product.name + " 처리 중 오류: " + e.toString());
    errors++;
  }

  return {processed: processed, errors: errors};
}

/**
 * [Phase 3] 스레드 처리 (AI 분석 + 메일 발송)
 */
function processThread(thread, product, productKey) {
  var messages = thread.getMessages();
  var firstMessage = messages[0];

  var emailData = {
    subject: firstMessage.getSubject(),
    from: firstMessage.getFrom(),
    date: firstMessage.getDate(),
    body: truncateBody(firstMessage.getPlainBody()),
    productName: product.name
  };

  Logger.log("  [분석 중] " + emailData.subject);

  // AI 분석
  var analysis = analyzeWithGemini(emailData.body, emailData.subject);

  if (!analysis) {
    Logger.log("  [필터링] AI 분석 실패 - analysis null");
    return;
  }

  Logger.log("  [분석 완료] reportTag=" + analysis.reportTag + ", riskLevel=" + analysis.overallRiskLevel);

  // 메일 발송
  sendSecurityReport(emailData, analysis, product);
  Logger.log("  [완료] 보고서 발송");
}


/**
 * [Phase 5] 보고서 메일 발송
 */
function sendSecurityReport(emailData, analysis, product) {
  var recipients = RECIPIENT_GROUPS.security.join(", ");
  var subject = analysis.reportTitle || ("[LENA Security] " + product.name + " - " + analysis.executiveSummary);
  var htmlBody = buildReportHTML(emailData, analysis, product);

  MailApp.sendEmail({
    to: recipients,
    subject: subject,
    htmlBody: htmlBody,
    name: "LENA AI Security Assistant"
  });
}

/**
 * [유틸] 키워드 매칭
 */
function matchesKeywords(subject, keywords) {
  var upperSubject = subject.toUpperCase();
  for (var i = 0; i < keywords.length; i++) {
    if (upperSubject.indexOf(keywords[i].toUpperCase()) !== -1) {
      return true;
    }
  }
  return false;
}

/**
 * [유틸] 본문 길이 제한
 */
function truncateBody(body) {
  if (body.length > MAX_BODY_LENGTH) {
    return body.substring(0, MAX_BODY_LENGTH) + "\n\n[... 본문 생략 ...]";
  }
  return body;
}

/**
 * [유틸] 관리자 알림
 */
function sendAdminNotification(message) {
  try {
    MailApp.sendEmail({
      to: ADMIN_EMAIL,
      subject: "[LENA AI 보안 시스템] 알림",
      body: message
    });
  } catch (e) {
    Logger.log("[오류] 관리자 알림 발송 실패: " + e.toString());
  }
}
