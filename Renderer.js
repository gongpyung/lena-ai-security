// ============================================
// Renderer.gs - table 기반 HTML 이메일 템플릿 엔진
// LENA AI 보안 메일 자동화 v3.0
// ============================================

// === 색상 팔레트 (접근성 4.5:1 대비 준수) ===
var COLORS = {
  CRITICAL: { bg: "#fdecea", text: "#b71c1c", border: "#c62828" },
  HIGH:     { bg: "#fff3e0", text: "#e65100", border: "#ef6c00" },
  MEDIUM:   { bg: "#fff8e1", text: "#f57f17", border: "#f9a825" },
  LOW:      { bg: "#e8f5e9", text: "#1b5e20", border: "#2e7d32" },
  NONE:     { bg: "#f5f5f5", text: "#616161", border: "#9e9e9e" },
  UNKNOWN:  { bg: "#f5f5f5", text: "#616161", border: "#9e9e9e" }
};

var HEADER_COLORS = {
  Security: { bg: "#c62828", text: "#ffffff" },
  Release:  { bg: "#1565c0", text: "#ffffff" },
  Notice:   { bg: "#283593", text: "#ffffff" }
};

var VERDICT_COLORS = {
  REQUIRED:     { bg: "#fdecea", text: "#c62828", icon: "&#9888;" },
  RECOMMENDED:  { bg: "#fff8e1", text: "#e65100", icon: "&#9888;" },
  NOT_AFFECTED: { bg: "#e8f5e9", text: "#2e7d32", icon: "&#10004;" },
  UNDETERMINED: { bg: "#f5f5f5", text: "#757575", icon: "&#8211;" }
};

var VERDICT_LABELS = {
  REQUIRED: "필수 (직접 해당)",
  RECOMMENDED: "권장 (근접 버전)",
  NOT_AFFECTED: "해당 없음",
  UNDETERMINED: "판단 불가"
};

// ────────────────────────────────────────────────
// 1. renderEmailShell(innerContent)
// ────────────────────────────────────────────────
/**
 * 이메일 최외곽 HTML 뼈대
 * - Outlook용 MSO 조건부 주석 포함
 * - table 기반 센터링
 */
function renderEmailShell(innerContent) {
  return [
    '<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">',
    '<html xmlns="http://www.w3.org/1999/xhtml">',
    '<head>',
    '<meta charset="UTF-8" />',
    '<meta name="viewport" content="width=device-width, initial-scale=1.0" />',
    '<meta http-equiv="X-UA-Compatible" content="IE=edge" />',
    '<title>LENA Security Report</title>',
    '<!--[if mso]>',
    '<style type="text/css">',
    'table { border-collapse: collapse; }',
    'td { font-family: Arial, sans-serif; }',
    '.outlook-fallback { background-color: #ffffff; }',
    '</style>',
    '<![endif]-->',
    '</head>',
    '<body style="margin:0; padding:0; background-color:#f4f4f4; font-family:Arial,\'Malgun Gothic\',sans-serif;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f4f4f4;">',
    '<tr><td align="center" style="padding:20px 10px;">',
    '<!--[if mso]><table role="presentation" width="680" cellpadding="0" cellspacing="0" border="0" align="center"><tr><td><![endif]-->',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:680px; margin:0 auto; background-color:#ffffff; border:1px solid #e0e0e0;">',
    innerContent,
    '</table>',
    '<!--[if mso]></td></tr></table><![endif]-->',
    '</td></tr></table>',
    '</body>',
    '</html>'
  ].join('\n');
}

// ────────────────────────────────────────────────
// 2. renderHeader(reportTag, title)
// ────────────────────────────────────────────────
/**
 * 동적 색상 헤더 (Security=빨강, Release=파랑, Notice=남색)
 * table 기반, MSO 조건부 주석 포함
 */
function renderHeader(reportTag, title) {
  var hc = HEADER_COLORS[reportTag] || HEADER_COLORS.Notice;
  return [
    '<tr>',
    '<td style="padding:0;">',
    '<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:' + hc.bg + '; padding:25px 30px;"><![endif]-->',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<td style="background-color:' + hc.bg + '; padding:25px 30px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<td style="font-size:12px; color:' + hc.text + '; opacity:0.9; padding-bottom:6px; text-transform:uppercase; letter-spacing:1px;">',
    '&#9632; LENA Security Report - ' + escapeHtml(reportTag),
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="font-size:22px; font-weight:bold; color:' + hc.text + '; line-height:1.3;">',
    escapeHtml(title),
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    '<!--[if mso]></td></tr></table><![endif]-->',
    '</td>',
    '</tr>'
  ].join('\n');
}

// ────────────────────────────────────────────────
// 3. renderTlpBadge(tlpLevel)
// ────────────────────────────────────────────────
/**
 * TLP (Traffic Light Protocol) 등급 표시 배지
 * table 기반 인라인 배지, MSO fallback 포함
 */
function renderTlpBadge(tlpLevel) {
  var tlpColors = {
    "TLP:RED":    { bg: "#c62828", text: "#ffffff" },
    "TLP:AMBER":  { bg: "#ff8f00", text: "#000000" },
    "TLP:GREEN":  { bg: "#2e7d32", text: "#ffffff" },
    "TLP:CLEAR":  { bg: "#757575", text: "#ffffff" },
    "TLP:WHITE":  { bg: "#757575", text: "#ffffff" }
  };
  var tc = tlpColors[tlpLevel] || tlpColors["TLP:AMBER"];
  return [
    '<tr>',
    '<td style="padding:12px 30px 0 30px;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<!--[if mso]><td style="background-color:' + tc.bg + '; padding:4px 12px;"><![endif]-->',
    '<!--[if !mso]><!--><td style="background-color:' + tc.bg + '; padding:4px 12px;"><!--<![endif]-->',
    '<span style="color:' + tc.text + '; font-size:11px; font-weight:bold; letter-spacing:0.5px;">',
    escapeHtml(tlpLevel),
    '</span>',
    '</td>',
    '<td style="padding-left:8px; font-size:11px; color:#757575;">',
    escapeHtml(TLP_DESCRIPTION),
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>'
  ].join('\n');
}

// ────────────────────────────────────────────────
// 4. renderMetaInfo(analysisDate, originalFrom, originalDate)
// ────────────────────────────────────────────────
/**
 * 메타 정보 테이블 (분석 일시, 원본 발신자, 원본 발송일)
 * 2열 table 레이아웃, 인라인 스타일
 */
function renderMetaInfo(analysisDate, originalFrom, originalDate) {
  var formattedOrigDate = "";
  if (originalDate instanceof Date) {
    formattedOrigDate = Utilities.formatDate(originalDate, "Asia/Seoul", "yyyy-MM-dd HH:mm");
  } else {
    formattedOrigDate = String(originalDate || "-");
  }
  return [
    '<tr>',
    '<td style="padding:15px 30px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e0e0e0;">',
    '<tr>',
    '<td style="padding:8px 12px; font-size:12px; color:#757575; width:120px; border-bottom:1px solid #f0f0f0;">분석 일시</td>',
    '<td style="padding:8px 12px; font-size:13px; color:#333; border-bottom:1px solid #f0f0f0;">' + escapeHtml(analysisDate) + '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:8px 12px; font-size:12px; color:#757575; width:120px; border-bottom:1px solid #f0f0f0;">원본 발신자</td>',
    '<td style="padding:8px 12px; font-size:13px; color:#333; border-bottom:1px solid #f0f0f0;">' + escapeHtml(originalFrom || "-") + '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:8px 12px; font-size:12px; color:#757575; width:120px;">원본 발송일</td>',
    '<td style="padding:8px 12px; font-size:13px; color:#333;">' + escapeHtml(formattedOrigDate) + '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>'
  ].join('\n');
}

// ────────────────────────────────────────────────
// 5. renderExecutiveSummary(summary, riskLevel, immediateAction)
// ────────────────────────────────────────────────
/**
 * 경영진 요약 섹션
 * 위험도 배지 + 즉각 조치 필요 여부 + 요약 텍스트
 * table 기반, MSO 조건부 주석 포함
 */
function renderExecutiveSummary(summary, riskLevel, immediateAction) {
  var rc = COLORS[riskLevel] || COLORS.UNKNOWN;
  var actionHtml = '';
  if (immediateAction) {
    actionHtml = [
      '<tr>',
      '<td style="padding:10px 0 0 0;">',
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0">',
      '<tr>',
      '<!--[if mso]><td style="background-color:#c62828; padding:6px 14px;"><![endif]-->',
      '<!--[if !mso]><!--><td style="background-color:#c62828; padding:6px 14px;"><!--<![endif]-->',
      '<span style="color:#ffffff; font-size:12px; font-weight:bold;">&#9888; 즉각 조치 필요</span>',
      '</td>',
      '</tr>',
      '</table>',
      '</td>',
      '</tr>'
    ].join('\n');
  }
  return [
    '<tr>',
    '<td style="padding:20px 30px;">',
    '<!-- Executive Summary -->',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<td style="font-size:16px; font-weight:bold; color:#333; padding-bottom:12px;">',
    '&#128196; Executive Summary',
    '</td>',
    '</tr>',
    '<tr>',
    '<td>',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin-bottom:10px;">',
    '<tr>',
    '<!--[if mso]><td style="background-color:' + rc.bg + '; border-left:4px solid ' + rc.border + '; padding:4px 12px;"><![endif]-->',
    '<!--[if !mso]><!--><td style="background-color:' + rc.bg + '; border-left:4px solid ' + rc.border + '; padding:4px 12px;"><!--<![endif]-->',
    '<span style="color:' + rc.text + '; font-size:13px; font-weight:bold;">',
    'Overall Risk: ' + escapeHtml(riskLevel),
    '</span>',
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="font-size:14px; color:#333; line-height:1.6;">',
    escapeHtml(summary),
    '</td>',
    '</tr>',
    actionHtml,
    '</table>',
    '</td>',
    '</tr>'
  ].join('\n');
}

// ────────────────────────────────────────────────
// 6. renderCveSeverityTable(cveList)
// ────────────────────────────────────────────────
/**
 * CVE 심각도 테이블 렌더링
 * - Critical -> Low 순서로 정렬
 * - 심각도별 색상 코딩
 * - NVD 링크 포함
 */
function renderCveSeverityTable(cveList) {
  if (!cveList || cveList.length === 0) return '';

  var severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4, UNKNOWN: 5 };
  var sorted = cveList.slice().sort(function(a, b) {
    var orderA = a.cvssSeverity in severityOrder ? severityOrder[a.cvssSeverity] : 5;
    var orderB = b.cvssSeverity in severityOrder ? severityOrder[b.cvssSeverity] : 5;
    return orderA - orderB;
  });

  var rows = '';
  for (var i = 0; i < sorted.length; i++) {
    var cve = sorted[i];
    var colors = COLORS[cve.cvssSeverity] || COLORS.UNKNOWN;
    var scoreDisplay = cve.cvssScore >= 0 ? cve.cvssScore.toFixed(1) : '-';
    var exploitLabel = {
      KNOWN_EXPLOIT: "확인됨",
      POC_EXISTS: "PoC 존재",
      NO_KNOWN_EXPLOIT: "없음",
      UNKNOWN: "-"
    }[cve.exploitExists] || "-";

    rows += [
      '<tr>',
      '<td style="padding:8px 12px; border-bottom:1px solid #e0e0e0; font-size:13px;">',
      '<a href="' + escapeHtml(cve.nvdUrl) + '" style="color:#1a73e8; text-decoration:none;">' + escapeHtml(cve.cveId) + '</a>',
      '</td>',
      '<td style="padding:8px 12px; border-bottom:1px solid #e0e0e0; font-size:13px;">',
      escapeHtml(cve.title),
      '</td>',
      '<td style="padding:8px 12px; border-bottom:1px solid #e0e0e0; text-align:center;">',
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">',
      '<tr><td style="background-color:' + colors.bg + '; color:' + colors.text + '; font-weight:bold; font-size:12px; padding:2px 8px; text-align:center;">',
      scoreDisplay + ' ' + cve.cvssSeverity,
      '</td></tr></table>',
      '</td>',
      '<td style="padding:8px 12px; border-bottom:1px solid #e0e0e0; font-size:13px; text-align:center;">',
      cve.patchAvailable ? '&#10004; 가용' : '&#10008; 미가용',
      '</td>',
      '<td style="padding:8px 12px; border-bottom:1px solid #e0e0e0; font-size:13px; text-align:center;">',
      exploitLabel,
      '</td>',
      '</tr>'
    ].join('');
  }

  return [
    '<tr><td style="padding:0 30px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e0e0e0; margin-top:15px;">',
    '<tr style="background-color:#f8f9fa;">',
    '<th style="padding:10px 12px; text-align:left; font-size:12px; color:#555; border-bottom:2px solid #e0e0e0; width:160px;">CVE ID</th>',
    '<th style="padding:10px 12px; text-align:left; font-size:12px; color:#555; border-bottom:2px solid #e0e0e0;">취약점명</th>',
    '<th style="padding:10px 12px; text-align:center; font-size:12px; color:#555; border-bottom:2px solid #e0e0e0; width:120px;">CVSS / 심각도</th>',
    '<th style="padding:10px 12px; text-align:center; font-size:12px; color:#555; border-bottom:2px solid #e0e0e0; width:80px;">패치</th>',
    '<th style="padding:10px 12px; text-align:center; font-size:12px; color:#555; border-bottom:2px solid #e0e0e0; width:80px;">익스플로잇</th>',
    '</tr>',
    rows,
    '</table>',
    '</td></tr>'
  ].join('');
}

// ────────────────────────────────────────────────
// 7. renderTechnicalDetails(technicalSummary, cveList)
// ────────────────────────────────────────────────
/**
 * 기술 상세 분석 섹션
 * 기술 요약 텍스트 + CVE별 상세 카드 (table 기반)
 * MSO 조건부 주석 포함
 */
function renderTechnicalDetails(technicalSummary, cveList) {
  var cveCards = '';
  if (cveList && cveList.length > 0) {
    for (var i = 0; i < cveList.length; i++) {
      var cve = cveList[i];
      var colors = COLORS[cve.cvssSeverity] || COLORS.UNKNOWN;
      cveCards += [
        '<tr>',
        '<td style="padding:10px 0;">',
        '<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e0e0e0;"><tr><td style="padding:12px;"><![endif]-->',
        '<!--[if !mso]><!--><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e0e0e0;">',
        '<tr><td style="padding:12px;"><!--<![endif]-->',
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
        // CVE 제목 행
        '<tr>',
        '<td style="font-size:14px; font-weight:bold; color:#333; padding-bottom:8px;">',
        '<a href="' + escapeHtml(cve.nvdUrl) + '" style="color:#1a73e8; text-decoration:none;">' + escapeHtml(cve.cveId) + '</a>',
        ' - ' + escapeHtml(cve.title),
        '</td>',
        '</tr>',
        // 설명 행
        '<tr>',
        '<td style="font-size:13px; color:#555; line-height:1.5; padding-bottom:10px;">',
        escapeHtml(cve.description),
        '</td>',
        '</tr>',
        // 메타 정보 테이블
        '<tr><td>',
        '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="font-size:12px;">',
        '<tr>',
        '<td style="padding:4px 0; color:#757575; width:120px;">CVSS 점수</td>',
        '<td style="padding:4px 0; color:' + colors.text + '; font-weight:bold;">',
        (cve.cvssScore >= 0 ? cve.cvssScore.toFixed(1) : '-') + ' (' + cve.cvssSeverity + ')',
        '</td>',
        '</tr>',
        '<tr>',
        '<td style="padding:4px 0; color:#757575;">CVSS 벡터</td>',
        '<td style="padding:4px 0; color:#333; font-size:11px;">' + escapeHtml(cve.cvssVector || "-") + '</td>',
        '</tr>',
        '<tr>',
        '<td style="padding:4px 0; color:#757575;">영향 범위</td>',
        '<td style="padding:4px 0; color:#333;">' + escapeHtml(cve.affectedVersions) + '</td>',
        '</tr>',
        '<tr>',
        '<td style="padding:4px 0; color:#757575;">수정 버전</td>',
        '<td style="padding:4px 0; color:#333;">' + escapeHtml(cve.fixedVersion) + '</td>',
        '</tr>',
        '<tr>',
        '<td style="padding:4px 0; color:#757575;">패치 가용</td>',
        '<td style="padding:4px 0; color:#333;">' + (cve.patchAvailable ? '&#10004; 가용' : '&#10008; 미가용') + '</td>',
        '</tr>',
        '<tr>',
        '<td style="padding:4px 0; color:#757575;">익스플로잇</td>',
        '<td style="padding:4px 0; color:#333;">',
        ({ KNOWN_EXPLOIT: "&#9888; 확인됨", POC_EXISTS: "&#9888; PoC 존재", NO_KNOWN_EXPLOIT: "없음", UNKNOWN: "-" }[cve.exploitExists] || "-"),
        '</td>',
        '</tr>',
        '</table>',
        '</td></tr>',
        '</table>',
        '</td></tr></table>',
        '<!--[if mso]></td></tr></table><![endif]-->',
        '</td>',
        '</tr>'
      ].join('\n');
    }
  }

  return [
    '<tr>',
    '<td style="padding:20px 30px;">',
    '<!-- Technical Details -->',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<td style="font-size:16px; font-weight:bold; color:#333; padding-bottom:12px; border-bottom:2px solid #e0e0e0;">',
    '&#128269; Technical Details',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="font-size:13px; color:#333; line-height:1.6; padding:12px 0;">',
    escapeHtml(technicalSummary),
    '</td>',
    '</tr>',
    cveCards,
    '</table>',
    '</td>',
    '</tr>'
  ].join('\n');
}

// ────────────────────────────────────────────────
// 8. renderImpactAndGuide(impactAnalysis, actionGuide, downloadLinks)
// ────────────────────────────────────────────────
/**
 * 영향 분석 + 조치 가이드 + 다운로드 링크
 * 번호 매긴 조치 목록은 table 기반 리스트로 구현 (ol 대체)
 */
function renderImpactAndGuide(impactAnalysis, actionGuide, downloadLinks) {
  // 조치 가이드 행 생성 (table 기반 번호 리스트)
  var guideRows = '';
  if (actionGuide && actionGuide.length > 0) {
    for (var i = 0; i < actionGuide.length; i++) {
      guideRows += [
        '<tr>',
        '<td style="padding:4px 8px 4px 0; font-size:13px; color:#1565c0; font-weight:bold; vertical-align:top; width:24px;" valign="top">',
        (i + 1) + '.',
        '</td>',
        '<td style="padding:4px 0; font-size:13px; color:#333; line-height:1.5;">',
        escapeHtml(actionGuide[i]),
        '</td>',
        '</tr>'
      ].join('');
    }
  }

  // 다운로드 링크 행 생성
  var linkRows = '';
  if (downloadLinks && downloadLinks.length > 0) {
    for (var j = 0; j < downloadLinks.length; j++) {
      var link = downloadLinks[j];
      linkRows += [
        '<tr>',
        '<td style="padding:3px 0; font-size:13px;">',
        '&#128279; <a href="' + escapeHtml(link.url) + '" style="color:#1a73e8; text-decoration:none;">' + escapeHtml(link.label) + '</a>',
        '</td>',
        '</tr>'
      ].join('');
    }
  }

  return [
    '<tr>',
    '<td style="padding:20px 30px;">',
    '<!-- Impact & Action Guide -->',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    // 영향 분석
    '<tr>',
    '<td style="font-size:16px; font-weight:bold; color:#333; padding-bottom:10px;">',
    '&#9888; 영향 분석 및 조치 가이드',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="font-size:13px; color:#333; line-height:1.6; padding-bottom:15px;">',
    escapeHtml(impactAnalysis),
    '</td>',
    '</tr>',
    // 조치 가이드
    '<tr>',
    '<td style="font-size:14px; font-weight:bold; color:#333; padding-bottom:8px;">권장 조치</td>',
    '</tr>',
    '<tr>',
    '<td style="padding-bottom:15px;">',
    '<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f9fa; padding:12px;"><![endif]-->',
    '<!--[if !mso]><!--><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8f9fa; padding:12px;"><!--<![endif]-->',
    guideRows,
    '</table>',
    '</td>',
    '</tr>',
    // 다운로드 링크
    linkRows ? '<tr><td style="font-size:14px; font-weight:bold; color:#333; padding-bottom:8px;">참고 링크</td></tr>' : '',
    linkRows ? '<tr><td><table role="presentation" cellpadding="0" cellspacing="0" border="0">' + linkRows + '</table></td></tr>' : '',
    '</table>',
    '</td>',
    '</tr>'
  ].join('\n');
}

// ────────────────────────────────────────────────
// 9. renderVersionAnalysis(versionAnalysisList)
// ────────────────────────────────────────────────
/**
 * 버전 영향도 분석 테이블
 * 업데이트 판단별 색상 코딩 (REQUIRED=빨강, RECOMMENDED=주황, NOT_AFFECTED=초록)
 * table 기반, MSO 조건부 주석 포함
 */
function renderVersionAnalysis(versionAnalysisList) {
  if (!versionAnalysisList || versionAnalysisList.length === 0) return '';

  var rows = '';
  for (var i = 0; i < versionAnalysisList.length; i++) {
    var va = versionAnalysisList[i];
    var vc = VERDICT_COLORS[va.updateVerdict] || VERDICT_COLORS.UNDETERMINED;
    var verdictLabel = VERDICT_LABELS[va.updateVerdict] || va.updateVerdict;

    rows += [
      '<tr>',
      '<td style="padding:8px 12px; border-bottom:1px solid #e0e0e0; font-size:13px; font-weight:bold;">' + escapeHtml(va.productName) + '</td>',
      '<td style="padding:8px 12px; border-bottom:1px solid #e0e0e0; font-size:12px;">' + escapeHtml(va.lenaVersions) + '</td>',
      '<td style="padding:8px 12px; border-bottom:1px solid #e0e0e0; font-size:12px;">' + escapeHtml(va.mailMentionedVersions) + '</td>',
      '<td style="padding:8px 12px; border-bottom:1px solid #e0e0e0; text-align:center;">',
      '<!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="background-color:' + vc.bg + '; padding:3px 10px;"><![endif]-->',
      '<!--[if !mso]><!--><table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;"><tr><td style="background-color:' + vc.bg + '; padding:3px 10px;"><!--<![endif]-->',
      '<span style="color:' + vc.text + '; font-size:12px; font-weight:bold;">' + vc.icon + ' ' + escapeHtml(verdictLabel) + '</span>',
      '</td></tr></table>',
      '</td>',
      '</tr>',
      // 판단 근거 행
      '<tr>',
      '<td colspan="4" style="padding:4px 12px 12px 12px; border-bottom:2px solid #e0e0e0; font-size:12px; color:#757575; line-height:1.4;">',
      '&#8627; ' + escapeHtml(va.updateVerdictReason),
      '</td>',
      '</tr>'
    ].join('');
  }

  return [
    '<tr>',
    '<td style="padding:20px 30px;">',
    '<!-- Version Analysis -->',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<td style="font-size:16px; font-weight:bold; color:#333; padding-bottom:12px;">',
    '&#128202; LENA 버전 영향도 분석',
    '</td>',
    '</tr>',
    '<tr>',
    '<td>',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e0e0e0;">',
    '<tr style="background-color:#f8f9fa;">',
    '<th style="padding:10px 12px; text-align:left; font-size:12px; color:#555; border-bottom:2px solid #e0e0e0; width:140px;">제품</th>',
    '<th style="padding:10px 12px; text-align:left; font-size:12px; color:#555; border-bottom:2px solid #e0e0e0;">LENA 버전</th>',
    '<th style="padding:10px 12px; text-align:left; font-size:12px; color:#555; border-bottom:2px solid #e0e0e0;">메일 언급 버전</th>',
    '<th style="padding:10px 12px; text-align:center; font-size:12px; color:#555; border-bottom:2px solid #e0e0e0; width:140px;">업데이트 판단</th>',
    '</tr>',
    rows,
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>'
  ].join('\n');
}

// ────────────────────────────────────────────────
// 10. renderOriginalMail(originalBody, metadata)
// ────────────────────────────────────────────────
/**
 * 원본 메일 내용 (접히는 영역 대신 table 기반 박스)
 * Outlook에서 details/summary 미지원이므로 항상 펼침 상태로 렌더링
 * 긴 본문은 2000자로 자르고 "..." 표시
 */
function renderOriginalMail(originalBody, metadata) {
  var subject = (metadata && metadata.originalSubject) ? metadata.originalSubject : "-";
  var from = (metadata && metadata.originalFrom) ? metadata.originalFrom : "-";
  var bodyText = originalBody || "";
  if (bodyText.length > 2000) {
    bodyText = bodyText.substring(0, 2000) + "\n\n... (이하 생략, 원본 메일 참조)";
  }

  return [
    '<tr>',
    '<td style="padding:20px 30px;">',
    '<!-- Original Mail -->',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<td style="font-size:14px; font-weight:bold; color:#757575; padding-bottom:8px;">',
    '&#128233; 원본 메일',
    '</td>',
    '</tr>',
    '<tr>',
    '<td>',
    '<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafafa; border:1px solid #e0e0e0;"><tr><td style="padding:15px;"><![endif]-->',
    '<!--[if !mso]><!--><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fafafa; border:1px solid #e0e0e0;">',
    '<tr><td style="padding:15px;"><!--<![endif]-->',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<td style="font-size:12px; color:#757575; padding-bottom:3px;">From: ' + escapeHtml(from) + '</td>',
    '</tr>',
    '<tr>',
    '<td style="font-size:12px; color:#757575; padding-bottom:10px; border-bottom:1px solid #e0e0e0;">Subject: ' + escapeHtml(subject) + '</td>',
    '</tr>',
    '<tr>',
    '<td style="font-size:12px; color:#555; line-height:1.5; padding-top:10px; white-space:pre-wrap; word-break:break-word;">',
    escapeHtml(bodyText),
    '</td>',
    '</tr>',
    '</table>',
    '</td></tr></table>',
    '<!--[if mso]></td></tr></table><![endif]-->',
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>'
  ].join('\n');
}

// ────────────────────────────────────────────────
// 11. renderFooter(disclaimer, contactEmail)
// ────────────────────────────────────────────────
/**
 * 푸터 - 면책 문구 + 연락처 + TLP 안내
 * table 기반, 인라인 스타일
 */
function renderFooter(disclaimer, contactEmail) {
  return [
    '<tr>',
    '<td style="padding:0;">',
    '<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#f8f9fa; padding:20px 30px; border-top:2px solid #e0e0e0;"><![endif]-->',
    '<!--[if !mso]><!--><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr><td style="background-color:#f8f9fa; padding:20px 30px; border-top:2px solid #e0e0e0;"><!--<![endif]-->',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<td style="font-size:11px; color:#999; line-height:1.5; padding-bottom:8px;">',
    escapeHtml(disclaimer),
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="font-size:11px; color:#999; padding-bottom:8px;">',
    '문의: <a href="mailto:' + escapeHtml(contactEmail) + '" style="color:#1a73e8; text-decoration:none;">' + escapeHtml(contactEmail) + '</a>',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="font-size:10px; color:#bbb;">',
    'Powered by LENA AI Security Assistant v3.0 | Gemini API',
    '</td>',
    '</tr>',
    '</table>',
    '</td></tr></table>',
    '<!--[if mso]></td></tr></table><![endif]-->',
    '</td>',
    '</tr>'
  ].join('\n');
}

// ────────────────────────────────────────────────
// 12. renderSingleReport(analysisResult)
// ────────────────────────────────────────────────
/**
 * 단일 메일 분석 결과를 완전한 HTML 섹션으로 조립
 * Reporter.gs의 renderProductSection()에서 제품별 개별 보고서 렌더링 시 사용
 */
function renderSingleReport(analysisResult) {
  var r = analysisResult;
  var meta = r._metadata || {};
  var analysisTime = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm");

  var html = '';
  html += renderHeader(r.reportTag, r.reportTitle);
  html += renderTlpBadge(TLP_LEVEL);
  html += renderMetaInfo(analysisTime, meta.originalFrom, meta.originalDate);
  html += renderExecutiveSummary(r.executiveSummary, r.overallRiskLevel, r.immediateActionRequired);
  html += renderCveSeverityTable(r.cveList);
  html += renderTechnicalDetails(r.technicalSummary, r.cveList);
  html += renderImpactAndGuide(r.impactAnalysis, r.actionGuide, r.downloadLinks);
  html += renderVersionAnalysis(r.versionAnalysis);
  html += renderOriginalMail(meta.originalBody, meta);
  html += renderFooter(DISCLAIMER, CONTACT_EMAIL);

  return html;
}

// ────────────────────────────────────────────────
// 13. escapeHtml(text)
// ────────────────────────────────────────────────
/**
 * XSS 방지 HTML 이스케이프
 */
function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}
