// ============================================
// Reporter.gs - Daily Digest 통합 보고서 조립
// LENA AI 보안 메일 자동화 v3.0
// ============================================

/**
 * Daily Digest 통합 보고서 생성
 * @param {Object} allResults - { productKey: Array<analysisResult> }
 * @param {Date} reportDate - 보고서 날짜
 * @returns {Object} { subject: string, htmlBody: string }
 */
function buildDailyDigest(allResults, reportDate) {
  var dateStr = Utilities.formatDate(reportDate, "Asia/Seoul", "yyyy-MM-dd");
  var analysisTime = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm");

  // 1. 전체 통계 집계
  var stats = aggregateStats(allResults);

  // 2. 제목 생성
  var subject = buildDigestSubject(dateStr, stats);

  // 3. HTML 조립
  var innerHtml = '';

  // 3.1 헤더
  innerHtml += renderDigestHeader(dateStr, stats);

  // 3.2 TLP 배지
  innerHtml += renderTlpBadge(TLP_LEVEL);

  // 3.3 메타 정보
  innerHtml += renderDigestMeta(analysisTime, stats);

  // 3.4 Executive Summary (전체)
  innerHtml += renderDigestExecutiveSummary(allResults, stats);

  // 3.5 CVE 종합 테이블 (전 제품 통합, 심각도순)
  innerHtml += renderDigestCveTable(allResults);

  // 3.6 제품별 상세 분석 (Technical Details)
  for (var key in allResults) {
    var productResults = allResults[key];
    if (productResults.length > 0) {
      innerHtml += renderProductSection(key, productResults);
    }
  }

  // 3.7 버전 영향도 종합 테이블
  innerHtml += renderDigestVersionSummary(allResults);

  // 3.8 원본 메일 목록 (축약)
  innerHtml += renderOriginalMailList(allResults);

  // 3.9 푸터
  innerHtml += renderFooter(DISCLAIMER, CONTACT_EMAIL);

  var htmlBody = renderEmailShell(innerHtml);

  return {
    subject: subject,
    htmlBody: htmlBody
  };
}

// ────────────────────────────────────────────────
// Digest 전용 렌더링 함수
// ────────────────────────────────────────────────

/**
 * Digest 전용 헤더 (전체 통계 포함)
 */
function renderDigestHeader(dateStr, stats) {
  var bgColor = "#1a237e";  // Digest 고유 남색 헤더
  if (stats.criticalCount > 0) bgColor = "#b71c1c";  // Critical 있으면 빨강
  else if (stats.highCount > 0) bgColor = "#e65100";  // High 있으면 주황

  return [
    '<tr>',
    '<td style="padding:0;">',
    '<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:' + bgColor + '; padding:25px 30px;"><![endif]-->',
    '<!--[if !mso]><!--><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr><td style="background-color:' + bgColor + '; padding:25px 30px;"><!--<![endif]-->',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<td style="font-size:12px; color:#ffffff; padding-bottom:6px; letter-spacing:1px;">',
    '&#9632; LENA SECURITY DAILY DIGEST',
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="font-size:22px; font-weight:bold; color:#ffffff; line-height:1.3; padding-bottom:15px;">',
    escapeHtml(dateStr) + ' 보안 종합 보고서',
    '</td>',
    '</tr>',
    '<tr>',
    '<td>',
    // 통계 뱃지 테이블
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    // 메일 수
    '<td style="padding-right:8px;">',
    '<!--[if mso]><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:rgba(255,255,255,0.2); padding:4px 10px;"><![endif]-->',
    '<!--[if !mso]><!--><table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:rgba(255,255,255,0.2); padding:4px 10px;"><!--<![endif]-->',
    '<span style="color:#ffffff; font-size:12px;">&#128233; ' + stats.totalMails + ' Advisories</span>',
    '</td></tr></table>',
    '</td>',
    // CVE 수
    '<td style="padding-right:8px;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:rgba(255,255,255,0.2); padding:4px 10px;">',
    '<span style="color:#ffffff; font-size:12px;">&#128274; ' + stats.totalCves + ' CVEs</span>',
    '</td></tr></table>',
    '</td>',
    // Critical 수 (0이 아닐 때만)
    stats.criticalCount > 0 ? [
      '<td style="padding-right:8px;">',
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#c62828; padding:4px 10px;">',
      '<span style="color:#ffffff; font-size:12px; font-weight:bold;">&#9888; CRITICAL ' + stats.criticalCount + '</span>',
      '</td></tr></table>',
      '</td>'
    ].join('') : '',
    // 필수 업데이트 수 (0이 아닐 때만)
    stats.requiredUpdates > 0 ? [
      '<td>',
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0"><tr><td style="background-color:#ff8f00; padding:4px 10px;">',
      '<span style="color:#000000; font-size:12px; font-weight:bold;">&#9888; 필수 업데이트 ' + stats.requiredUpdates + '</span>',
      '</td></tr></table>',
      '</td>'
    ].join('') : '',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    '</td></tr></table>',
    '<!--[if mso]></td></tr></table><![endif]-->',
    '</td>',
    '</tr>'
  ].join('\n');
}

/**
 * Digest 메타 정보
 */
function renderDigestMeta(analysisTime, stats) {
  var productCount = Object.keys(PRODUCTS).length;
  return [
    '<tr>',
    '<td style="padding:15px 30px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e0e0e0;">',
    '<tr>',
    '<td style="padding:8px 12px; font-size:12px; color:#757575; width:120px; border-bottom:1px solid #f0f0f0;">분석 시각</td>',
    '<td style="padding:8px 12px; font-size:13px; color:#333; border-bottom:1px solid #f0f0f0;">' + escapeHtml(analysisTime) + '</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:8px 12px; font-size:12px; color:#757575; width:120px; border-bottom:1px solid #f0f0f0;">모니터링 대상</td>',
    '<td style="padding:8px 12px; font-size:13px; color:#333; border-bottom:1px solid #f0f0f0;">' + productCount + '개 제품 (' + Object.keys(PRODUCTS).join(', ') + ')</td>',
    '</tr>',
    '<tr>',
    '<td style="padding:8px 12px; font-size:12px; color:#757575; width:120px;">분석 엔진</td>',
    '<td style="padding:8px 12px; font-size:13px; color:#333;">' + escapeHtml(MODEL_LIST[0]) + ' (Structured Output)</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>'
  ].join('\n');
}

/**
 * Digest Executive Summary (전체 제품 통합 요약)
 */
function renderDigestExecutiveSummary(allResults, stats) {
  var rc = COLORS[stats.highestRisk] || COLORS.UNKNOWN;

  // 제품별 요약을 합산
  var summaryRows = '';
  for (var key in allResults) {
    var results = allResults[key];
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      var tagColor = HEADER_COLORS[r.reportTag] || HEADER_COLORS.Notice;
      summaryRows += [
        '<tr>',
        '<td style="padding:6px 0; font-size:13px; line-height:1.5;">',
        '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="display:inline;">',
        '<tr><td style="background-color:' + tagColor.bg + '; padding:1px 6px; font-size:11px; color:' + tagColor.text + '; font-weight:bold;">' + escapeHtml(r.reportTag) + '</td></tr>',
        '</table>',
        ' <strong>' + escapeHtml(r.productName) + '</strong>: ' + escapeHtml(r.executiveSummary),
        '</td>',
        '</tr>'
      ].join('');
    }
  }

  return [
    '<tr>',
    '<td style="padding:20px 30px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<td style="font-size:16px; font-weight:bold; color:#333; padding-bottom:12px;">',
    '&#128196; Executive Summary',
    '</td>',
    '</tr>',
    // 전체 위험도 배지
    '<tr>',
    '<td style="padding-bottom:12px;">',
    '<table role="presentation" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<!--[if mso]><td style="background-color:' + rc.bg + '; border-left:4px solid ' + rc.border + '; padding:6px 14px;"><![endif]-->',
    '<!--[if !mso]><!--><td style="background-color:' + rc.bg + '; border-left:4px solid ' + rc.border + '; padding:6px 14px;"><!--<![endif]-->',
    '<span style="color:' + rc.text + '; font-size:14px; font-weight:bold;">',
    'Overall Risk: ' + escapeHtml(stats.highestRisk),
    '</span>',
    '<span style="color:#757575; font-size:12px; padding-left:12px;">',
    'CVE ' + stats.totalCves + '건 | Critical ' + stats.criticalCount + '건 | High ' + stats.highCount + '건 | 필수 업데이트 ' + stats.requiredUpdates + '건',
    '</span>',
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>',
    // 제품별 요약 목록
    '<tr>',
    '<td>',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    summaryRows,
    '</table>',
    '</td>',
    '</tr>',
    '</table>',
    '</td>',
    '</tr>'
  ].join('\n');
}

/**
 * Digest CVE 종합 테이블
 */
function renderDigestCveTable(allResults) {
  var allCves = [];
  var seenCveIds = {};
  for (var key in allResults) {
    var results = allResults[key];
    for (var i = 0; i < results.length; i++) {
      var r = results[i];
      if (r.cveList) {
        for (var j = 0; j < r.cveList.length; j++) {
          var cve = r.cveList[j];
          if (!seenCveIds[cve.cveId]) {
            seenCveIds[cve.cveId] = true;
            allCves.push({
              cve: cve,
              productName: r.productName
            });
          }
        }
      }
    }
  }

  if (allCves.length === 0) return '';

  var severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3, NONE: 4, UNKNOWN: 5 };
  allCves.sort(function(a, b) {
    return (severityOrder[a.cve.cvssSeverity] || 5) - (severityOrder[b.cve.cvssSeverity] || 5);
  });

  var rows = '';
  for (var k = 0; k < allCves.length; k++) {
    var item = allCves[k];
    var c = item.cve;
    var colors = COLORS[c.cvssSeverity] || COLORS.UNKNOWN;
    var scoreDisplay = c.cvssScore >= 0 ? c.cvssScore.toFixed(1) : '-';

    rows += [
      '<tr>',
      '<td style="padding:8px 12px; border-bottom:1px solid #e0e0e0; font-size:12px; color:#555;">' + escapeHtml(item.productName) + '</td>',
      '<td style="padding:8px 12px; border-bottom:1px solid #e0e0e0; font-size:13px;">',
      '<a href="' + escapeHtml(c.nvdUrl) + '" style="color:#1a73e8; text-decoration:none;">' + escapeHtml(c.cveId) + '</a>',
      '</td>',
      '<td style="padding:8px 12px; border-bottom:1px solid #e0e0e0; font-size:13px;">' + escapeHtml(c.title) + '</td>',
      '<td style="padding:8px 12px; border-bottom:1px solid #e0e0e0; text-align:center;">',
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">',
      '<tr><td style="background-color:' + colors.bg + '; color:' + colors.text + '; font-weight:bold; font-size:12px; padding:2px 8px;">',
      (c.cvssSeverity === 'UNKNOWN' ? '미공개' : scoreDisplay + ' ' + c.cvssSeverity),
      '</td></tr></table>',
      '</td>',
      '<td style="padding:8px 12px; border-bottom:1px solid #e0e0e0; font-size:12px; text-align:center;">',
      c.patchAvailable ? '&#10004;' : '&#10008;',
      '</td>',
      '</tr>'
    ].join('');
  }

  return [
    '<tr>',
    '<td style="padding:15px 30px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr><td style="font-size:16px; font-weight:bold; color:#333; padding-bottom:10px;">&#128274; CVE 종합 현황 (' + allCves.length + '건)</td></tr>',
    '<tr><td>',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e0e0e0;">',
    '<tr style="background-color:#f8f9fa;">',
    '<th style="padding:10px 12px; text-align:left; font-size:12px; color:#555; border-bottom:2px solid #e0e0e0; width:100px;">제품</th>',
    '<th style="padding:10px 12px; text-align:left; font-size:12px; color:#555; border-bottom:2px solid #e0e0e0; width:150px;">CVE ID</th>',
    '<th style="padding:10px 12px; text-align:left; font-size:12px; color:#555; border-bottom:2px solid #e0e0e0;">취약점명</th>',
    '<th style="padding:10px 12px; text-align:center; font-size:12px; color:#555; border-bottom:2px solid #e0e0e0; width:120px;">CVSS</th>',
    '<th style="padding:10px 12px; text-align:center; font-size:12px; color:#555; border-bottom:2px solid #e0e0e0; width:50px;">패치</th>',
    '</tr>',
    rows,
    '</table>',
    '</td></tr>',
    '</table>',
    '</td>',
    '</tr>'
  ].join('\n');
}

/**
 * 제품별 상세 섹션 (Technical Details)
 */
function renderProductSection(productKey, productResults) {
  var productName = PRODUCTS[productKey] ? PRODUCTS[productKey].name : productKey;

  var sectionHtml = '';

  // 제품 구분 헤더
  sectionHtml += [
    '<tr>',
    '<td style="padding:20px 30px 0 30px;">',
    '<!--[if mso]><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr><td style="border-top:3px solid #1565c0; padding-top:15px;"><![endif]-->',
    '<!--[if !mso]><!--><table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr><td style="border-top:3px solid #1565c0; padding-top:15px;"><!--<![endif]-->',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr>',
    '<td style="font-size:18px; font-weight:bold; color:#1565c0; padding-bottom:5px;">',
    escapeHtml(productName),
    '</td>',
    '</tr>',
    '<tr>',
    '<td style="font-size:12px; color:#757575;">',
    productResults.length + '건의 보안 공지 분석',
    '</td>',
    '</tr>',
    '</table>',
    '</td></tr></table>',
    '<!--[if mso]></td></tr></table><![endif]-->',
    '</td>',
    '</tr>'
  ].join('\n');

  // 제품 내 개별 분석 결과
  for (var i = 0; i < productResults.length; i++) {
    var r = productResults[i];
    var meta = r._metadata || {};

    var tagColor = HEADER_COLORS[r.reportTag] || HEADER_COLORS.Notice;
    sectionHtml += [
      '<tr>',
      '<td style="padding:15px 30px 0 30px;">',
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
      '<tr>',
      '<td style="padding-bottom:8px;">',
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0">',
      '<tr>',
      '<td style="background-color:' + tagColor.bg + '; padding:2px 8px;">',
      '<span style="color:' + tagColor.text + '; font-size:11px; font-weight:bold;">' + escapeHtml(r.reportTag) + '</span>',
      '</td>',
      '<td style="padding-left:8px; font-size:14px; font-weight:bold; color:#333;">',
      escapeHtml(r.reportTitle),
      '</td>',
      '</tr>',
      '</table>',
      '</td>',
      '</tr>',
      '</table>',
      '</td>',
      '</tr>'
    ].join('\n');

    // Technical Details
    sectionHtml += renderTechnicalDetails(r.technicalSummary, r.cveList);

    // Impact & Guide
    sectionHtml += renderImpactAndGuide(r.impactAnalysis, r.actionGuide, r.downloadLinks);

    // Version Analysis
    sectionHtml += renderVersionAnalysis(r.versionAnalysis);
  }

  return sectionHtml;
}

/**
 * Digest 버전 영향도 종합 테이블
 */
function renderDigestVersionSummary(allResults) {
  // 제품이 1개뿐이면 제품별 섹션에서 이미 표시되므로 종합 테이블 생략
  var productCount = 0;
  for (var k in allResults) {
    if (allResults[k].length > 0) productCount++;
  }
  if (productCount <= 1) return '';

  var allVersions = [];
  for (var key in allResults) {
    var results = allResults[key];
    for (var i = 0; i < results.length; i++) {
      if (results[i].versionAnalysis) {
        for (var v = 0; v < results[i].versionAnalysis.length; v++) {
          allVersions.push(results[i].versionAnalysis[v]);
        }
      }
    }
  }

  if (allVersions.length === 0) return '';

  var verdictOrder = { REQUIRED: 0, RECOMMENDED: 1, UNDETERMINED: 2, NOT_AFFECTED: 3 };
  allVersions.sort(function(a, b) {
    return (verdictOrder[a.updateVerdict] || 3) - (verdictOrder[b.updateVerdict] || 3);
  });

  return renderVersionAnalysis(allVersions);
}

/**
 * 원본 메일 목록 (축약형, Digest용)
 */
function renderOriginalMailList(allResults) {
  var rows = '';
  var count = 0;

  for (var key in allResults) {
    var results = allResults[key];
    for (var i = 0; i < results.length; i++) {
      var meta = results[i]._metadata || {};
      count++;
      var dateStr = "-";
      if (meta.originalDate instanceof Date) {
        dateStr = Utilities.formatDate(meta.originalDate, "Asia/Seoul", "yyyy-MM-dd HH:mm");
      }

      rows += [
        '<tr>',
        '<td style="padding:6px 12px; border-bottom:1px solid #f0f0f0; font-size:12px; color:#555;">' + count + '</td>',
        '<td style="padding:6px 12px; border-bottom:1px solid #f0f0f0; font-size:12px; color:#333;">' + escapeHtml(results[i].productName) + '</td>',
        '<td style="padding:6px 12px; border-bottom:1px solid #f0f0f0; font-size:12px; color:#333;">' + escapeHtml(meta.originalSubject || "-") + '</td>',
        '<td style="padding:6px 12px; border-bottom:1px solid #f0f0f0; font-size:12px; color:#757575;">' + escapeHtml(meta.originalFrom || "-") + '</td>',
        '<td style="padding:6px 12px; border-bottom:1px solid #f0f0f0; font-size:12px; color:#757575;">' + escapeHtml(dateStr) + '</td>',
        '</tr>'
      ].join('');
    }
  }

  if (count === 0) return '';

  return [
    '<tr>',
    '<td style="padding:20px 30px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">',
    '<tr><td style="font-size:14px; font-weight:bold; color:#757575; padding-bottom:10px;">&#128233; 분석 대상 원본 메일 (' + count + '건)</td></tr>',
    '<tr><td>',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e0e0e0;">',
    '<tr style="background-color:#f8f9fa;">',
    '<th style="padding:8px 12px; text-align:left; font-size:11px; color:#555; border-bottom:2px solid #e0e0e0; width:30px;">#</th>',
    '<th style="padding:8px 12px; text-align:left; font-size:11px; color:#555; border-bottom:2px solid #e0e0e0; width:100px;">제품</th>',
    '<th style="padding:8px 12px; text-align:left; font-size:11px; color:#555; border-bottom:2px solid #e0e0e0;">제목</th>',
    '<th style="padding:8px 12px; text-align:left; font-size:11px; color:#555; border-bottom:2px solid #e0e0e0; width:120px;">발신자</th>',
    '<th style="padding:8px 12px; text-align:left; font-size:11px; color:#555; border-bottom:2px solid #e0e0e0; width:120px;">수신일</th>',
    '</tr>',
    rows,
    '</table>',
    '</td></tr>',
    '</table>',
    '</td>',
    '</tr>'
  ].join('\n');
}

// ────────────────────────────────────────────────
// 통계 및 유틸리티 함수
// ────────────────────────────────────────────────

/**
 * 전체 통계 집계
 */
function aggregateStats(allResults) {
  var totalMails = 0;
  var totalCves = 0;
  var criticalCount = 0;
  var highCount = 0;
  var requiredUpdates = 0;
  var allCveIds = [];
  var highestRisk = "INFORMATIONAL";
  var riskPriority = { CRITICAL: 5, HIGH: 4, MEDIUM: 3, LOW: 2, INFORMATIONAL: 1 };

  for (var key in allResults) {
    var results = allResults[key];
    totalMails += results.length;

    for (var i = 0; i < results.length; i++) {
      var r = results[i];

      // CVE 카운트
      if (r.cveList) {
        for (var j = 0; j < r.cveList.length; j++) {
          var cve = r.cveList[j];
          if (allCveIds.indexOf(cve.cveId) === -1) {
            allCveIds.push(cve.cveId);
            totalCves++;
            if (cve.cvssSeverity === "CRITICAL") criticalCount++;
            if (cve.cvssSeverity === "HIGH") highCount++;
          }
        }
      }

      // 최고 위험도
      if ((riskPriority[r.overallRiskLevel] || 0) > (riskPriority[highestRisk] || 0)) {
        highestRisk = r.overallRiskLevel;
      }

      // 필수 업데이트 카운트
      if (r.versionAnalysis) {
        for (var v = 0; v < r.versionAnalysis.length; v++) {
          if (r.versionAnalysis[v].updateVerdict === "REQUIRED") {
            requiredUpdates++;
          }
        }
      }
    }
  }

  return {
    totalMails: totalMails,
    totalCves: totalCves,
    criticalCount: criticalCount,
    highCount: highCount,
    requiredUpdates: requiredUpdates,
    highestRisk: highestRisk,
    uniqueCveIds: allCveIds
  };
}

/**
 * Digest 제목 생성
 */
function buildDigestSubject(dateStr, stats) {
  var prefix = "[LENA Security Digest]";
  var severity = "";

  if (stats.criticalCount > 0) {
    severity = " CRITICAL(" + stats.criticalCount + ")";
  } else if (stats.highCount > 0) {
    severity = " HIGH(" + stats.highCount + ")";
  }

  return prefix + " " + dateStr + severity +
         " - " + stats.totalCves + " CVEs, " + stats.totalMails + " Advisories";
}

/**
 * 분석할 메일이 없는 경우의 보고서 생성
 */
function buildEmptyDigest(reportDate) {
  var dateStr = Utilities.formatDate(reportDate, "Asia/Seoul", "yyyy-MM-dd");
  var analysisTime = Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm");

  var innerHtml = '';
  innerHtml += renderDigestHeader(dateStr, { totalMails: 0, totalCves: 0, criticalCount: 0, highCount: 0, requiredUpdates: 0, highestRisk: "INFORMATIONAL" });
  innerHtml += '<tr><td style="padding:30px; text-align:center; color:#757575; font-size:15px;">';
  innerHtml += '오늘(' + dateStr + ') 새로운 보안 공지가 없습니다.';
  innerHtml += '</td></tr>';
  innerHtml += renderFooter(DISCLAIMER, CONTACT_EMAIL);

  return {
    subject: "[LENA Security Digest] " + dateStr + " - No New Advisories",
    htmlBody: renderEmailShell(innerHtml)
  };
}
