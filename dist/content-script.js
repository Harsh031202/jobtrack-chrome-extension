function F(t){try{const e=new URL(t).hostname.toLowerCase();if(e.includes("linkedin.com"))return"LinkedIn";if(e.includes("naukri.com"))return"Naukri";if(e.includes("indeed.com"))return"Indeed";if(e.includes("greenhouse.io"))return"Greenhouse";if(e.includes("lever.co"))return"Lever";if(e.includes("wellfound.com")||e.includes("angel.co"))return"Wellfound";if(e.includes("internshala.com"))return"Internshala";if(e.includes("workday.com")||e.includes("myworkdayjobs.com"))return"Workday";if(e.includes("smartrecruiters.com"))return"SmartRecruiters";if(e.includes("ashbyhq.com"))return"Ashby";if(e.includes("glassdoor.com"))return"Glassdoor";if(e.includes("ziprecruiter.com"))return"ZipRecruiter";const o=e.replace(/^www\./,"").split(".");return o.length>=2?o[0].charAt(0).toUpperCase()+o[0].slice(1)+" Careers":"Company Website"}catch{return"Other"}}function C(){const t=window.location.href,e=document.title||"",o=window.location.hostname,i=F(t),l=[];try{document.querySelectorAll('script[type="application/ld+json"]').forEach(s=>{var n;try{const r=(n=s.textContent)==null?void 0:n.trim();r&&l.push(JSON.parse(r))}catch{}})}catch(a){console.debug("JobTrack: JSON-LD extraction skipped",a)}const m={};try{document.querySelectorAll("meta").forEach(n=>{const r=n.getAttribute("property")||n.getAttribute("name"),h=n.getAttribute("content");r&&h&&(m[r]=h)});const s=[".job-details-jobs-unified-top-card__company-logo img",".jobs-unified-top-card__company-logo img",".jobs-company__logo img",".topcard__org-name-image",'[data-testid="employer-logo"] img',".jobsearch-CompanyAvatar img","#header img",".main-header-logo img",'[data-automation-id="companyLogo"] img',".header-logo img",".company-info .company-logo img",'img[class*="company-logo" i]','img[class*="companyLogo" i]','img[class*="employer-logo" i]'];for(const n of s){const r=document.querySelector(n);if(r&&r.src&&!r.src.startsWith("data:image/svg")){m["jobtrack:dom_company_logo"]=r.src;break}}}catch(a){console.debug("JobTrack: Meta extraction skipped",a)}const x=[];try{document.querySelectorAll("h1, h2").forEach(s=>{var r;const n=(r=s.textContent)==null?void 0:r.replace(/\s+/g," ").trim();n&&n.length>3&&n.length<120&&x.push(n)})}catch(a){console.debug("JobTrack: Heading extraction skipped",a)}let g="";try{const n=([document.querySelector("main"),document.querySelector("article"),document.querySelector(".jobs-description"),document.querySelector("#job-details"),document.querySelector(".job-description"),document.querySelector('[data-testid="job-description"]'),document.querySelector(".job-details"),document.body].find(y=>y!==null)||document.body).cloneNode(!0);["script","style","noscript","nav","header","footer","svg","iframe","button","form","aside",".cookie-banner","#cookie-banner",".advertisement",".ad-banner"].forEach(y=>{try{n.querySelectorAll(y).forEach(S=>S.remove())}catch{}}),g=(n.innerText||n.textContent||"").replace(/[ \t]+/g," ").replace(/\n\s*\n+/g,`
`).trim().slice(0,5500)}catch(a){console.debug("JobTrack: Body text extraction error",a),g=document.body?document.body.innerText.slice(0,3e3):""}return{url:t,title:e,domain:o,metaTags:m,jsonLdList:l,headings:x.slice(0,5),cleanTextSnippet:g,detectedSource:i}}let c=null,d=null,p=null,u=null;const j=`
  <svg viewBox="0 0 32 32" width="22" height="22" fill="none" style="flex-shrink:0;">
    <rect width="32" height="32" rx="7.5" fill="#18191D"/>
    <rect x="0.5" y="0.5" width="31" height="31" rx="7" stroke="#333842" stroke-width="1"/>
    <circle cx="10.5" cy="10" r="2.5" fill="#10B981"/>
    <path d="M15 9.5H22V19C22 21.8 19.8 24 17 24C14.2 24 12 21.8 12 19V17" stroke="#FFFFFF" stroke-width="2.75" stroke-linecap="round" stroke-linejoin="round"/>
  </svg>
`;function f(t){return t.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;").replace(/'/g,"&#039;")}function T(){if(d&&c&&document.contains(c))return d;const t=document.getElementById("jobtrack-floating-host");t&&t.remove(),c=document.createElement("div"),c.id="jobtrack-floating-host",c.style.cssText="all: initial; position: fixed; z-index: 2147483647; bottom: 24px; right: 24px; pointer-events: none;",document.documentElement.appendChild(c),d=c.attachShadow({mode:"open"});const e=document.createElement("style");e.textContent=`
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
      -webkit-font-smoothing: antialiased;
    }

    .jt-container {
      position: relative;
      pointer-events: auto;
    }

    /* 1. Initial Tracking Card: Slowly minimizes into a small pill */
    .jt-tracking-box {
      width: 320px;
      background: rgba(22, 27, 34, 0.98);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.16);
      border-radius: 18px;
      padding: 14px 16px;
      box-shadow: 0 16px 36px -6px rgba(0, 0, 0, 0.6), 0 8px 16px -6px rgba(0, 0, 0, 0.4);
      color: #F0F6FC;
      transition: all 0.75s cubic-bezier(0.16, 1, 0.3, 1);
      overflow: hidden;
      animation: jtBoxEnter 0.35s cubic-bezier(0.16, 1, 0.3, 1);
    }

    @keyframes jtBoxEnter {
      0% {
        opacity: 0;
        transform: translateY(20px) scale(0.92);
      }
      100% {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    .jt-box-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      margin-bottom: 8px;
    }

    .jt-box-title {
      font-size: 13px;
      font-weight: 700;
      color: #F0F6FC;
      letter-spacing: -0.01em;
    }

    .jt-box-subtitle {
      font-size: 11px;
      color: #8B949E;
      margin-top: 1px;
    }

    .jt-progress-bar {
      height: 3px;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 9999px;
      overflow: hidden;
      position: relative;
      margin-top: 6px;
    }

    .jt-progress-fill {
      position: absolute;
      top: 0;
      left: 0;
      bottom: 0;
      width: 40%;
      background: linear-gradient(90deg, #E05638, #FF8A77);
      border-radius: 9999px;
      animation: jtShimmer 1.4s ease-in-out infinite alternate;
    }

    @keyframes jtShimmer {
      0% { left: 0%; width: 25%; }
      100% { left: 75%; width: 35%; }
    }

    /* Morphing into the compact pill */
    .jt-tracking-box.jt-is-pill {
      width: 270px;
      border-radius: 9999px;
      padding: 8px 14px;
      display: flex;
      align-items: center;
      gap: 10px;
      box-shadow: 0 10px 24px -4px rgba(0, 0, 0, 0.5);
    }

    .jt-tracking-box.jt-is-pill .jt-progress-bar,
    .jt-tracking-box.jt-is-pill .jt-box-subtitle {
      display: none;
    }

    .jt-tracking-box.jt-is-pill .jt-box-top {
      margin-bottom: 0;
      width: 100%;
    }

    /* Disappearing state after 5 seconds */
    .jt-tracking-box.jt-hidden,
    .jt-pill.jt-hidden {
      opacity: 0 !important;
      transform: translateY(20px) scale(0.92) !important;
      pointer-events: none !important;
      transition: all 0.5s cubic-bezier(0.16, 1, 0.3, 1) !important;
    }

    .jt-spinner {
      width: 13px;
      height: 13px;
      border: 2px solid rgba(255, 255, 255, 0.2);
      border-top-color: #E05638;
      border-radius: 50%;
      animation: jtSpin 0.75s linear infinite;
      flex-shrink: 0;
    }

    @keyframes jtSpin {
      to { transform: rotate(360deg); }
    }

    /* 2. Ready Pill at Bottom-Right (No center modal) */
    .jt-pill {
      display: flex;
      align-items: center;
      gap: 12px;
      background: rgba(22, 27, 34, 0.98);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      border: 1px solid rgba(255, 255, 255, 0.16);
      color: #F0F6FC;
      padding: 9px 15px;
      border-radius: 9999px;
      box-shadow: 0 14px 30px -4px rgba(0, 0, 0, 0.55), 0 6px 12px -4px rgba(0, 0, 0, 0.4);
      max-width: 460px;
      cursor: pointer;
      user-select: none;
      animation: jtPillSlideIn 0.35s cubic-bezier(0.16, 1, 0.3, 1);
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .jt-pill:hover {
      transform: translateY(-2px);
      box-shadow: 0 18px 36px -4px rgba(0, 0, 0, 0.65);
    }

    @keyframes jtPillSlideIn {
      from { opacity: 0; transform: translateY(18px) scale(0.95); }
      to { opacity: 1; transform: translateY(0) scale(1); }
    }

    .jt-ready-content {
      display: flex;
      flex-direction: column;
      gap: 1px;
      max-width: 250px;
      overflow: hidden;
    }

    .jt-ready-badge {
      font-size: 10px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #34D399;
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .jt-dot-green {
      display: inline-block;
      width: 6px;
      height: 6px;
      border-radius: 50%;
      background: #10B981;
    }

    .jt-ready-title {
      font-size: 12px;
      font-weight: 700;
      color: #F0F6FC;
      white-space: nowrap;
      text-overflow: ellipsis;
      overflow: hidden;
    }

    .jt-btn-open-ext {
      background: #E05638;
      color: #FFFFFF;
      border: none;
      border-radius: 9999px;
      padding: 6px 14px;
      font-size: 11px;
      font-weight: 700;
      cursor: pointer;
      white-space: nowrap;
      transition: background 0.15s ease, transform 0.1s ease;
      box-shadow: 0 2px 6px rgba(224, 86, 56, 0.4);
      flex-shrink: 0;
    }

    .jt-btn-open-ext:hover {
      background: #EE7356;
      transform: translateY(-1px);
    }

    .jt-btn-open-ext:active {
      background: #CA472A;
      transform: translateY(0);
    }

    .jt-btn-close {
      background: transparent;
      border: none;
      color: #656D76;
      font-size: 15px;
      line-height: 1;
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      border-radius: 50%;
      transition: color 0.15s, background 0.15s;
      flex-shrink: 0;
    }

    .jt-btn-close:hover {
      color: #F0F6FC;
      background: rgba(255, 255, 255, 0.1);
    }

    .jt-success-toast {
      background: #10B981;
      color: #FFFFFF;
      padding: 9px 16px;
      border-radius: 9999px;
      font-size: 12px;
      font-weight: 700;
      display: flex;
      align-items: center;
      gap: 6px;
      box-shadow: 0 6px 16px rgba(16, 185, 129, 0.35);
      animation: jtPillSlideIn 0.25s ease-out;
    }
  `,d.appendChild(e);const o=document.createElement("div");return o.className="jt-container",o.id="jt-content-area",d.appendChild(o),d}function L(){var o;p&&clearTimeout(p),u&&clearTimeout(u);const t=T(),e=t.getElementById("jt-content-area");e&&(e.innerHTML=`
    <div class="jt-tracking-box" id="jt-tracking-box">
      <div class="jt-box-top">
        <div style="display:flex; align-items:center; gap:8px;">
          ${j}
          <div>
            <div class="jt-box-title">Tracking Job Application…</div>
            <div class="jt-box-subtitle">Extracting company, role & compensation</div>
          </div>
        </div>
        <button class="jt-btn-close" id="jt-box-close" title="Dismiss">✕</button>
      </div>
      <div class="jt-progress-bar">
        <div class="jt-progress-fill"></div>
      </div>
    </div>
  `,(o=t.getElementById("jt-box-close"))==null||o.addEventListener("click",()=>b()),u=setTimeout(()=>{var l;const i=t.getElementById("jt-tracking-box");i&&(i.classList.add("jt-is-pill"),i.innerHTML=`
        <div class="jt-box-top">
          <div style="display:flex; align-items:center; gap:8px;">
            ${j}
            <div class="jt-spinner"></div>
            <span style="font-size:12px; font-weight:600; color:#F0F6FC;">Tracking application…</span>
          </div>
          <button class="jt-btn-close" id="jt-pill-close" title="Dismiss">✕</button>
        </div>
      `,(l=t.getElementById("jt-pill-close"))==null||l.addEventListener("click",()=>b()))},1200),p=setTimeout(()=>{const i=t.getElementById("jt-tracking-box");i&&i.classList.add("jt-hidden")},5e3))}function k(t){var x,g,a,s;p&&clearTimeout(p),u&&clearTimeout(u),typeof chrome<"u"&&((x=chrome.runtime)!=null&&x.sendMessage)&&chrome.runtime.sendMessage({action:"OPEN_POPUP"}).catch(()=>{});const e=T(),o=e.getElementById("jt-content-area");if(!o)return;const i=t.role||"Job Application",l=t.company||"Company";o.innerHTML=`
    <div class="jt-pill" id="jt-ready-pill" title="Click to open JobTrack approval">
      ${j}
      <div class="jt-ready-content">
        <span class="jt-ready-badge">
          <span class="jt-dot-green"></span>Ready for approval
        </span>
        <span class="jt-ready-title" title="${f(i)} at ${f(l)}">
          <strong>${f(i)}</strong> at ${f(l)}
        </span>
      </div>
      <button class="jt-btn-open-ext" id="jt-btn-open-popup">Approve</button>
      <button class="jt-btn-close" id="jt-btn-dismiss" title="Dismiss">✕</button>
    </div>
  `;const m=()=>{var n;typeof chrome<"u"&&((n=chrome.runtime)!=null&&n.sendMessage)&&chrome.runtime.sendMessage({action:"OPEN_POPUP"})};(g=e.getElementById("jt-ready-pill"))==null||g.addEventListener("click",n=>{n.target.id!=="jt-btn-dismiss"&&m()}),(a=e.getElementById("jt-btn-open-popup"))==null||a.addEventListener("click",n=>{n.stopPropagation(),m()}),(s=e.getElementById("jt-btn-dismiss"))==null||s.addEventListener("click",n=>{var r;n.stopPropagation(),b(),typeof chrome<"u"&&((r=chrome.runtime)!=null&&r.sendMessage)&&chrome.runtime.sendMessage({action:"DISCARD_PENDING_APPROVAL"})})}function b(){p&&clearTimeout(p),u&&clearTimeout(u),c&&document.contains(c)&&(c.remove(),c=null,d=null)}var v;typeof chrome<"u"&&((v=chrome.runtime)!=null&&v.onMessage)&&chrome.runtime.onMessage.addListener((t,e,o)=>{if((t==null?void 0:t.action)==="EXTRACT_PAGE_DATA"){try{const i=C();o({success:!0,data:i})}catch(i){o({success:!1,error:(i==null?void 0:i.message)||"Extraction failed"})}return!0}return(t==null?void 0:t.action)==="SHOW_TRACKING_PILL"?(L(),o({success:!0}),!0):(t==null?void 0:t.action)==="TRACKING_COMPLETE"?(k(t.data),o({success:!0}),!0):((t==null?void 0:t.action)==="DISMISS_PILL"&&(b(),o({success:!0})),!0)});var w;typeof chrome<"u"&&((w=chrome.storage)!=null&&w.onChanged)&&chrome.storage.onChanged.addListener((t,e)=>{if(e==="local"&&t.jobtrack_pending_approval&&!t.jobtrack_pending_approval.newValue){const o=d,i=o==null?void 0:o.getElementById("jt-content-area");i?(i.innerHTML=`
          <div class="jt-success-toast">
            ✓ Application Saved to JobTrack!
          </div>
        `,setTimeout(()=>b(),1600)):b()}});var E;typeof chrome<"u"&&((E=chrome.storage)!=null&&E.local)&&chrome.storage.local.get("jobtrack_pending_approval",t=>{const e=t==null?void 0:t.jobtrack_pending_approval;if(e&&e.extractedData&&e.pageUrl)try{const o=window.location.href.split("?")[0].split("#")[0],i=e.pageUrl.split("?")[0].split("#")[0];o===i&&k(e.extractedData)}catch{window.location.href===e.pageUrl&&k(e.extractedData)}});
