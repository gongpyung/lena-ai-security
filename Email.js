// ============================================
// Email.gs - LENA AI 보안 메일 자동화 v3.0 메일 템플릿
// ============================================

/**
 * [Phase 5] HTML 보고서 생성 (Schema v3.0 호환)
 */
function buildReportHTML(emailData, analysis, product) {
  var html = '<!DOCTYPE html><html><head><meta charset="UTF-8">' +
    '<style>' +
    'body { font-family: "Malgun Gothic", sans-serif; line-height: 1.6; color: #333; }' +
    '.container { max-width: 800px; margin: 0 auto; padding: 20px; }' +
    '.header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 10px 10px 0 0; }' +
    '.header h1 { margin: 0; font-size: 24px; }' +
    '.header .subtitle { margin-top: 10px; opacity: 0.9; font-size: 14px; }' +
    '.tlp-badge { display: inline-block; background: #FF6B35; color: white; padding: 5px 15px; border-radius: 20px; font-size: 12px; font-weight: bold; margin-top: 10px; }' +
    '.content { background: white; padding: 30px; border: 1px solid #ddd; border-top: none; }' +
    '.section { margin-bottom: 25px; }' +
    '.section-title { font-size: 18px; font-weight: bold; color: #667eea; margin-bottom: 10px; border-bottom: 2px solid #667eea; padding-bottom: 5px; }' +
    '.relevance { display: inline-block; padding: 8px 16px; border-radius: 5px; font-weight: bold; margin-bottom: 15px; }' +
    '.relevance.high { background: #ffebee; color: #c62828; }' +
    '.relevance.medium { background: #fff3e0; color: #e65100; }' +
    '.relevance.low { background: #e8f5e9; color: #2e7d32; }' +
    '.relevance.none { background: #f5f5f5; color: #757575; }' +
    '.relevance.critical { background: #b71c1c; color: white; }' +
    '.relevance.info { background: #e3f2fd; color: #1565c0; }' +
    '.report-tag { display: inline-block; padding: 4px 12px; border-radius: 3px; font-size: 12px; font-weight: bold; margin-left: 10px; }' +
    '.report-tag.Security { background: #ffcdd2; color: #b71c1c; }' +
    '.report-tag.Release { background: #c8e6c9; color: #2e7d32; }' +
    '.report-tag.Notice { background: #fff9c4; color: #f57f17; }' +
    '.immediate-action { background: #ff1744; color: white; padding: 12px 20px; border-radius: 5px; font-weight: bold; margin: 15px 0; text-align: center; font-size: 16px; }' +
    '.tech-summary { background: #fafafa; padding: 20px; border-left: 4px solid #455a64; margin: 10px 0; white-space: pre-wrap; }' +
    '.cve-card { background: #f9f9f9; border: 1px solid #e0e0e0; border-radius: 8px; padding: 15px; margin: 10px 0; }' +
    '.cve-card .cve-id { font-family: monospace; font-size: 15px; font-weight: bold; color: #667eea; }' +
    '.cve-card .cvss-badge { display: inline-block; padding: 3px 10px; border-radius: 3px; font-weight: bold; font-size: 12px; margin-left: 10px; }' +
    '.cvss-critical { background: #b71c1c; color: white; }' +
    '.cvss-high { background: #e65100; color: white; }' +
    '.cvss-medium { background: #f57f17; color: white; }' +
    '.cvss-low { background: #2e7d32; color: white; }' +
    '.cvss-none { background: #757575; color: white; }' +
    '.exploit-badge { display: inline-block; padding: 2px 8px; border-radius: 3px; font-size: 11px; font-weight: bold; margin-left: 8px; }' +
    '.exploit-known { background: #b71c1c; color: white; }' +
    '.exploit-poc { background: #e65100; color: white; }' +
    '.exploit-none { background: #2e7d32; color: white; }' +
    '.exploit-unknown { background: #757575; color: white; }' +
    '.cve-list { background: #f9f9f9; padding: 15px; border-left: 4px solid #667eea; margin: 10px 0; }' +
    '.cve-item { display: inline-block; background: #667eea; color: white; padding: 5px 12px; border-radius: 3px; margin: 3px; font-family: monospace; font-size: 13px; }' +
    '.info-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }' +
    '.info-label { font-weight: bold; color: #555; display: inline-block; min-width: 80px; }' +
    '.recommendation { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 10px 0; }' +
    '.footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none; }' +
    '.disclaimer { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 13px; }' +
    '.engine-versions { background: #f0f4ff; padding: 15px; border-radius: 5px; margin: 10px 0; }' +
    '.engine-item { padding: 5px 0; }' +
    '.download-link { display: block; padding: 8px 15px; margin: 5px 0; background: #f5f5f5; border-radius: 5px; text-decoration: none; color: #667eea; }' +
    '.version-table { width: 100%; border-collapse: collapse; margin: 10px 0; }' +
    '.version-table th { background: #667eea; color: white; padding: 10px; text-align: left; }' +
    '.version-table td { padding: 8px 10px; border-bottom: 1px solid #e0e0e0; }' +
    '.verdict-required { color: #c62828; font-weight: bold; }' +
    '.verdict-recommended { color: #e65100; font-weight: bold; }' +
    '.verdict-not-affected { color: #2e7d32; }' +
    '.verdict-undetermined { color: #757575; }' +
    '</style></head><body><div class="container">';

  // 헤더
  html += '<div class="header">' +
    '<h1>\u{1F6E1}\uFE0F LENA AI 보고서</h1>' +
    '<div class="subtitle">' + escapeHtml(analysis.reportTitle || (product.name + ' Analysis Report')) + '</div>' +
    '<span class="tlp-badge">' + TLP_LEVEL + '</span>' +
    '<span class="report-tag ' + escapeHtml(analysis.reportTag) + '">' + escapeHtml(analysis.reportTag) + '</span>' +
    '</div>';

  // 본문
  html += '<div class="content">';

  // 위험 수준 배지
  var riskClass = getRelevanceClass(analysis.overallRiskLevel);
  var riskText = getRelevanceText(analysis.overallRiskLevel);
  html += '<div class="relevance ' + riskClass + '">' +
    '\uC704\uD5D8 \uC218\uC900: ' + riskText +
    '</div>';

  // 즉각 조치 배너
  if (analysis.immediateActionRequired) {
    html += '<div class="immediate-action">\u26A0\uFE0F \uC989\uAC01 \uC870\uCE58\uAC00 \uD544\uC694\uD569\uB2C8\uB2E4!</div>';
  }

  // 요약 (Executive Summary)
  html += '<div class="section">' +
    '<div class="section-title">\uD83D\uDCCB \uC694\uC57D (Executive Summary)</div>' +
    '<p>' + escapeHtml(analysis.executiveSummary).replace(/\n/g, '<br>') + '</p>' +
    '</div>';

  // 기술 분석 (Technical Summary)
  if (analysis.technicalSummary) {
    html += '<div class="section">' +
      '<div class="section-title">\uD83D\uDD2C \uAE30\uC220 \uBD84\uC11D (Technical Summary)</div>' +
      '<div class="tech-summary">' + escapeHtml(analysis.technicalSummary).replace(/\n/g, '<br>') + '</div>' +
      '</div>';
  }

  // CVE 목록 (리치 카드)
  if (analysis.cveList && analysis.cveList.length > 0) {
    html += '<div class="section">' +
      '<div class="section-title">\uD83D\uDD0D \uBC1C\uACAC\uB41C CVE (' + analysis.cveList.length + '\uAC74)</div>';
    for (var i = 0; i < analysis.cveList.length; i++) {
      var cve = analysis.cveList[i];
      var cvssBadgeClass = getCvssBadgeClass(cve.cvssSeverity);
      var exploitBadge = getExploitBadge(cve.exploitExists);
      html += '<div class="cve-card">' +
        '<div><span class="cve-id">' + escapeHtml(cve.cveId) + '</span>' +
        '<span class="cvss-badge ' + cvssBadgeClass + '">CVSS ' + cve.cvssScore + ' (' + escapeHtml(cve.cvssSeverity) + ')</span>' +
        exploitBadge +
        '</div>' +
        '<div style="margin-top:8px;"><strong>' + escapeHtml(cve.title) + '</strong></div>' +
        '<div style="margin-top:5px;">' + escapeHtml(cve.description).replace(/\n/g, '<br>') + '</div>' +
        (cve.cvssVector ? '<div style="margin-top:5px; font-size:12px; color:#888; font-family:monospace;">' + escapeHtml(cve.cvssVector) + '</div>' : '') +
        '<div style="margin-top:8px; font-size:13px; color:#555;">' +
        '<strong>\uC601\uD5A5 \uBC84\uC804:</strong> ' + escapeHtml(cve.affectedVersions) +
        ' | <strong>\uC218\uC815 \uBC84\uC804:</strong> ' + escapeHtml(cve.fixedVersion) +
        ' | <strong>\uD328\uCE58:</strong> ' + (cve.patchAvailable ? '\u2705 \uAC00\uC6A9' : '\u274C \uBBF8\uAC00\uC6A9') +
        '</div>' +
        '<div style="margin-top:5px; font-size:13px;">' +
        '<a href="' + escapeHtml(cve.nvdUrl) + '" target="_blank">NVD \uC0C1\uC138 \uBCF4\uAE30</a>' +
        '</div>' +
        '</div>';
    }
    html += '</div>';
  }

  // 영향 평가
  html += '<div class="section">' +
    '<div class="section-title">\u26A0\uFE0F \uC601\uD5A5 \uD3C9\uAC00</div>' +
    '<p>' + escapeHtml(analysis.impactAnalysis).replace(/\n/g, '<br>') + '</p>' +
    '</div>';

  // 조치 가이드 (Gmail-safe 하드코딩 번호)
  if (analysis.actionGuide && analysis.actionGuide.length > 0) {
    html += '<div class="section">' +
      '<div class="section-title">\u2705 \uC870\uCE58 \uAC00\uC774\uB4DC</div>' +
      '<ol>';
    for (var i = 0; i < analysis.actionGuide.length; i++) {
      html += '<li>' + escapeHtml(analysis.actionGuide[i]) + '</li>';
    }
    html += '</ol></div>';
  }

  // LENA 버전 영향 분석
  if (analysis.versionAnalysis && analysis.versionAnalysis.length > 0) {
    html += '<div class="section">' +
      '<div class="section-title">\uD83D\uDCCA LENA \uBC84\uC804 \uC601\uD5A5 \uBD84\uC11D</div>' +
      '<table class="version-table">' +
      '<tr><th>\uC81C\uD488</th><th>LENA \uBC84\uC804</th><th>\uBA54\uC77C \uC5B8\uAE09 \uBC84\uC804</th><th>\uC601\uD5A5 \uC5EC\uBD80</th><th>\uD310\uB2E8</th><th>\uADFC\uAC70</th></tr>';
    for (var i = 0; i < analysis.versionAnalysis.length; i++) {
      var va = analysis.versionAnalysis[i];
      var verdictClass = getVerdictClass(va.updateVerdict);
      html += '<tr>' +
        '<td>' + escapeHtml(va.productName) + '</td>' +
        '<td>' + escapeHtml(va.lenaVersions) + '</td>' +
        '<td>' + escapeHtml(va.mailMentionedVersions) + '</td>' +
        '<td>' + (va.isAffected ? '\u26A0\uFE0F \uC601\uD5A5 \uC788\uC74C' : '\u2705 \uC601\uD5A5 \uC5C6\uC74C') + '</td>' +
        '<td class="' + verdictClass + '">' + escapeHtml(va.updateVerdict) + '</td>' +
        '<td>' + escapeHtml(va.updateVerdictReason) + '</td>' +
        '</tr>';
    }
    html += '</table></div>';
  }

  // LENA 엔진 버전
  html += '<div class="section">' +
    '<div class="section-title">\uD83D\uDD27 LENA \uC5D4\uC9C4 \uBC84\uC804</div>' +
    '<div class="engine-versions">' +
    buildEngineVersionHTML(product.versions) +
    '</div></div>';

  // 원본 메일 정보
  html += '<div class="section">' +
    '<div class="section-title">\uD83D\uDCE7 \uC6D0\uBCF8 \uBA54\uC77C \uC815\uBCF4</div>' +
    '<div class="info-box">' +
    '<div><span class="info-label">\uC81C\uBAA9:</span> ' + escapeHtml(emailData.subject) + '</div>' +
    '<div><span class="info-label">\uBC1C\uC2E0\uC790:</span> ' + escapeHtml(emailData.from) + '</div>' +
    '<div><span class="info-label">\uB0A0\uC9DC:</span> ' + emailData.date + '</div>' +
    '</div></div>';

  // 다운로드 및 참고 링크
  if ((analysis.downloadLinks && analysis.downloadLinks.length > 0) || product.downloadUrlPattern) {
    html += '<div class="section">' +
      '<div class="section-title">\u2B07\uFE0F \uB2E4\uC6B4\uB85C\uB4DC \uBC0F \uCC38\uACE0 \uB9C1\uD06C</div>';
    if (analysis.downloadLinks && analysis.downloadLinks.length > 0) {
      for (var i = 0; i < analysis.downloadLinks.length; i++) {
        var link = analysis.downloadLinks[i];
        html += '<a class="download-link" href="' + escapeHtml(link.url) + '" target="_blank">\uD83D\uDCCE ' + escapeHtml(link.label) + '</a>';
      }
    }
    if (product.downloadUrlPattern) {
      html += '<a class="download-link" href="' + escapeHtml(product.downloadUrlPattern) + '" target="_blank">\uD83C\uDFE0 ' + escapeHtml(product.name) + ' \uACF5\uC2DD \uB2E4\uC6B4\uB85C\uB4DC \uD398\uC774\uC9C0</a>';
    }
    html += '</div>';
  }

  // 면책 문구
  html += '<div class="disclaimer">' +
    '<strong>\u26A0\uFE0F \uBA74\uCC45 \uC0AC\uD56D</strong><br>' +
    escapeHtml(DISCLAIMER) +
    '</div>';

  html += '</div>'; // content

  // 푸터
  html += '<div class="footer">' +
    'LENA AI Security Assistant v3.0<br>' +
    'Generated: ' + new Date().toLocaleString('ko-KR') + '<br>' +
    'Contact: <a href="mailto:' + CONTACT_EMAIL + '">' + CONTACT_EMAIL + '</a>' +
    '</div>';

  html += '</div></body></html>';

  return html;
}

/**
 * [유틸] 위험 수준 클래스 매핑 (v3.0)
 */
function getRelevanceClass(riskLevel) {
  var map = {
    "CRITICAL": "critical",
    "HIGH": "high",
    "MEDIUM": "medium",
    "LOW": "low",
    "INFORMATIONAL": "info"
  };
  return map[riskLevel] || "info";
}

/**
 * [유틸] 위험 수준 텍스트 변환 (v3.0)
 */
function getRelevanceText(riskLevel) {
  var map = {
    "CRITICAL": "\uC2EC\uAC01 (\uC989\uAC01 \uB300\uC751 \uD544\uC694)",
    "HIGH": "\uB192\uC74C (\uAE34\uAE09 \uAC80\uD1A0 \uD544\uC694)",
    "MEDIUM": "\uBCF4\uD1B5 (\uAC80\uD1A0 \uAD8C\uC7A5)",
    "LOW": "\uB0AE\uC74C (\uCC38\uACE0\uC6A9)",
    "INFORMATIONAL": "\uC815\uBCF4 (\uCC38\uACE0 \uC0AC\uD56D)"
  };
  return map[riskLevel] || riskLevel;
}

/**
 * [유틸] CVSS 심각도 배지 클래스
 */
function getCvssBadgeClass(severity) {
  var map = {
    "CRITICAL": "cvss-critical",
    "HIGH": "cvss-high",
    "MEDIUM": "cvss-medium",
    "LOW": "cvss-low",
    "NONE": "cvss-none",
    "UNKNOWN": "cvss-none"
  };
  return map[severity] || "cvss-none";
}

/**
 * [유틸] Exploit 상태 배지 HTML
 */
function getExploitBadge(exploitExists) {
  var map = {
    "KNOWN_EXPLOIT": { css: "exploit-known", label: "Exploit \uD655\uC778\uB428" },
    "POC_EXISTS": { css: "exploit-poc", label: "PoC \uC874\uC7AC" },
    "NO_KNOWN_EXPLOIT": { css: "exploit-none", label: "Exploit \uBBF8\uD655\uC778" },
    "UNKNOWN": { css: "exploit-unknown", label: "Exploit \uC815\uBCF4 \uC5C6\uC74C" }
  };
  var info = map[exploitExists];
  if (!info) return '';
  return '<span class="exploit-badge ' + info.css + '">' + info.label + '</span>';
}

/**
 * [유틸] 업데이트 판단 클래스
 */
function getVerdictClass(verdict) {
  var map = {
    "REQUIRED": "verdict-required",
    "RECOMMENDED": "verdict-recommended",
    "NOT_AFFECTED": "verdict-not-affected",
    "UNDETERMINED": "verdict-undetermined"
  };
  return map[verdict] || "";
}

/**
 * [유틸] 엔진 버전 HTML 생성
 */
function buildEngineVersionHTML(versions) {
  var html = '';
  for (var name in versions) {
    var ver = versions[name];
    if (Array.isArray(ver)) {
      html += '<div class="engine-item"><strong>' + escapeHtml(name) + ':</strong> ' + ver.map(escapeHtml).join(', ') + '</div>';
    } else {
      html += '<div class="engine-item"><strong>' + escapeHtml(name) + ':</strong> ' + escapeHtml(ver) + '</div>';
    }
  }
  return html;
}

