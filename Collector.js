// ============================================
// Collector.gs - 메일 수집/그룹핑/중복제거
// LENA AI 보안 메일 자동화 v3.0
// ============================================

/**
 * 모든 Gmail 라벨에서 미읽은 메일을 수집
 *
 * [라벨 충돌 해결 전략]
 * apache-tomcat과 apache-tomee 모두 "LENA-TOMCAT" 라벨을 사용하므로,
 * 라벨 단위로 한 번만 수집한 뒤 메일 내용(subject+body)에서
 * filterKeywords를 기반으로 제품을 분류한다.
 *
 * 동작 방식:
 * 1) 중복 라벨은 한 번만 수집 (collectedLabels 캐시)
 * 2) 수집된 각 메일을 classifyMailToProduct()로 제품 분류
 * 3) TomEE 키워드가 포함된 메일 -> apache-tomee
 * 4) 나머지 LENA-TOMCAT 메일 -> apache-tomcat
 * 5) CVE 없는 Release 메일이 TomEE에 중복 포함되는 것을 방지
 *
 * @returns {Array<Object>} 수집된 메일 목록
 */
function collectUnreadMails() {
  var allMails = [];
  var collectedLabels = {};  // 라벨별 수집 캐시 (중복 수집 방지)

  // Step 1: 라벨별로 한 번만 수집
  for (var key in PRODUCTS) {
    var product = PRODUCTS[key];
    if (!product.gmailLabel) continue;  // 라벨 미설정 제품은 건너뜀 (예: Redis)

    if (collectedLabels[product.gmailLabel]) continue;  // 이미 수집한 라벨 건너뜀
    collectedLabels[product.gmailLabel] = true;

    var threads = GmailApp.search(
      "label:" + product.gmailLabel + " is:unread", 0, MAX_THREADS
    );

    for (var i = 0; i < threads.length; i++) {
      var thread = threads[i];
      var message = thread.getMessages()[0];

      allMails.push({
        productKey: null,  // 아직 미분류 - classifyMailToProduct()에서 결정
        productName: null,
        gmailLabel: product.gmailLabel,
        thread: thread,
        message: message,
        subject: message.getSubject(),
        body: message.getPlainBody(),
        from: message.getFrom(),
        date: message.getDate(),
        messageId: message.getId()
      });
    }
  }

  // Step 2: 메일별 제품 분류
  for (var j = 0; j < allMails.length; j++) {
    var classified = classifyMailToProduct(allMails[j]);
    allMails[j].productKey = classified.productKey;
    allMails[j].productName = classified.productName;
  }

  // Step 3: 버전 필터링
  var filteredMails = [];
  for (var m = 0; m < allMails.length; m++) {
    var mail = allMails[m];
    var product = PRODUCTS[mail.productKey];

    // 제품 정보가 없으면 안전하게 포함
    if (!product || !product.versions) {
      filteredMails.push(mail);
      continue;
    }

    // LENA 버전 가져오기 (versions 객체의 모든 엔진 버전을 통합)
    var allLenaVersions = [];
    for (var vKey in product.versions) {
      var ver = product.versions[vKey];
      if (Array.isArray(ver)) {
        allLenaVersions = allLenaVersions.concat(ver);
      } else {
        allLenaVersions.push(ver);
      }
    }

    // LENA 버전이 없으면 안전하게 포함
    if (allLenaVersions.length === 0) {
      filteredMails.push(mail);
      continue;
    }

    // 메일에서 버전 추출
    var mailVersions = extractVersionsFromMail(mail.subject, mail.body);

    // 분석 대상 여부 판단
    if (shouldAnalyzeMail(mailVersions, allLenaVersions)) {
      filteredMails.push(mail);
    } else {
      Logger.log("[Collector] 버전 필터링 - 건너뜀 (LENA 미해당): " + mail.subject);
      // skip된 메일도 읽음 처리
      mail.thread.markRead();
    }
  }

  Logger.log("[Collector] 총 " + allMails.length + "건 수집, " +
             filteredMails.length + "건 필터링 완료 (버전 기준)");
  return filteredMails;
}

/**
 * 메일 내용 기반 제품 분류
 *
 * 분류 규칙:
 * 1) 메일 subject+body에서 제품별 filterKeywords 매칭 점수 계산
 * 2) 동일 라벨을 공유하는 제품들 중 점수가 가장 높은 제품으로 분류
 * 3) TomEE 전용 키워드(TomEE, tomee) 매칭 시 apache-tomee로 분류
 * 4) 매칭 실패 시 해당 라벨의 기본 제품(primaryProduct)으로 분류
 *
 * @param {Object} mail - 수집된 메일 객체
 * @returns {Object} { productKey, productName }
 */
function classifyMailToProduct(mail) {
  var searchText = (mail.subject + " " + mail.body).toLowerCase();
  var label = mail.gmailLabel;

  // 해당 라벨을 사용하는 모든 제품 목록
  var candidates = [];
  var primaryProduct = null;  // 라벨의 기본 제품 (첫 번째 등록된 제품)

  for (var key in PRODUCTS) {
    var product = PRODUCTS[key];
    if (product.gmailLabel === label) {
      candidates.push({ key: key, product: product });
      if (!primaryProduct) {
        primaryProduct = { key: key, product: product };
      }
    }
  }

  // 라벨에 제품이 1개뿐이면 바로 반환
  if (candidates.length <= 1) {
    var single = candidates[0] || primaryProduct;
    return {
      productKey: single ? single.key : "unknown",
      productName: single ? single.product.name : "Unknown"
    };
  }

  // 복수 제품이 동일 라벨 사용 시: 키워드 기반 점수 매칭
  var bestMatch = null;
  var bestScore = -1;

  for (var c = 0; c < candidates.length; c++) {
    var candidate = candidates[c];
    var score = 0;

    // 제품명 자체 매칭 (가장 강력한 시그널)
    if (searchText.indexOf(candidate.product.name.toLowerCase()) !== -1) {
      score += 10;
    }

    // filterKeywords 매칭
    var keywords = candidate.product.filterKeywords || [];
    for (var k = 0; k < keywords.length; k++) {
      if (searchText.indexOf(keywords[k].toLowerCase()) !== -1) {
        score += 1;
      }
    }

    if (score > bestScore) {
      bestScore = score;
      bestMatch = candidate;
    }
  }

  // 점수가 동점이면 primaryProduct로 fallback
  var result = bestMatch || primaryProduct;
  return {
    productKey: result.key,
    productName: result.product.name
  };
}

/**
 * 메일 본문에서 CVE ID를 추출
 * @param {string} text - 메일 본문
 * @returns {Array<string>} CVE ID 목록
 */
function extractCveIds(text) {
  var pattern = /CVE-\d{4}-\d{4,}/g;
  var matches = text.match(pattern);
  return matches ? uniqueArray(matches) : [];
}

/**
 * 배열 중복 제거 유틸리티
 */
function uniqueArray(arr) {
  var seen = {};
  return arr.filter(function(item) {
    if (seen[item]) return false;
    seen[item] = true;
    return true;
  });
}

/**
 * 메일 제목과 본문에서 버전 번호를 추출
 * @param {string} subject - 메일 제목
 * @param {string} body - 메일 본문
 * @returns {Array<string>} 추출된 버전 번호 목록 (중복 제거됨)
 */
function extractVersionsFromMail(subject, body) {
  var text = subject + " " + body;
  var pattern = /(\d+\.\d+\.\d+)/g;
  var matches = text.match(pattern);
  return matches ? uniqueArray(matches) : [];
}

/**
 * 버전 번호를 major.minor.patch로 파싱
 * @param {string} version - 버전 문자열 (예: "1.29.3")
 * @returns {Object} { major, minor, patch }
 */
function parseVersion(version) {
  var parts = version.split(".");
  return {
    major: parseInt(parts[0], 10),
    minor: parseInt(parts[1], 10),
    patch: parseInt(parts[2], 10)
  };
}

/**
 * 메일이 LENA 버전에 해당하는지 판단
 * @param {Array<string>} mailVersions - 메일에서 추출한 버전 배열
 * @param {string|Array<string>} lenaVersions - LENA 사용 버전 (단일 또는 배열)
 * @returns {boolean} 분석 대상이면 true, 건너뛰면 false
 */
function shouldAnalyzeMail(mailVersions, lenaVersions) {
  // 메일에서 버전을 하나도 추출 못한 경우 → 안전하게 분석 대상으로 처리
  if (!mailVersions || mailVersions.length === 0) {
    return true;
  }

  // LENA 버전이 배열이 아니면 배열로 변환
  var lenaVersionArray = Array.isArray(lenaVersions) ? lenaVersions : [lenaVersions];

  // 메일의 여러 버전 중 하나라도 분석 대상이면 true
  for (var i = 0; i < mailVersions.length; i++) {
    var mailVer = parseVersion(mailVersions[i]);

    // LENA 버전 중 하나라도 매칭되는지 확인
    for (var j = 0; j < lenaVersionArray.length; j++) {
      var lenaVer = parseVersion(lenaVersionArray[j]);

      // major.minor가 같고 patch가 LENA보다 높으면 분석 대상
      if (mailVer.major === lenaVer.major &&
          mailVer.minor === lenaVer.minor &&
          mailVer.patch > lenaVer.patch) {
        return true;
      }
    }
  }

  // 어떤 버전도 분석 대상이 아니면 skip
  return false;
}

/**
 * 수집된 메일을 제품별로 그룹핑하고 messageId 기반 중복 제거
 * @param {Array<Object>} mails - collectUnreadMails() 결과
 * @returns {Object} { productKey: { productName, mails: [...], cveIds: [...] } }
 */
function groupAndDeduplicate(mails) {
  var groups = {};
  var seenMessageIds = {};  // 전역 messageId 중복 체크

  for (var i = 0; i < mails.length; i++) {
    var mail = mails[i];
    var key = mail.productKey;

    if (!groups[key]) {
      groups[key] = {
        productName: mail.productName,
        mails: [],
        cveIds: []
      };
    }

    // messageId 기반 중복 체크
    if (seenMessageIds[mail.messageId]) {
      Logger.log("[Collector] 중복 메일 건너뜀: " + mail.subject);
      continue;
    }
    seenMessageIds[mail.messageId] = true;

    groups[key].mails.push(mail);

    // CVE 추출 (보고서용, 중복 판단에는 미사용)
    var mailCves = extractCveIds(mail.body);
    for (var j = 0; j < mailCves.length; j++) {
      if (groups[key].cveIds.indexOf(mailCves[j]) === -1) {
        groups[key].cveIds.push(mailCves[j]);
      }
    }
  }

  // 결과 요약 로깅
  for (var gKey in groups) {
    Logger.log("[Collector] " + groups[gKey].productName + ": " +
               groups[gKey].mails.length + "건, CVE " +
               groups[gKey].cveIds.length + "개");
  }

  return groups;
}
