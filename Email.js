// ============================================
// Email.gs - LENA AI 보안 메일 자동화 v3.0 메일 템플릿
// ============================================

/**
 * [Phase 5] HTML 보고서 생성
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
    '.cve-list { background: #f9f9f9; padding: 15px; border-left: 4px solid #667eea; margin: 10px 0; }' +
    '.cve-item { display: inline-block; background: #667eea; color: white; padding: 5px 12px; border-radius: 3px; margin: 3px; font-family: monospace; font-size: 13px; }' +
    '.info-box { background: #f5f5f5; padding: 15px; border-radius: 5px; margin: 10px 0; }' +
    '.info-label { font-weight: bold; color: #555; display: inline-block; min-width: 80px; }' +
    '.recommendation { background: #e3f2fd; border-left: 4px solid #2196f3; padding: 15px; margin: 10px 0; }' +
    '.footer { background: #f5f5f5; padding: 20px; text-align: center; font-size: 12px; color: #777; border-radius: 0 0 10px 10px; border: 1px solid #ddd; border-top: none; }' +
    '.disclaimer { background: #fff3cd; border: 1px solid #ffc107; padding: 15px; border-radius: 5px; margin: 20px 0; font-size: 13px; }' +
    '.engine-versions { background: #f0f4ff; padding: 15px; border-radius: 5px; margin: 10px 0; }' +
    '.engine-item { padding: 5px 0; }' +
    '</style></head><body><div class="container">';

  // 헤더
  html += '<div class="header">' +
    '<h1>🛡️ LENA 보안 보고서</h1>' +
    '<div class="subtitle">' + product.name + ' Security Analysis Report</div>' +
    '<span class="tlp-badge">' + TLP_LEVEL + '</span>' +
    '</div>';

  // 본문
  html += '<div class="content">';

  // 관련성 배지
  var relevanceClass = getRelevanceClass(analysis.relevance);
  var relevanceText = getRelevanceText(analysis.relevance);
  html += '<div class="relevance ' + relevanceClass + '">' +
    '관련성: ' + relevanceText +
    '</div>';

  // 요약
  html += '<div class="section">' +
    '<div class="section-title">📋 요약</div>' +
    '<p>' + escapeHtml(analysis.summary) + '</p>' +
    '</div>';

  // CVE 목록
  if (analysis.cveNumbers && analysis.cveNumbers.length > 0) {
    html += '<div class="section">' +
      '<div class="section-title">🔍 발견된 CVE</div>' +
      '<div class="cve-list">';
    for (var i = 0; i < analysis.cveNumbers.length; i++) {
      html += '<span class="cve-item">' + escapeHtml(analysis.cveNumbers[i]) + '</span>';
    }
    html += '</div></div>';
  }

  // 영향 평가
  html += '<div class="section">' +
    '<div class="section-title">⚠️ 영향 평가</div>' +
    '<p>' + escapeHtml(analysis.impact) + '</p>' +
    '</div>';

  // 권장 조치
  html += '<div class="section">' +
    '<div class="section-title">✅ 권장 조치</div>' +
    '<div class="recommendation">' +
    escapeHtml(analysis.recommendation) +
    '</div></div>';

  // LENA 엔진 버전
  html += '<div class="section">' +
    '<div class="section-title">🔧 LENA 엔진 버전</div>' +
    '<div class="engine-versions">' +
    buildEngineVersionHTML(product.versions) +
    '</div></div>';

  // 원본 메일 정보
  html += '<div class="section">' +
    '<div class="section-title">📧 원본 메일 정보</div>' +
    '<div class="info-box">' +
    '<div><span class="info-label">제목:</span> ' + escapeHtml(emailData.subject) + '</div>' +
    '<div><span class="info-label">발신자:</span> ' + escapeHtml(emailData.from) + '</div>' +
    '<div><span class="info-label">날짜:</span> ' + emailData.date + '</div>' +
    '</div></div>';

  // 다운로드 링크
  if (product.downloadUrlPattern) {
    html += '<div class="section">' +
      '<div class="section-title">⬇️ 다운로드</div>' +
      '<p><a href="' + product.downloadUrlPattern + '" target="_blank">' +
      product.name + ' 공식 다운로드 페이지' +
      '</a></p></div>';
  }

  // 면책 문구
  html += '<div class="disclaimer">' +
    '<strong>⚠️ 면책 사항</strong><br>' +
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
 * [유틸] 관련성 클래스 매핑
 */
function getRelevanceClass(relevance) {
  var map = {
    "높음": "high",
    "보통": "medium",
    "낮음": "low",
    "무관": "none"
  };
  return map[relevance] || "none";
}

/**
 * [유틸] 관련성 텍스트 변환
 */
function getRelevanceText(relevance) {
  var map = {
    "높음": "높음 (즉시 확인 필요)",
    "보통": "보통 (검토 권장)",
    "낮음": "낮음 (참고용)",
    "무관": "무관"
  };
  return map[relevance] || relevance;
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

/**
 * [유틸] HTML 이스케이프
 */
function escapeHtml(text) {
  if (!text) return '';
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
    .replace(/\n/g, '<br>');
}
