// ============================================
// Notifier.gs - 실패 알림 메커니즘
// LENA AI 보안 메일 자동화 v3.0
// ============================================

// === 일일 알림 횟수 제한 ===
var MAX_DAILY_ADMIN_ALERTS = 10;  // 하루 최대 관리자 알림 횟수
var ALERT_COUNT_PROPERTY_KEY = "ADMIN_ALERT_COUNT";
var ALERT_DATE_PROPERTY_KEY = "ADMIN_ALERT_DATE";

/**
 * 오늘 발송한 관리자 알림 횟수를 확인하고 제한 초과 여부 반환
 * PropertiesService에 날짜별 카운터 저장
 * @returns {boolean} true = 알림 발송 가능, false = 제한 초과
 */
function canSendAdminAlert() {
  var props = PropertiesService.getScriptProperties();
  var today = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd");
  var storedDate = props.getProperty(ALERT_DATE_PROPERTY_KEY) || "";
  var count = parseInt(props.getProperty(ALERT_COUNT_PROPERTY_KEY) || "0", 10);

  // 날짜가 바뀌면 카운터 리셋
  if (storedDate !== today) {
    props.setProperty(ALERT_DATE_PROPERTY_KEY, today);
    props.setProperty(ALERT_COUNT_PROPERTY_KEY, "0");
    return true;
  }

  return count < MAX_DAILY_ADMIN_ALERTS;
}

/**
 * 관리자 알림 카운터 증가
 */
function incrementAlertCount() {
  var props = PropertiesService.getScriptProperties();
  var count = parseInt(props.getProperty(ALERT_COUNT_PROPERTY_KEY) || "0", 10);
  props.setProperty(ALERT_COUNT_PROPERTY_KEY, String(count + 1));
}

/**
 * 관리자에게 에러 알림 발송
 * 일일 최대 MAX_DAILY_ADMIN_ALERTS(10)건까지만 발송하여 알림 폭주 방지
 * 제한 초과 시 로그만 기록
 *
 * @param {string} errorType - 에러 유형 (API_ERROR, RENDER_ERROR, SEND_ERROR, SYSTEM_ERROR)
 * @param {string} errorMessage - 에러 메시지
 * @param {Object} context - 추가 컨텍스트 { mailSubject, productName, stackTrace 등 }
 */
function notifyAdmin(errorType, errorMessage, context) {
  context = context || {};

  // 일일 알림 횟수 제한 체크
  if (!canSendAdminAlert()) {
    Logger.log("[Notifier] 일일 알림 횟수 제한 초과 (" + MAX_DAILY_ADMIN_ALERTS +
               "건) - 로그만 기록: " + errorType + " / " + errorMessage);
    return;
  }

  var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

  var subject = "[LENA AI Bot - ERROR] " + errorType + " (" + timestamp + ")";

  var body = [
    "LENA AI 보안 메일 봇 오류 알림",
    "",
    "발생 시각: " + timestamp,
    "오류 유형: " + errorType,
    "오류 내용: " + errorMessage,
    "",
    "컨텍스트:",
    context.mailSubject ? "  메일 제목: " + context.mailSubject : "",
    context.productName ? "  제품: " + context.productName : "",
    context.stackTrace ? "  스택 트레이스:\n" + context.stackTrace : "",
    "",
    "이 메일은 자동 생성되었습니다."
  ].filter(function(line) { return line !== ""; }).join("\n");

  try {
    GmailApp.sendEmail(ADMIN_EMAIL, subject, body);
    incrementAlertCount();
    Logger.log("[Notifier] 관리자 알림 발송 완료: " + errorType);
  } catch (e) {
    // 알림 발송 자체가 실패하면 로그만 기록
    Logger.log("[Notifier] 관리자 알림 발송 실패: " + e.toString());
  }
}

/**
 * 일일 처리 결과 요약 발송 (성공 시에도)
 */
function notifySummary(stats, errors) {
  var timestamp = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm:ss");

  var subject = "[LENA AI Bot] Daily Summary (" + timestamp + ")";

  var body = [
    "LENA AI 보안 메일 봇 일일 처리 요약",
    "",
    "처리 시각: " + timestamp,
    "분석 메일: " + stats.totalMails + "건",
    "발견 CVE: " + stats.totalCves + "건",
    "  - Critical: " + stats.criticalCount + "건",
    "  - High: " + stats.highCount + "건",
    "필수 업데이트: " + stats.requiredUpdates + "건",
    "최고 위험도: " + stats.highestRisk,
    ""
  ];

  if (errors.length > 0) {
    body.push("오류 목록 (" + errors.length + "건):");
    for (var i = 0; i < errors.length; i++) {
      body.push("  " + (i + 1) + ". " + errors[i]);
    }
  } else {
    body.push("오류: 없음");
  }

  body.push("");
  body.push("이 메일은 자동 생성되었습니다.");

  GmailApp.sendEmail(ADMIN_EMAIL, subject, body.join("\n"));
  Logger.log("[Notifier] 일일 요약 발송 완료");
}
