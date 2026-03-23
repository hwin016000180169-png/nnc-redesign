/**
 * _layout.js — 엔앤씨 공통 레이아웃 엔진
 *
 * 사용법: 각 서브페이지의 <head> 안에서 PAGE_CONFIG 설정 후 로드
 *
 *   <script>
 *     window.PAGE_CONFIG = {
 *       root:          '../',           // 루트 경로
 *       activeSection: 'company',       // 활성 GNB 섹션
 *       activePage:    'overview',      // 활성 서브메뉴
 *       crumb:         '회사개요',
 *       pageEyebrow:   'Company Overview',
 *       pageTitle:     '회사<span class="hl">개요</span>',
 *       pageDesc:      '엔앤씨의 기업 개요를 소개합니다'
 *     };
 *   </script>
 *   <script src="../_layout.js"></script>
 */
(function () {
  var C    = window.PAGE_CONFIG || {};
  var ROOT = C.root          || './';
  var SEC  = C.activeSection || '';
  var PAGE = C.activePage    || '';

  /* ════════════════════════════════════════
     1. 공통 CSS 주입
  ════════════════════════════════════════ */
  var css = [
    ':root{',
      '--blue:#1A6BFF;--blue-deep:#0040D0;--blue-dark:#02102E;--blue-mid:#041A40;',
      '--blue-glow:rgba(26,107,255,0.35);--accent:#38BFFF;--white:#FFFFFF;',
      '--muted:#6B7A99;--glass:rgba(255,255,255,0.06);--glass-border:rgba(255,255,255,0.12);',
      '--green:#22C55E;--red:#EF4444;',
      '--font-ko:"Noto Sans KR",sans-serif;--font-en:"Inter",sans-serif;',
      '--ease-out:cubic-bezier(0.16,1,0.3,1);',
    '}',
    '*,*::before,*::after{box-sizing:border-box;margin:0;padding:0}',
    'html{scroll-behavior:smooth;font-size:16px}',
    'body{font-family:var(--font-ko);background:var(--blue-dark);color:#fff;overflow-x:hidden;-webkit-font-smoothing:antialiased}',
    'a{text-decoration:none;color:inherit}ul{list-style:none}img{display:block;max-width:100%}button{cursor:pointer;border:none;background:none;font-family:inherit}',

    /* Canvas */
    '#bg-canvas{position:fixed;inset:0;z-index:0;pointer-events:none;opacity:0.6}',

    /* Cursor glow */
    '#cursor-glow{position:fixed;width:400px;height:400px;border-radius:50%;background:radial-gradient(circle,rgba(26,107,255,0.08) 0%,transparent 70%);pointer-events:none;z-index:0;transform:translate(-50%,-50%);transition:opacity .3s}',

    /* Topbar */
    '#topbar{position:relative;z-index:1000;background:rgba(2,16,46,0.95);backdrop-filter:blur(12px);border-bottom:1px solid var(--glass-border);height:40px;display:flex;align-items:center;justify-content:flex-end;padding-right:40px}',
    '.topbar-links{display:flex;gap:0}',
    '.topbar-links a{display:flex;align-items:center;gap:6px;height:40px;padding:0 16px;font-size:12px;font-weight:500;color:rgba(255,255,255,0.5);border-left:1px solid var(--glass-border);transition:color .2s,background .2s;letter-spacing:.02em}',
    '.topbar-links a:hover{color:#fff;background:var(--glass)}',
    '.topbar-links .tb-mall{color:#7EC8FF}',
    '.topbar-links .tb-edu{color:#fff;background:var(--blue);font-weight:700}',
    '.topbar-links .tb-edu:hover{background:var(--blue-deep)}',
    '.topbar-links .tb-pay{color:#fff;background:linear-gradient(135deg,#1A6BFF,#38BFFF);font-weight:800}',

    /* Header */
    '#header{position:sticky;top:0;z-index:900;height:68px;display:flex;align-items:center;justify-content:space-between;padding:0 40px;background:rgba(2,16,46,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid var(--glass-border);transition:background .4s,box-shadow .4s}',
    '#header.solid{background:rgba(2,16,46,0.98);box-shadow:0 8px 32px rgba(0,0,0,0.4)}',
    '.logo-wrap{display:flex;align-items:center;gap:12px}',
    '.logo-img{height:34px;width:auto;filter:brightness(0) invert(1)}',
    '.logo-tagline{font-size:11px;color:rgba(255,255,255,0.4);font-family:var(--font-en);font-weight:600;letter-spacing:.08em;border-left:1px solid rgba(255,255,255,0.15);padding-left:12px}',

    /* GNB */
    '#gnb{display:flex;align-items:center;height:100%;gap:0}',
    '.gnb-item{position:relative;height:100%;display:flex;align-items:center}',
    '.gnb-link{display:flex;align-items:center;height:100%;padding:0 18px;font-size:14px;font-weight:600;color:rgba(255,255,255,0.75);white-space:nowrap;transition:color .2s;letter-spacing:-.01em}',
    '.gnb-items{display:contents}',
    '.gnb-footer{display:none}',
    '.gnb-link:hover,.gnb-link.active{color:#fff}',
    '.gnb-item::after{content:"";position:absolute;bottom:0;left:18px;right:18px;height:2px;background:var(--blue);transform:scaleX(0);transition:transform .3s var(--ease-out);border-radius:2px}',
    '.gnb-item:hover::after,.gnb-item.active-item::after{transform:scaleX(1)}',
    '.gnb-sub{position:absolute;top:calc(100% + 1px);left:50%;transform:translateX(-50%) translateY(10px);min-width:190px;background:rgba(4,26,64,0.97);backdrop-filter:blur(20px);border:1px solid var(--glass-border);border-radius:14px;padding:8px;opacity:0;pointer-events:none;transition:opacity .25s,transform .25s var(--ease-out);box-shadow:0 24px 64px rgba(0,0,0,0.5),0 0 0 1px rgba(26,107,255,0.15);z-index:200}',
    '.gnb-sub.wide{min-width:240px}',
    '.gnb-sub li a{display:block;padding:10px 14px;font-size:13px;font-weight:500;color:rgba(255,255,255,0.65);border-radius:8px;transition:color .15s,background .15s;white-space:nowrap}',
    '.gnb-sub li a:hover{color:#fff;background:rgba(26,107,255,0.25)}',
    '.gnb-sub li a.coming{color:rgba(255,255,255,0.3);pointer-events:none}',
    '.gnb-sub li a.coming::after{content:" (준비중)";font-size:11px}',
    '.gnb-sub li a.current{color:var(--accent);font-weight:700}',
    '.gnb-item:hover .gnb-sub,.gnb-item:focus-within .gnb-sub{opacity:1;pointer-events:auto;transform:translateX(-50%) translateY(0)}',
    '.nav-toggle{display:none;flex-direction:column;gap:5px;padding:8px}',
    '.nav-toggle span{display:block;width:22px;height:2px;background:#fff;border-radius:2px;transition:all .3s}',

    /* Page banner */
    '#page-banner{position:relative;z-index:1;padding:64px 40px 52px;border-bottom:1px solid var(--glass-border);overflow:hidden}',
    '.pb-blob{position:absolute;border-radius:50%;filter:blur(80px);pointer-events:none}',
    '.pb-blob-1{width:500px;height:500px;background:rgba(26,107,255,0.12);top:-200px;left:-100px}',
    '.pb-blob-2{width:300px;height:300px;background:rgba(56,191,255,0.08);top:-100px;right:200px}',
    '.pb-inner{position:relative;z-index:1;max-width:1100px;margin:0 auto}',
    '.page-crumb{display:flex;align-items:center;gap:8px;margin-bottom:20px;font-size:12px;color:rgba(255,255,255,0.35);font-family:var(--font-en);font-weight:600;letter-spacing:.06em}',
    '.page-crumb a{color:rgba(255,255,255,0.35);transition:color .2s}.page-crumb a:hover{color:rgba(255,255,255,0.7)}',
    '.page-crumb .sep{opacity:.4}.page-crumb .cur{color:var(--accent)}',
    '.page-eyebrow{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;font-family:var(--font-en);letter-spacing:.12em;color:var(--accent);text-transform:uppercase;margin-bottom:14px}',
    '.page-eyebrow::before,.page-eyebrow::after{content:"";display:block;width:20px;height:1px;background:var(--accent);opacity:0.5}',
    '.page-title{font-size:clamp(28px,4vw,48px);font-weight:900;line-height:1.15;letter-spacing:-.03em;margin-bottom:10px}',
    '.page-title .hl{background:linear-gradient(135deg,var(--blue) 0%,var(--accent) 100%);-webkit-background-clip:text;-webkit-text-fill-color:transparent;background-clip:text}',
    '.page-desc{font-size:15px;color:rgba(255,255,255,0.45)}',

    /* Page main wrapper */
    '#page-main{position:relative;z-index:1;max-width:1100px;margin:0 auto;padding:72px 40px 100px}',

    /* Footer */
    '#footer{position:relative;z-index:1;background:#020B1A;border-top:1px solid rgba(255,255,255,0.06);padding:60px 40px 36px}',
    '.ft-inner{max-width:1200px;margin:0 auto}',
    '.ft-top{display:grid;grid-template-columns:1fr auto;gap:60px;padding-bottom:44px;border-bottom:1px solid rgba(255,255,255,0.06)}',
    '.ft-logo{font-family:var(--font-en);font-size:22px;font-weight:900;color:#fff;letter-spacing:-.03em;margin-bottom:22px}',
    '.ft-logo span{color:var(--blue)}',
    '.ft-nav{display:flex;flex-wrap:wrap;gap:0;margin-bottom:22px}',
    '.ft-nav a{font-size:13px;font-weight:500;color:rgba(255,255,255,0.45);padding:0 16px;border-right:1px solid rgba(255,255,255,0.1);transition:color .15s;line-height:1}',
    '.ft-nav a:first-child{padding-left:0}.ft-nav a:hover{color:rgba(255,255,255,0.9)}.ft-nav a.hl{color:#60A5FA;font-weight:700}',
    '.ft-info p{font-size:12px;color:rgba(255,255,255,0.3);line-height:2.2}',
    '.ft-info a{color:rgba(255,255,255,0.4);transition:color .15s}.ft-info a:hover{color:rgba(255,255,255,0.8)}',
    '.ft-cs{text-align:right}',
    '.ft-cs-label{font-family:var(--font-en);font-size:10px;font-weight:800;letter-spacing:.15em;color:var(--blue);text-transform:uppercase;margin-bottom:10px}',
    '.ft-cs-tel{font-family:var(--font-en);font-size:38px;font-weight:900;color:#fff;letter-spacing:-.04em;margin-bottom:12px}',
    '.ft-cs-hours{font-size:12px;color:rgba(255,255,255,0.3);line-height:2}',
    '.ft-bottom{display:flex;align-items:center;justify-content:space-between;padding-top:28px;gap:16px}',
    '.ft-copy{font-size:12px;color:rgba(255,255,255,0.2);font-family:var(--font-en)}',
    '.ft-escrow{font-size:11px;color:rgba(255,255,255,0.25);border:1px solid rgba(255,255,255,0.1);padding:5px 14px;border-radius:100px;transition:color .2s,border-color .2s}',
    '.ft-escrow:hover{color:rgba(255,255,255,0.6);border-color:rgba(255,255,255,0.25)}',

    /* Sidebar */
    '#side-svc{position:fixed;right:0;top:50%;transform:translateY(-50%);z-index:800;display:flex;flex-direction:column}',
    '.side-item{width:60px;padding:14px 0;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:5px;background:rgba(4,26,64,0.95);backdrop-filter:blur(12px);border-left:3px solid var(--blue);border-bottom:1px solid rgba(255,255,255,0.06);cursor:pointer;transition:width .3s var(--ease-out),background .2s;overflow:hidden}',
    '.side-item:first-child{border-radius:12px 0 0 0}.side-item:last-child{border-bottom:none}',
    '.side-item:hover{background:var(--blue);width:68px}',
    '.side-item.coming{border-left-color:rgba(255,255,255,0.15);opacity:.5;cursor:default}',
    '.side-item.coming:hover{background:rgba(4,26,64,0.95);width:60px}',
    '.side-icon{font-size:18px}',
    '.side-txt{font-size:9px;font-weight:700;color:rgba(255,255,255,0.7);text-align:center;line-height:1.4;letter-spacing:.01em}',
    '.side-item:hover .side-txt{color:#fff}',
    '#btn-top{width:60px;height:48px;background:rgba(26,107,255,0.9);backdrop-filter:blur(12px);border-left:3px solid #0040D0;border-radius:0 0 0 12px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px;cursor:pointer;transition:background .2s}',
    '#btn-top:hover{background:var(--blue-deep)}',
    '#btn-top svg{width:16px;height:16px;color:#fff}',
    '#btn-top span{font-size:8px;font-weight:800;color:#fff;font-family:var(--font-en);letter-spacing:.1em}',

    /* Responsive */
    '@media(max-width:768px){',
      '#topbar{display:none}',
      '#side-svc{display:none}',
      '#page-main{padding:48px 20px 80px}',
      '#page-banner{padding:48px 20px 40px}',
      '#footer{padding:48px 20px 28px}',
      '#header{padding:0 16px}',
      '.logo-tagline{display:none}',

      '.gnb-footer{display:block}',

      /* ── 풀스크린 모바일 메뉴 ── */
      '#gnb{display:none;position:fixed;top:68px;left:0;right:0;bottom:0;background:#020D25;flex-direction:column;height:calc(100vh - 68px);overflow-y:auto;z-index:899}',
      '#gnb.open{display:flex}',

      /* GNB 상단 카테고리 라벨 */
      '.gnb-cat-label{padding:20px 24px 8px;font-size:10px;font-weight:800;letter-spacing:.16em;color:rgba(255,255,255,0.25);text-transform:uppercase;font-family:"Inter",sans-serif}',

      /* GNB 아이템 래퍼 */
      '.gnb-items{flex:1;display:flex;flex-direction:column;justify-content:space-evenly;overflow-y:auto}',
      /* GNB 아이템 */
      '.gnb-item{border-bottom:1px solid rgba(255,255,255,0.05)}.gnb-item:last-child{border-bottom:none}.gnb-item::after{display:none}',
      '.gnb-link{padding:16px 24px;font-size:clamp(14px,4vw,16px);font-weight:700;display:flex;justify-content:center;align-items:center;position:relative;color:rgba(255,255,255,0.85)}',
      '.gnb-link:hover{color:#fff;background:rgba(255,255,255,0.04)}',
      '.gnb-item.active-item>.gnb-link{color:#fff}',

      /* Chevron - absolutely positioned on right */
      '.gnb-chevron{position:absolute;right:20px;top:50%;transform:translateY(-50%);width:16px;height:16px;opacity:0.3;transition:transform .3s,opacity .3s}',
      '.gnb-item.open>.gnb-link .gnb-chevron{transform:translateY(-50%) rotate(180deg);opacity:0.7}',

      /* 서브메뉴 - 슬라이드 애니메이션 */
      '.gnb-sub{position:static;transform:none!important;opacity:1;pointer-events:none;box-shadow:none;background:rgba(255,255,255,0.02);border:none;border-top:0;border-radius:0;margin:0;padding:0;min-width:0;width:100%;max-height:0;overflow:hidden;transition:max-height .4s cubic-bezier(0.16,1,0.3,1)}',
      '.gnb-sub li a{padding:11px 24px;font-size:clamp(13px,3.5vw,14px);border-radius:0;white-space:normal;word-break:keep-all;color:rgba(255,255,255,0.55)}',
      '.gnb-sub li a:hover{color:#fff;background:rgba(26,107,255,0.08)}',
      '.gnb-sub li a.current{color:var(--accent);font-weight:700}',
      '.gnb-item.open .gnb-sub{max-height:500px;pointer-events:auto;border-top:1px solid rgba(255,255,255,0.04)}',

      /* 구분선 */
      '.gnb-divider{height:1px;background:rgba(255,255,255,0.06);margin:8px 0}',

      /* 하단 액션바 */
      '.gnb-footer{padding:20px 24px 32px;border-top:1px solid rgba(255,255,255,0.08);background:#020D25}',
      '.gnb-footer-tel{display:flex;align-items:center;gap:10px;margin-bottom:14px}',
      '.gnb-tel-icon{width:36px;height:36px;border-radius:10px;background:rgba(26,107,255,0.15);display:flex;align-items:center;justify-content:center}',
      '.gnb-tel-icon svg{width:16px;height:16px;color:var(--accent)}',
      '.gnb-tel-label{font-size:10px;color:rgba(255,255,255,0.3);font-family:"Inter",sans-serif;letter-spacing:.06em;margin-bottom:2px}',
      '.gnb-tel-num{font-size:20px;font-weight:900;color:#fff;font-family:"Inter",sans-serif;letter-spacing:-.03em}',
      '.gnb-footer-btns{display:grid;grid-template-columns:1fr 1fr;gap:10px}',
      '.gnb-footer-btn{display:flex;align-items:center;justify-content:center;gap:8px;padding:13px 16px;border-radius:12px;font-size:14px;font-weight:700;transition:opacity .2s}',
      '.gnb-footer-btn.primary{background:var(--blue);color:#fff}',
      '.gnb-footer-btn.ghost{background:rgba(255,255,255,0.07);border:1px solid rgba(255,255,255,0.12);color:rgba(255,255,255,0.8)}',
      '.gnb-footer-btn:hover{opacity:.85}',

      /* 햄버거 애니메이션 */
      '.nav-toggle{display:flex}',
      '.nav-toggle.open span:nth-child(1){transform:translateY(7px) rotate(45deg)}',
      '.nav-toggle.open span:nth-child(2){opacity:0;transform:scaleX(0)}',
      '.nav-toggle.open span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}',

      '.ft-top{grid-template-columns:1fr}.ft-cs{text-align:left}.ft-cs-tel{font-size:clamp(22px,6vw,28px)}',
      '.ft-bottom{flex-wrap:wrap}',
      '.ft-nav{flex-wrap:wrap;gap:8px 0}',
      '.ft-nav a{border-right:none;border-left:none;padding:4px 12px;border-left:1px solid rgba(255,255,255,0.1)}',
      '.ft-nav a:first-child{padding-left:0;border-left:none}',
    '}',
    '::-webkit-scrollbar{width:6px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:rgba(255,255,255,0.1);border-radius:3px}',
  ].join('');

  var styleEl = document.createElement('style');
  styleEl.textContent = css;
  document.head.insertBefore(styleEl, document.head.firstChild);

  /* ════════════════════════════════════════
     2. HTML 빌더
  ════════════════════════════════════════ */
  function _(section, page) {
    return {
      sec: SEC === section ? 'active-item' : '',
      lnk: SEC === section ? 'active' : '',
      sub: function(p) { return PAGE === p ? 'current' : ''; }
    };
  }

  function buildTopbar() {
    return '<div id="topbar"><div class="topbar-links">' +
      '<a href="' + ROOT + 'index.html#">' +
        '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>로그인</a>' +
      '<a href="http://nncmall.co.kr" target="_blank" class="tb-mall">학부모몰</a>' +
      '<a href="http://nncmall.com" target="_blank" class="tb-edu">교육기관몰 →</a>' +
      '<a href="' + ROOT + 'payment.html" class="tb-pay">결제하기 →</a>' +
    '</div></div>';
  }

  function buildHeader() {
    var co = _('company');
    var sv = _('service');
    var ct = _('contact');
    var cs = _('cs');
    var br = _('branch');
    var ir = _('ir');

    return '<header id="header">' +
      '<div class="logo-wrap"><a href="' + ROOT + 'index.html">' +
        '<img src="https://nncplus.com/data/banner/kVzlbyX61qZbVH7nwPME2RQAMYGuMr.png" alt="엔앤씨" class="logo-img"></a>' +
        '<span class="logo-tagline">SANITATION INFRA</span></div>' +
      '<nav id="gnb">' +
        '<div class="gnb-items">' +

        /* ── 메뉴 아이템 (index.html 동일 구조) ── */
        '<div class="gnb-item ' + co.sec + '">' +
          '<a href="' + ROOT + 'company/overview.html" class="gnb-link ' + co.lnk + '">회사소개</a>' +
          '<ul class="gnb-sub">' +
            '<li><a href="' + ROOT + 'company/overview.html" class="' + co.sub('overview') + '">회사개요</a></li>' +
            '<li><a href="' + ROOT + 'company/greeting.html" class="' + co.sub('greeting') + '">대표인사말</a></li>' +
            '<li><a href="' + ROOT + 'company/history.html" class="' + co.sub('history') + '">연혁</a></li>' +
            '<li><a href="' + ROOT + 'company/business.html" class="' + co.sub('business') + '">사업영역</a></li>' +
            '<li><a href="' + ROOT + 'company/certification.html" class="' + co.sub('certification') + '">특허 및 인증현황</a></li>' +
            '<li><a href="' + ROOT + 'company/organization.html" class="' + co.sub('organization') + '">조직도</a></li>' +
            '<li><a href="' + ROOT + 'company/location.html" class="' + co.sub('location') + '">오시는 길</a></li>' +
          '</ul>' +
        '</div>' +
        '<div class="gnb-item ' + sv.sec + '">' +
          '<a href="' + ROOT + 'payment.html" class="gnb-link ' + sv.lnk + '">서비스 신청</a>' +
          '<ul class="gnb-sub wide">' +
            '<li><a href="' + ROOT + 'payment.html" class="' + sv.sub('payment') + '">온라인 결제 신청</a></li>' +
            '<li><a href="https://nncplus.com/company/serviceKid1.php">키즈식판렌탈 서비스</a></li>' +
            '<li><a href="javascript:void(0)" class="coming">성인식판렌탈 서비스</a></li>' +
            '<li><a href="javascript:void(0)" class="coming">다회용기렌탈 서비스</a></li>' +
          '</ul>' +
        '</div>' +
        '<div class="gnb-item ' + ct.sec + '">' +
          '<a href="' + ROOT + 'contact/inquiry.html" class="gnb-link ' + ct.lnk + '">서비스 문의</a>' +
          '<ul class="gnb-sub">' +
            '<li><a href="' + ROOT + 'contact/inquiry.html" class="' + ct.sub('inquiry') + '">교육기관 문의</a></li>' +
            '<li><a href="' + ROOT + 'contact/parents.html" class="' + ct.sub('parents') + '">학부모 안내</a></li>' +
          '</ul>' +
        '</div>' +
        '<div class="gnb-item ' + cs.sec + '">' +
          '<a href="' + ROOT + 'cs/notice.html" class="gnb-link ' + cs.lnk + '">고객센터</a>' +
          '<ul class="gnb-sub">' +
            '<li><a href="' + ROOT + 'cs/notice.html" class="' + cs.sub('notice') + '">공지사항</a></li>' +
            '<li><a href="' + ROOT + 'cs/news.html" class="' + cs.sub('news') + '">소식</a></li>' +
            '<li><a href="' + ROOT + 'cs/faq.html" class="' + cs.sub('faq') + '">자주묻는 질문</a></li>' +
          '</ul>' +
        '</div>' +
        '<div class="gnb-item ' + br.sec + '">' +
          '<a href="' + ROOT + 'branch.html" class="gnb-link ' + br.lnk + '">지점</a>' +
        '</div>' +
        '<div class="gnb-item ' + ir.sec + '">' +
          '<a href="' + ROOT + 'ir.html" class="gnb-link ' + ir.lnk + '">IR</a>' +
        '</div>' +
        '</div>' + /* /gnb-items */

        /* ── 모바일 전용 하단 액션바 ── */
        '<div class="gnb-footer">' +
          '<div class="gnb-footer-tel">' +
            '<div class="gnb-tel-icon">' +
              '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.18h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.18 6.18l1.1-1.1a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>' +
            '</div>' +
            '<div>' +
              '<div class="gnb-tel-label">CS CENTER</div>' +
              '<div class="gnb-tel-num">1522-6308</div>' +
            '</div>' +
          '</div>' +
          '<div class="gnb-footer-btns">' +
            '<a href="tel:15226308" class="gnb-footer-btn ghost">📞 전화 상담</a>' +
            '<a href="' + ROOT + 'payment.html" class="gnb-footer-btn primary">결제 신청 →</a>' +
          '</div>' +
        '</div>' +

      '</nav>' +
      '<button class="nav-toggle" id="navToggle" aria-label="메뉴">' +
        '<span></span><span></span><span></span></button>' +
    '</header>';
  }

  function buildPageBanner() {
    var eyebrow = C.pageEyebrow || '';
    var title   = C.pageTitle   || '';
    var desc    = C.pageDesc    || '';
    var crumb   = C.crumb       || '';
    return '<section id="page-banner">' +
      '<div class="pb-blob pb-blob-1"></div><div class="pb-blob pb-blob-2"></div>' +
      '<div class="pb-inner">' +
        '<div class="page-crumb">' +
          '<a href="' + ROOT + 'index.html">HOME</a>' +
          '<span class="sep">/</span>' +
          (SEC === 'company' ? '<a href="' + ROOT + 'company/overview.html">회사소개</a><span class="sep">/</span>' : '') +
          (SEC === 'cs' ? '<a href="' + ROOT + 'cs/notice.html">고객센터</a><span class="sep">/</span>' : '') +
          (SEC === 'contact' ? '<a href="' + ROOT + 'contact/inquiry.html">서비스 문의</a><span class="sep">/</span>' : '') +
          '<span class="cur">' + crumb + '</span>' +
        '</div>' +
        '<div class="page-eyebrow">' + eyebrow + '</div>' +
        '<h1 class="page-title">' + title + '</h1>' +
        '<p class="page-desc">' + desc + '</p>' +
      '</div>' +
    '</section>';
  }

  function buildFooter() {
    return '<footer id="footer"><div class="ft-inner">' +
      '<div class="ft-top"><div>' +
        '<div class="ft-logo">N<span>&</span>C</div>' +
        '<nav class="ft-nav">' +
          '<a href="https://nncplus.com/bbs/provision.php">이용약관</a>' +
          '<a href="https://nncplus.com/bbs/policy.php" class="hl">개인정보처리방침</a>' +
          '<a href="' + ROOT + 'cs/notice.html">공지사항</a>' +
          '<a href="' + ROOT + 'cs/faq.html">자주묻는 질문</a>' +
        '</nav>' +
        '<div class="ft-info">' +
          '<p>주식회사 엔앤씨(N&amp;C) &nbsp;|&nbsp; 대표자. 소지선 &nbsp;|&nbsp; 주소. 경기도 용인시 처인구 모현읍 독점로 152, 1층</p>' +
          '<p>통신판매업신고. 제2024-용인처인-3143호 &nbsp;|&nbsp; 사업자등록번호. 894-81-03435</p>' +
          '<p>팩스. 031-8056-9890 &nbsp;|&nbsp; 이메일. nncplus@naver.com</p>' +
        '</div>' +
      '</div>' +
      '<div class="ft-cs">' +
        '<div class="ft-cs-label">CS Center</div>' +
        '<div class="ft-cs-tel">1522-6308</div>' +
        '<div class="ft-cs-hours"><p>상담 오전 09시 ~ 오후 18시 (토/일, 공휴일 휴무)</p><p>점심 오후 12시 ~ 오후 13시</p></div>' +
      '</div></div>' +
      '<div class="ft-bottom">' +
        '<p class="ft-copy">Copyright ⓒ N&C Inc. All rights reserved.</p>' +
        '<a href="javascript:void(0)" class="ft-escrow">에스크로 가입 사실 확인</a>' +
      '</div></div></footer>';
  }

  function buildSidebar() {
    return '<aside id="side-svc">' +
      '<a href="' + ROOT + 'payment.html" class="side-item">' +
        '<div class="side-icon">💳</div><div class="side-txt">온라인<br>결제신청</div></a>' +
      '<span class="side-item coming" onclick="alert(\'준비중 입니다.\');">' +
        '<div class="side-icon">🍽</div><div class="side-txt">성인식판<br>렌탈신청</div></span>' +
      '<span class="side-item coming" onclick="alert(\'준비중 입니다.\');">' +
        '<div class="side-icon">♻️</div><div class="side-txt">다회용기<br>렌탈신청</div></span>' +
      '<button id="btn-top" onclick="window.scrollTo({top:0,behavior:\'smooth\'})">' +
        '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><path d="M18 15l-6-6-6 6"/></svg>' +
        '<span>TOP</span></button>' +
    '</aside>';
  }

  /* ════════════════════════════════════════
     3. DOM 주입 + JS 초기화
  ════════════════════════════════════════ */
  document.addEventListener('DOMContentLoaded', function () {
    var main = document.getElementById('page-main');
    if (!main) return;

    // 상단: cursor, canvas, topbar, header, page-banner
    document.body.insertAdjacentHTML('afterbegin',
      '<div id="cursor-glow"></div>' +
      '<canvas id="bg-canvas"></canvas>' +
      buildTopbar() +
      buildHeader() +
      buildPageBanner()
    );

    // 하단: footer, sidebar
    document.body.insertAdjacentHTML('beforeend',
      buildFooter() +
      buildSidebar()
    );

    // JS 초기화
    initCursor();
    initParticles();
    initHeaderScroll();
    initMobileNav();
  });

  /* ── Cursor glow ── */
  function initCursor() {
    var g = document.getElementById('cursor-glow');
    document.addEventListener('mousemove', function (e) {
      g.style.left = e.clientX + 'px';
      g.style.top  = e.clientY + 'px';
    }, { passive: true });
  }

  /* ── Particle canvas ── */
  function initParticles() {
    var canvas = document.getElementById('bg-canvas');
    var ctx = canvas.getContext('2d');
    var W, H, particles = [];

    function resize() {
      W = canvas.width  = window.innerWidth;
      H = canvas.height = document.body.scrollHeight;
    }

    function Particle() { this.reset(); }
    Particle.prototype.reset = function () {
      this.x = Math.random() * W; this.y = Math.random() * H;
      this.r = Math.random() * 1.5 + 0.3;
      this.vx = (Math.random() - 0.5) * 0.3; this.vy = (Math.random() - 0.5) * 0.3;
      this.alpha = Math.random() * 0.4 + 0.1;
      this.color = Math.random() > 0.6 ? '#38BFFF' : '#1A6BFF';
    };
    Particle.prototype.update = function () {
      this.x += this.vx; this.y += this.vy;
      if (this.x < 0 || this.x > W || this.y < 0 || this.y > H) this.reset();
    };
    Particle.prototype.draw = function () {
      ctx.beginPath(); ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color; ctx.globalAlpha = this.alpha; ctx.fill();
    };

    function init() {
      particles = [];
      var count = Math.min(Math.floor((W * H) / 15000), 120);
      for (var i = 0; i < count; i++) particles.push(new Particle());
    }

    function animate() {
      ctx.clearRect(0, 0, W, H);
      var max = 120;
      for (var i = 0; i < particles.length; i++) {
        for (var j = i + 1; j < particles.length; j++) {
          var dx = particles[i].x - particles[j].x;
          var dy = particles[i].y - particles[j].y;
          var d  = Math.sqrt(dx * dx + dy * dy);
          if (d < max) {
            ctx.beginPath(); ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = '#1A6BFF'; ctx.globalAlpha = (1 - d / max) * 0.12;
            ctx.lineWidth = 0.5; ctx.stroke();
          }
        }
      }
      particles.forEach(function (p) { p.update(); p.draw(); });
      ctx.globalAlpha = 1;
      requestAnimationFrame(animate);
    }

    window.addEventListener('resize', function () { resize(); init(); });
    resize(); init(); animate();
  }

  /* ── Header scroll ── */
  function initHeaderScroll() {
    var hdr = document.getElementById('header');
    window.addEventListener('scroll', function () {
      hdr.classList.toggle('solid', window.scrollY > 30);
    }, { passive: true });
  }

  /* ── Mobile nav ── */
  function initMobileNav() {
    var toggle = document.getElementById('navToggle');
    var gnb    = document.getElementById('gnb');
    if (!toggle || !gnb) return;

    toggle.addEventListener('click', function () {
      gnb.classList.toggle('open');
      toggle.classList.toggle('open');
    });

    document.addEventListener('click', function (e) {
      if (gnb.classList.contains('open') && !gnb.contains(e.target) && !toggle.contains(e.target)) {
        gnb.classList.remove('open');
        toggle.classList.remove('open');
      }
    });

    if (window.innerWidth <= 768) {
      document.querySelectorAll('.gnb-item').forEach(function (item) {
        var link = item.querySelector('.gnb-link');
        var sub  = item.querySelector('.gnb-sub');
        if (sub && link) {
          var svg  = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
          svg.setAttribute('class', 'gnb-chevron');
          svg.setAttribute('viewBox', '0 0 24 24');
          svg.setAttribute('fill', 'none');
          svg.setAttribute('stroke', 'currentColor');
          svg.setAttribute('stroke-width', '2.5');
          var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
          path.setAttribute('d', 'M6 9l6 6 6-6');
          svg.appendChild(path);
          link.appendChild(svg);
          link.addEventListener('click', function (e) {
            e.preventDefault();
            document.querySelectorAll('.gnb-item.open').forEach(function (o) { if (o !== item) o.classList.remove('open'); });
            item.classList.toggle('open');
          });
        }
      });
    }
  }

})();
