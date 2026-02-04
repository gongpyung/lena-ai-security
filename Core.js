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

  try {
    var label = GmailApp.getUserLabelByName(product.gmailLabel);
    if (!label) {
      Logger.log("[경고] 라벨 없음: " + product.gmailLabel);
      return {processed: 0, errors: 1};
    }

    var threads = label.getThreads(0, MAX_THREADS);
    Logger.log("  대상 스레드: " + threads.length + "개");

    for (var i = 0; i < threads.length; i++) {
      var thread = threads[i];

      try {
        // 중복 체크
        var messageId = thread.getMessages()[0].getId();
        if (isDuplicate(messageId)) {
          Logger.log("  [중복] 건너뜀: " + thread.getFirstMessageSubject());
          thread.removeLabel(label);
          continue;
        }

        // 키워드 필터링
        var subject = thread.getFirstMessageSubject();
        if (!matchesKeywords(subject, product.filterKeywords)) {
          Logger.log("  [필터링] 건너뜀: " + subject);
          thread.removeLabel(label);
          continue;
        }

        // AI 분석 및 메일 발송
        processThread(thread, product, productKey);
        recordHistory(messageId, subject, product.name);
        processed++;

        // 라벨 제거
        thread.removeLabel(label);

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
  var analysis = analyzeWithGemini(emailData, product);

  if (!analysis || !analysis.relevance || analysis.relevance === "무관") {
    Logger.log("  [필터링] AI 분석 결과 무관");
    return;
  }

  // 메일 발송
  sendSecurityReport(emailData, analysis, product);
  Logger.log("  [완료] 보고서 발송");
}

/**
 * [Phase 4] AI 분석 (Gemini API)
 */
function analyzeWithGemini(emailData, product) {
  var prompt = buildAnalysisPrompt(emailData, product);

  for (var attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      var response = callGeminiAPI(prompt);
      return parseAnalysisResponse(response);
    } catch (e) {
      Logger.log("  [재시도 " + attempt + "/" + MAX_RETRIES + "] " + e.toString());
      if (attempt < MAX_RETRIES) {
        Utilities.sleep(RETRY_DELAY);
      }
    }
  }

  throw new Error("AI 분석 실패 (최대 재시도 초과)");
}

/**
 * [Phase 5] 보고서 메일 발송
 */
function sendSecurityReport(emailData, analysis, product) {
  var recipients = RECIPIENT_GROUPS.security.join(", ");
  var subject = "[LENA Security] " + product.name + " - " + analysis.summary;
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
