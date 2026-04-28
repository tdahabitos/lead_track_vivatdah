/**
 * ============================================================
 *  LeadTrack v5 — Script de Tracking Nativo + Mautic Sync
 *  Projeto: VivaTDAH
 *  Destino: Supabase RPC (lt_ingest_event)
 * ============================================================
 */
(function () {
  "use strict";

  // ============================================================
  //  CONFIGURAÇÃO
  // ============================================================
  var CONFIG = {
    trackUrl: "https://zvxttgsilqqcmpuzgcoy.supabase.co/rest/v1/rpc/lt_ingest_event",
    apiKey: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inp2eHR0Z3NpbHFxY21wdXpnY295Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzM2OTQ1NTAsImV4cCI6MjA4OTI3MDU1MH0.5TXF-zeRS47skT04Uq-1k8FcvkOsWZrmwjgH9-S9218",
    companySlug: "vivatdah",
    mauticUrl: "https://mautic.vivatdah.com.br", // URL do seu Mautic
    cookieDays: 3650, 
    debug: true,
  };

  function log(msg, data) {
    if (CONFIG.debug && typeof console !== "undefined") {
      console.log("[LeadTrack]", msg, data !== undefined ? data : "");
    }
  }

  // ============================================================
  //  DISPOSITIVO & TECNOLOGIA
  // ============================================================
  function getDeviceInfo() {
    var ua = navigator.userAgent;
    var os = "Outro", device = "Desktop", browser = "Outro";
    if (/Android/i.test(ua)) { os = "Android"; device = "Mobile"; }
    else if (/iPhone|iPad|iPod/i.test(ua)) { os = "iOS"; device = "Mobile"; }
    else if (/Windows/i.test(ua)) { os = "Windows"; }
    else if (/Macintosh/i.test(ua)) { os = "MacOS"; }
    if (/instagram/i.test(ua)) browser = "Instagram";
    else if (/fbav|fban/i.test(ua)) browser = "Facebook App";
    else if (/Chrome/i.test(ua)) browser = "Chrome";
    else if (/Safari/i.test(ua) && !/Chrome/i.test(ua)) browser = "Safari";
    return { os: os, device: device, browser: browser };
  }

  // ============================================================
  //  STORAGE HELPERS
  // ============================================================
  function getRootDomain() {
    try {
      var hostname = window.location.hostname;
      var parts = hostname.split(".");
      return parts.length > 2 ? "." + parts.slice(-2).join(".") : "." + hostname;
    } catch (e) { return null; }
  }

  function setStorage(name, value, days) {
    try {
      var d = new Date();
      d.setTime(d.getTime() + (days || CONFIG.cookieDays) * 86400000);
      var domainAttr = getRootDomain() ? "; domain=" + getRootDomain() : "";
      document.cookie = name + "=" + encodeURIComponent(String(value)) + "; expires=" + d.toUTCString() + "; path=/; SameSite=Lax" + domainAttr;
    } catch (e) { }
    try { localStorage.setItem(name, String(value)); } catch (e) { }
  }

  function getStorage(name) {
    try {
      var nameEQ = name + "=";
      var parts = document.cookie.split(";");
      for (var i = 0; i < parts.length; i++) {
        var c = parts[i].trim();
        if (c.indexOf(nameEQ) === 0) return decodeURIComponent(c.substring(nameEQ.length));
      }
    } catch (e) { }
    try { return localStorage.getItem(name); } catch (e) { return null; }
  }

  function generateUUID() {
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }

  // ============================================================
  //  IDENTIDADE CORE (URL First -> Cookie Second)
  // ============================================================
  var urlParams = new URLSearchParams(window.location.search);
  var ltId = urlParams.get("lt_id") || getStorage("lt_id");
  
  if (!ltId) {
    ltId = "lt_" + Date.now() + "_" + generateUUID().replace(/-/g, "").substring(0, 12);
  }
  setStorage("lt_id", ltId, CONFIG.cookieDays);

  var sessionId = generateUUID();
  var referrer = document.referrer || "direct";

  // ============================================================
  //  MAUTIC SYNC (Injeção Segura)
  // ============================================================
  if (CONFIG.mauticUrl) {
    (function(w,d,t,u,n,a,m){w['MauticTrackingObject']=n;
      w[n]=w[n]||function(){(w[n].q=w[n].q||[]).push(arguments)},a=d.createElement(t),
      m=d.getElementsByTagName(t)[0];a.async=1;a.src=u;m.parentNode.insertBefore(a,m)
    })(window,document,'script', CONFIG.mauticUrl + '/mtc.js','mt');
    
    // Sempre envia o lt_id para o Mautic manter a conexão
    window.mt('send', 'pageview', { tags: "LeadTrack, lt_id:" + ltId });
  }

  // ============================================================
  //  UTMs
  // ============================================================
  function getUTMs() {
    var params = new URLSearchParams(window.location.search);
    var utms = {};
    ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term"].forEach(function(k) {
      if (params.get(k)) utms[k] = params.get(k);
    });
    return utms;
  }

  // ============================================================
  //  ENVIO DE EVENTOS
  // ============================================================
  function sendEvent(eventType, extraData) {
    var payload = {
      lt_id: ltId,
      company_slug: CONFIG.companySlug,
      session_id: sessionId,
      event_type: eventType,
      page_url: window.location.href,
      page_path: window.location.pathname,
      page_title: document.title,
      referrer: referrer,
      user_agent: navigator.userAgent,
      device_type: getDeviceInfo().device,
      os_name: getDeviceInfo().os,
      browser_name: getDeviceInfo().browser,
      fbp: getStorage("_fbp"),
      fbc: getStorage("_fbc"),
      metadata: extraData || {},
    };

    var utms = getUTMs();
    for (var k in utms) payload[k] = utms[k];

    log("→ [" + eventType + "]", payload);

    fetch(CONFIG.trackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json", "apikey": CONFIG.apiKey },
      body: JSON.stringify({ payload: payload }),
      keepalive: true
    }).catch(function(e) { log("Error", e); });
  }

  // ============================================================
  //  LISTENERS
  // ============================================================
  
  // Pageview inicial
  sendEvent("pageview");

  // Scroll
  var scrollFired = {};
  window.addEventListener("scroll", function() {
    var el = document.documentElement;
    var pct = Math.round((el.scrollTop / (el.scrollHeight - el.clientHeight)) * 100);
    [25, 50, 75, 90, 100].forEach(function(t) {
      if (pct >= t && !scrollFired[t]) {
        scrollFired[t] = true;
        sendEvent("scroll", { scroll_percent: t });
      }
    });
  }, { passive: true });

  // Click
  document.addEventListener("click", function (e) {
    var el = e.target;
    while (el && el !== document) {
      if (el.tagName === "A" || el.tagName === "BUTTON" || el.getAttribute("data-lt-track")) {
        sendEvent("click", {
          element_text: (el.innerText || "").trim().substring(0, 50),
          element_id: el.id || null,
          element_href: el.href || null
        });
        break;
      }
      el = el.parentElement;
    }
  }, true);

  // Form Submit
  document.addEventListener("submit", function (e) {
    var form = e.target;
    var data = {};
    var emailEl = form.querySelector("input[type='email'], [name*='email']");
    var nameEl = form.querySelector("[name*='name'], [name*='nome']");
    var phoneEl = form.querySelector("input[type='tel'], [name*='phone'], [name*='whatsapp'], [name*='tel'], [name*='celular'], [name*='mobile']");
    
    if (emailEl) data.lead_email = emailEl.value;
    if (nameEl) data.lead_name = nameEl.value;
    if (phoneEl) data.lead_phone = phoneEl.value;
    
    // Sincronia com Mautic agora é feita via Database Trigger (Server-Side) para 100% de confiabilidade.
    sendEvent("form_submit", data);
  }, true);

  // Time on Page
  var enterTime = Date.now();
  var timeFired = {};
  setInterval(function () {
    var secs = Math.round((Date.now() - enterTime) / 1000);
    [30, 60, 120, 300].forEach(function(t) {
      if (secs >= t && !timeFired[t]) {
        timeFired[t] = true;
        sendEvent("time_on_page", { seconds: t });
      }
    });
  }, 5000);

  // Exit Intent
  document.addEventListener("mouseleave", function (e) {
    if (e.clientY < 10) sendEvent("exit_intent", { scroll_percent: Math.round((window.pageYOffset / (document.documentElement.scrollHeight - window.innerHeight)) * 100) });
  }, false);

  // Page Hide
  window.addEventListener("visibilitychange", function() {
    if (document.visibilityState === "hidden") {
      sendEvent("page_hide", { time_on_page: Math.round((Date.now() - enterTime) / 1000) });
    }
  });

  var leadContext = null;
  var onReadyCallbacks = [];

  // Rehidratação de Identidade com Cache (Etapa 4 - Performance)
  function loadCachedContext() {
    var cached = getStorage("lt_context");
    if (cached) {
      try {
        leadContext = JSON.parse(cached);
        log("🚀 Contexto carregado via Cache:", leadContext.name);
        triggerReady();
      } catch (e) { }
    }
  }

  function triggerReady() {
    onReadyCallbacks.forEach(function(cb) { 
      if (typeof cb === "function") cb(leadContext); 
    });
  }

  async function fetchContext() {
    if (!ltId) return;
    try {
      var contextUrl = CONFIG.trackUrl.replace("lt_ingest_event", "lt_get_lead_context");
      var response = await fetch(contextUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "apikey": CONFIG.apiKey,
          "Authorization": "Bearer " + CONFIG.apiKey
        },
        body: JSON.stringify({ p_company_slug: CONFIG.companySlug, p_lt_id: ltId })
      });
      var freshContext = await response.json();
      
      // Só atualiza se houver mudança ou se não tiver cache
      if (JSON.stringify(freshContext) !== JSON.stringify(leadContext)) {
        leadContext = freshContext;
        setStorage("lt_context", JSON.stringify(leadContext), 7); // Cache por 7 dias
        log("👤 Contexto atualizado via DB:", leadContext.name || "Anônimo");
        triggerReady();
      }
    } catch (e) {
      log("❌ Erro ao carregar contexto:", e.message);
    }
  }

  // Atribuição de Checkout Universal (Etapa 2 do Plano)
  function decorateLinks() {
    var checkoutDomains = ["hotmart.com", "pay.hotmart.com", "eduzz.com", "sun.eduzz.com", "digitalguru.com.br", "kiwify.com.br", "pay.kiwify.com.br", "perfectpay.com.br"];
    var links = document.getElementsByTagName("a");
    
    for (var i = 0; i < links.length; i++) {
      var href = links[i].href;
      if (!href) continue;

      var isCheckout = checkoutDomains.some(function(domain) {
        return href.indexOf(domain) !== -1;
      });

      if (isCheckout && href.indexOf("lt_id=") === -1) {
        var separator = href.indexOf("?") === -1 ? "?" : "&";
        links[i].href = href + separator + "lt_id=" + ltId + "&src=lt_" + ltId;
        log("🔗 Link de Checkout Decorado:", links[i].href);
      }
    }
  }

  // API PÚBLICA
  window.LeadTrack = {
    identify: function(d) { 
      return sendEvent("identify", d).then(function() { fetchContext(); }); 
    },
    track: function(n, d) { sendEvent(n, d); },
    getUserId: function() { return ltId; },
    getContext: function() { return leadContext; },
    onReady: function(cb) {
      if (leadContext) cb(leadContext);
      else onReadyCallbacks.push(cb);
    }
  };

  // Link Decorators (Sincronia via URL)
  (function checkDecorators() {
    var d = {};
    if (urlParams.get("lt_email")) d.email = urlParams.get("lt_email");
    if (urlParams.get("lt_name")) d.name = urlParams.get("lt_name");
    if (urlParams.get("lt_phone")) d.phone = urlParams.get("lt_phone");
    
    loadCachedContext(); // Performance: Carrega cache primeiro

    if (Object.keys(d).length > 0) window.LeadTrack.identify(d);
    else fetchContext(); // Busca contexto atualizado em background
    
    // Rodar decoração de links
    decorateLinks();
    setInterval(decorateLinks, 3000); // Garante links dinâmicos
  })();

  log("✅ LeadTrack v5 Pure | ID:", ltId);
})();
