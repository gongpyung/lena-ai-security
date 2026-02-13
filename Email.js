// ============================================
// Email.gs - LENA AI 보안 메일 자동화 v3.0 메일 템플릿
// ============================================

/**
 * [Phase 5] HTML 보고서 생성 (Schema v3.0 호환)
 * Renderer.js 함수 기반 table + inline style 방식으로 재작성
 */
function buildReportHTML(emailData, analysis, product) {
  // 1. _metadata 구성 (renderSingleReport가 필요로 하는 형태)
  analysis._metadata = {
    originalFrom: emailData.from,
    originalDate: emailData.date,
    originalSubject: emailData.subject,
    originalBody: emailData.body || ""
  };

  // 2. product.downloadUrlPattern을 downloadLinks에 추가
  if (product.downloadUrlPattern) {
    if (!analysis.downloadLinks) analysis.downloadLinks = [];
    analysis.downloadLinks.push({
      url: product.downloadUrlPattern,
      label: product.name + ' 공식 다운로드 페이지'
    });
  }

  // 3. Renderer.js 함수를 사용하여 내부 콘텐츠 조립
  var innerHtml = '';
  innerHtml += renderHeader(analysis.reportTag, analysis.reportTitle || (product.name + ' Analysis Report'));
  innerHtml += renderTlpBadge(TLP_LEVEL);
  innerHtml += renderMetaInfo(
    Utilities.formatDate(new Date(), "Asia/Seoul", "yyyy-MM-dd HH:mm"),
    emailData.from,
    emailData.date
  );
  innerHtml += renderExecutiveSummary(analysis.executiveSummary, analysis.overallRiskLevel, analysis.immediateActionRequired);
  innerHtml += renderCveSeverityTable(analysis.cveList);
  innerHtml += renderTechnicalDetails(analysis.technicalSummary, analysis.cveList);
  innerHtml += renderImpactAndGuide(analysis.impactAnalysis, analysis.actionGuide, analysis.downloadLinks);
  innerHtml += renderVersionAnalysis(analysis.versionAnalysis);
  innerHtml += renderEngineVersions(product.versions);
  innerHtml += renderOriginalMail(emailData.body || "", { originalSubject: emailData.subject, originalFrom: emailData.from });
  innerHtml += renderFooter(DISCLAIMER, CONTACT_EMAIL);

  // 4. 이메일 셸로 감싸기
  return renderEmailShell(innerHtml);
}

/**
 * [유틸] 위험 수준 텍스트 변환 (v3.0)
 * 다른 파일에서 사용될 수 있으므로 유지
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

