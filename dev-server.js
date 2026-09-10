const http = require('http');
const fs = require('fs');
const path = require('path');
const { formatDistanceToNow } = require('date-fns');

const CATEGORIES = [
  { key: 'all', label: 'Byose' },
  { key: 'ubuhinzi', label: 'Ubuhinzi' },
  { key: 'politiki', label: 'Politiki' },
  { key: 'ubukungu', label: 'Ubukungu' },
  { key: 'ikoranabuhanga', label: 'Ikoranabuhanga' },
  { key: 'ubuzima', label: 'Ubuzima' },
  { key: 'amahanga', label: 'Amahanga' },
];

const TRENDING = [
  'Ibirayi: ibiciro bigwa 5%?',
  'Amerika na intambara yo guhagarika',
  'MTN 5G Kigali: ubwangu bushya',
  'USD/RWF: ifaranga riguma',
  'Ibishyimbo Nyagatare: amahirwe mashya',
];

const TICKER_ITEMS = [
  'Ibirayi: igiciro kizagwa 5% iki cyumweru',
  'Amerika: ibiganiro bya diplomasi bigiye gukomeza',
  'USD/RWF: 1$ = 1,342 Fr — riguma ridahinduka',
  'Imvura: izagwa i Musanze no Rubavu ejo hashize',
  'Ibishyimbo i Nyagatare: hejuru 8% mu byumweru bibiri',
];

const NAV_ITEMS = [
  { label: 'Ahabanza', href: '/', key: 'home' },
  { label: 'Ubuhinzi', href: '/category/ubuhinzi', key: 'ubuhinzi' },
  { label: 'Politiki', href: '/category/politiki', key: 'politiki' },
  { label: 'Ubukungu', href: '/category/ubukungu', key: 'ubukungu' },
  { label: 'Ikoranabuhanga', href: '/category/ikoranabuhanga', key: 'tech' },
  { label: 'Amahanga', href: '/category/amahanga', key: 'amahanga' },
];

const predictions = [
  { id:'pred-1', topic:'Potato Prices - Kigali Market', topicKiny:'Ibiciro by\'Ibirayi — Isoko ya Kigali', category:'ubuhinzi', direction:'down', summary:'Potato prices expected to fall 5% in the next two weeks due to high harvest in Musanze.', summaryKiny:'Ibiciro by\'ibirayi bizeye kugwa 5% mu byumweru bibiri biri imbere.', currentValue:'500 Fr/kg', predictedValue:'475 Fr/kg', percentChange:-5, confidence:82, timeframe:'Mu byumweru 2', generatedAt:new Date().toISOString(), sources:['RAB Market Data','Musanze District Report'] },
  { id:'pred-2', topic:'US-Africa Peace Negotiations', topicKiny:'Ibiganiro bya Amahoro — Amerika n\'Afrika', category:'politiki', direction:'warning', summary:'High probability of US halting military support to conflict zones.', summaryKiny:'Amahirwe menshi ko Amerika izahagarika inkunga y\'gisirikare mu turere tw\'intambara.', confidence:60, timeframe:'Mu mezi 1-2', generatedAt:new Date().toISOString(), sources:['Reuters','BBC Africa','UN Reports'] },
  { id:'pred-3', topic:'USD/RWF Exchange Rate', topicKiny:'Igipimo cy\'Ifaranga — USD/RWF', category:'ubukungu', direction:'neutral', summary:'Rwandan franc expected to remain stable against the US dollar this week.', summaryKiny:'Ifaranga rya Rwanda rizeye kuguma ridahinduka ugereranyije na dolar y\'Amerika.', currentValue:'1$ = 1,342 Fr', predictedValue:'1$ = 1,340-1,345 Fr', percentChange:0.1, confidence:76, timeframe:'Iki cyumweru', generatedAt:new Date().toISOString(), sources:['BNR','forex.com'] },
  { id:'pred-4', topic:'Rainfall Forecast - Northern Province', topicKiny:'Guhanurwa kw\'Imvura — Intara y\'Amajyaruguru', category:'ubuhinzi', direction:'warning', summary:'72% probability of significant rainfall in Musanze and Rubavu tomorrow.', summaryKiny:'72% by\'amahirwe imvura ikuye izagwa i Musanze na Rubavu ejo.', confidence:72, timeframe:'Ejo hashize', generatedAt:new Date().toISOString(), sources:['Rwanda Meteorology Agency','Weather.com'] },
  { id:'pred-5', topic:'Bean Prices - Nyagatare', topicKiny:'Ibiciro by\'Ibishyimbo — Nyagatare', category:'ubuhinzi', direction:'up', summary:'Bean prices in Nyagatare expected to rise 8% following good harvest reports.', summaryKiny:'Ibiciro by\'ibishyimbo i Nyagatare bizashyira hejuru 8% nyuma y\'amakuru meza y\'umusaruro.', currentValue:'800 Fr/kg', predictedValue:'864 Fr/kg', percentChange:8, confidence:70, timeframe:'Mu byumweru 2', generatedAt:new Date().toISOString(), sources:['RAB','Nyagatare District'] },
];

const news = [
  { id:'news-1', title:'AI Predicts 5% Drop in Potato Prices in Kigali Markets', titleKiny:'AI Ihanura Ko Ibiciro by\'Ibirayi Bizagwa 5% mu Masoko ya Kigali', excerpt:'New AI analysis predicts a 5% fall in potato prices over the next two weeks.', excerptKiny:'Isesengura rishya rya AI rikomoka kuri Ibihe News rirerekana ko ibiciro by\'ibirayi bizagwa 5% mu byumweru bibiri biri imbere.', category:'ubuhinzi', source:'Ibihe AI News', sourceUrl:'#', publishedAt:new Date(Date.now()-1000*60*30).toISOString(), isAIPrediction:true, hasPrediction:true, prediction:predictions[0], tags:['ibirayi','isoko','AI','ubuhinzi'], views:1240 },
  { id:'news-2', title:'US May Stop War Support — Impact on Africa', titleKiny:'Amerika Ishobora Guhagarika Inkunga y\'Intambara — Ingaruka ku Afrika', excerpt:'Analysts predict a shift in US foreign policy that could affect ongoing conflicts.', excerptKiny:'Abahanga basesengura politiki y\'mahanga barerekana impinduka mu nzira ya Amerika.', category:'politiki', source:'Reuters Africa', sourceUrl:'#', publishedAt:new Date(Date.now()-1000*60*60).toISOString(), isAIPrediction:false, hasPrediction:true, prediction:predictions[1], tags:['Amerika','amahoro','politiki','Afrika'], views:3420 },
  { id:'news-3', title:'MTN Rwanda Launches 5G in Kigali', titleKiny:'MTN Rwanda Itangira Interineti ya 5G i Kigali', excerpt:'MTN Rwanda officially launches 5G network coverage in select Kigali neighborhoods.', excerptKiny:'MTN Rwanda itangiye interineti ya 5G mu turere two i Kigali.', category:'ikoranabuhanga', source:'KT Press', sourceUrl:'#', publishedAt:new Date(Date.now()-1000*60*60*4).toISOString(), isAIPrediction:false, hasPrediction:false, tags:['MTN','5G','ikoranabuhanga','Kigali'], views:2100 },
  { id:'news-4', title:'Rwanda Franc Remains Stable Against USD', titleKiny:'Ifaranga rya Rwanda Riguma Ridahinduka ugereranijwe na USD', excerpt:'The Rwandan franc continues to trade steadily against major foreign currencies.', excerptKiny:'Ifaranga rya Rwanda rikomeza kuguma ridahinduka ugereranijwe n\'amafaranga y\'amahanga y\'ingenzi.', category:'ubukungu', source:'BNR', sourceUrl:'#', publishedAt:new Date(Date.now()-1000*60*60*2).toISOString(), isAIPrediction:false, hasPrediction:true, prediction:predictions[2], tags:['ifaranga','BNR','ubukungu'], views:980 },
  { id:'news-5', title:'Nyagatare Farmers Celebrate New Bean Export Deal', titleKiny:'Abahinzi ba Nyagatare Bishimira Amasezerano Mashya y\'Ohereza Ibishyimbo', excerpt:'Farmers in Nyagatare celebrate a new regional export agreement for beans.', excerptKiny:'Abahinzi bo mu karere ka Nyagatare bishimira amasezerano mashya y\'ohereza ibishyimbo mu karere.', category:'ubuhinzi', source:'The New Times', sourceUrl:'#', publishedAt:new Date(Date.now()-1000*60*60*6).toISOString(), isAIPrediction:false, hasPrediction:true, prediction:predictions[4], tags:['ibishyimbo','Nyagatare','ohereza','ubuhinzi'], views:1560 },
  { id:'news-6', title:'Rwanda Hosts East Africa Health Summit', titleKiny:'Rwanda Ikingira Inama y\'Ubuzima y\'Afrika y\'Iburasirazuba', excerpt:'Kigali Convention Centre hosts major health conference.', excerptKiny:'Kigali Convention Centre ikingira inama nkuru y\'ubuzima.', category:'ubuzima', source:'igihe.com', sourceUrl:'#', publishedAt:new Date(Date.now()-1000*60*60*8).toISOString(), isAIPrediction:false, hasPrediction:false, tags:['ubuzima','Afrika','inama','Kigali'], views:750 },
];

const weather = {
  city:'Kigali', temp:22, description:'Partly Cloudy', descriptionKiny:'Ifu bike, hakabona', humidity:68, wind:12,
  forecast:[
    { day:'Tomorrow', dayKiny:'Ejo', high:20, low:16, icon:'rain' },
    { day:'Wednesday', dayKiny:'Ku wa 3', high:23, low:17, icon:'sun' },
    { day:'Thursday', dayKiny:'Ku wa 4', high:21, low:15, icon:'cloud' },
  ]
};

const marketPrices = [
  { item:'Potatoes', itemKiny:'Ibirayi', currentPrice:500, unit:'kg', market:'Kimironko', change:-25, changePercent:-5 },
  { item:'Beans', itemKiny:'Ibishyimbo', currentPrice:800, unit:'kg', market:'Nyabugogo', change:64, changePercent:8 },
  { item:'Maize', itemKiny:'Ibigori', currentPrice:350, unit:'kg', market:'Kigali Central', change:0, changePercent:0 },
  { item:'Tomatoes', itemKiny:'Inyanya', currentPrice:600, unit:'kg', market:'Kimironko', change:-30, changePercent:-5 },
  { item:'Bananas', itemKiny:'Imineke', currentPrice:250, unit:'bunch', market:'Nyabugogo', change:10, changePercent:4 },
];

const CAT_COLORS = { ubuhinzi:'green', politiki:'purple', ubukungu:'amber', ikoranabuhanga:'blue', ubuzima:'red' };
const CAT_LABELS = { ubuhinzi:'Ubuhinzi', politiki:'Politiki', ubukungu:'Ubukungu', ikoranabuhanga:'Ikoranabuhanga', ubuzima:'Ubuzima' };

function css() { return `
*{box-sizing:border-box;margin:0;padding:0}
body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',system-ui,sans-serif;background:#0a0a0a;color:#fff;min-height:100vh}
.max-w{max-width:1280px;margin:0 auto;padding:0 16px}
/* header */
header{position:sticky;top:0;z-index:50}
.nav-bar{background:#0a0a0a;border-bottom:1px solid rgba(255,255,255,.1);height:56px;display:flex;align-items:center;justify-content:space-between;padding:0 16px}
.logo{display:flex;align-items:center;gap:8px;text-decoration:none;color:#fff;font-weight:700;font-size:18px}
.logo-icon{width:32px;height:32px;background:#00c853;border-radius:8px;display:flex;align-items:center;justify-content:center;font-size:14px;color:#000}
.logo span{color:#00c853}
.badge{font-size:10px;background:rgba(0,200,83,.2);color:#00c853;border:1px solid rgba(0,200,83,.3);padding:2px 6px;border-radius:4px;font-weight:500}
.nav-links{display:none}
.nav-links a{color:rgba(255,255,255,.6);padding:6px 12px;border-radius:8px;font-size:14px;text-decoration:none;transition:all .2s}
.nav-links a:hover{color:#fff;background:rgba(255,255,255,.05)}
@media(min-width:768px){.nav-links{display:flex;gap:4px}}
/* ticker */
.ticker{background:#00c853;height:32px;display:flex;align-items:center;gap:12px;padding:0 16px;overflow:hidden}
.ticker-label{display:flex;align-items:center;gap:6px;color:#000;font-size:11px;font-weight:700;letter-spacing:1px;text-transform:uppercase;white-space:nowrap}
.ticker-divider{width:1px;height:16px;background:rgba(0,0,0,.2)}
.ticker-text{color:#000;font-size:13px;white-space:nowrap;overflow:hidden}
/* categories */
.categories{display:flex;gap:8px;flex-wrap:wrap;margin-bottom:24px;padding-bottom:16px;border-bottom:1px solid rgba(255,255,255,.1)}
.cat-btn{padding:6px 16px;border-radius:999px;font-size:14px;font-weight:500;border:1px solid rgba(255,255,255,.15);background:transparent;color:rgba(255,255,255,.6);cursor:pointer;transition:all .2s}
.cat-btn:hover{border-color:rgba(255,255,255,.3);color:#fff}
.cat-btn.active{background:#00c853;color:#000;border-color:#00c853}
/* layout */
.grid-layout{display:grid;grid-template-columns:1fr;gap:24px}
@media(min-width:1024px){.grid-layout{grid-template-columns:1fr 320px}}
/* cards */
.card{background:#111;border:1px solid rgba(255,255,255,.1);border-radius:12px;padding:16px;transition:all .2s;cursor:pointer}
.card:hover{border-color:rgba(255,255,255,.2);background:#161616}
.hero-card{border-radius:16px;overflow:hidden;border:1px solid rgba(255,255,255,.1);cursor:pointer;transition:all .2s}
.hero-card:hover{border-color:rgba(0,200,83,.4)}
.hero-bg{height:208px;background:linear-gradient(135deg,rgba(0,200,83,.3),#004d1f,#001a0a);display:flex;align-items:flex-end;padding:20px;position:relative;overflow:hidden}
.hero-bg::before{content:'';position:absolute;inset:0;opacity:.2;background:radial-gradient(circle at 30% 50%,#00c853 0%,transparent 60%)}
.hero-content{position:relative;z-index:1}
.hero-body{background:#0d1a11;padding:16px}
.hero-body p{color:rgba(255,255,255,.6);font-size:14px;line-height:1.5;margin-bottom:12px}
.hero-title{font-size:20px;font-weight:700;line-height:1.3;margin-top:8px;color:#fff}
.tag{font-size:11px;font-weight:500;padding:2px 8px;border-radius:4px;border:1px solid;display:inline-block}
.tag-green{background:rgba(0,200,83,.2);color:#00c853;border-color:rgba(0,200,83,.3)}
.tag-purple{background:rgba(168,85,247,.2);color:#a855f7;border-color:rgba(168,85,247,.3)}
.tag-amber{background:rgba(245,158,11,.2);color:#f59e0b;border-color:rgba(245,158,11,.3)}
.tag-blue{background:rgba(59,130,246,.2);color:#3b82f6;border-color:rgba(59,130,246,.3)}
.tag-red{background:rgba(239,68,68,.2);color:#ef4444;border-color:rgba(239,68,68,.3)}
.tag-neutral{background:rgba(255,255,255,.1);color:rgba(255,255,255,.6);border-color:rgba(255,255,255,.2)}
.ai-tag{display:inline-flex;align-items:center;gap:4px;font-size:11px;background:rgba(0,200,83,.2);color:#00c853;border:1px solid rgba(0,200,83,.3);padding:2px 6px;border-radius:4px}
.news-grid{display:grid;grid-template-columns:1fr;gap:12px}
@media(min-width:640px){.news-grid{grid-template-columns:1fr 1fr}}
.section-label{display:flex;align-items:center;gap:8px;margin-bottom:12px;color:rgba(255,255,255,.6);font-size:12px;font-weight:500;letter-spacing:1px;text-transform:uppercase}
.card-title{color:#fff;font-size:14px;font-weight:500;line-height:1.4;margin:8px 0;transition:color .2s}
.card:hover .card-title{color:#00c853}
.card-meta{display:flex;align-items:center;justify-content:space-between;font-size:12px;color:rgba(255,255,255,.4);margin-top:8px}
/* predictions highlight */
.pred-bar{background:linear-gradient(90deg,rgba(0,200,83,.1),transparent);border:1px solid rgba(0,200,83,.2);border-radius:12px;padding:16px;margin-bottom:24px}
.pred-bar-header{display:flex;align-items:center;gap:8px;margin-bottom:12px}
.pred-bar-header h3{color:#00c853;font-size:14px;font-weight:600}
.pred-bar-header span{font-size:11px;color:rgba(255,255,255,.4);margin-left:auto}
.pred-grid{display:grid;grid-template-columns:1fr;gap:12px}
@media(min-width:640px){.pred-grid{grid-template-columns:1fr 1fr 1fr}}
.pred-item{background:rgba(0,0,0,.2);border-radius:8px;padding:12px}
.pred-item .topic{color:rgba(255,255,255,.6);font-size:12px;margin-bottom:4px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
.pred-item .value{display:flex;align-items:center;justify-content:space-between}
.pred-item .change{color:#fff;font-size:14px;font-weight:600}
.pred-item .conf{font-size:10px;color:rgba(255,255,255,.4)}
.pred-item .target{font-size:12px;font-weight:500;margin-top:4px}
.text-red{color:#ef4444}
.text-green{color:#22c55e}
.text-amber{color:#f59e0b}
/* sidebar */
.sidebar{display:flex;flex-direction:column;gap:20px}
.sidebar-card{padding:16px;border:1px solid rgba(255,255,255,.1);border-radius:16px}
/* predictions panel */
.pred-panel{background:#0d1a11;border:1px solid rgba(0,200,83,.2);border-radius:16px;padding:16px}
.pred-panel-header{display:flex;align-items:center;gap:8px;margin-bottom:16px}
.pred-panel-icon{width:28px;height:28px;background:rgba(0,200,83,.2);border-radius:8px;display:flex;align-items:center;justify-content:center;color:#00c853;font-size:12px}
.pred-panel-title{font-size:14px;font-weight:600;color:#fff}
.pred-panel-sub{font-size:11px;color:rgba(255,255,255,.4)}
.pred-dot{width:8px;height:8px;background:#00c853;border-radius:50%;margin-left:auto;animation:pulse 2s infinite}
.pred-row{border-bottom:1px solid rgba(255,255,255,.05);padding:12px 0;cursor:pointer;transition:all .2s}
.pred-row:last-child{border:0;padding-bottom:0}
.pred-row:hover{background:rgba(255,255,255,.02);margin:-1px;padding:12px 4px}
.pred-row-header{display:flex;justify-content:space-between;gap:8px;margin-bottom:6px}
.pred-row-title{font-size:12px;color:rgba(255,255,255,.7);line-height:1.4}
.pred-row-badge{font-size:10px;font-weight:500;padding:2px 6px;border-radius:4px;border:1px solid;white-space:nowrap}
.pred-row-values{display:flex;align-items:center;gap:8px;font-size:12px;margin-bottom:6px}
.pred-row-values .old{color:rgba(255,255,255,.4)}
.pred-row-values .new{font-weight:500}
.pred-bar-container{display:flex;align-items:center;gap:8px}
.pred-bar-track{flex:1;height:4px;background:rgba(255,255,255,.1);border-radius:999px;overflow:hidden}
.pred-bar-fill{height:100%;border-radius:999px;transition:all .3s}
.pred-bar-fill.green{background:#22c55e}
.pred-bar-fill.red{background:#ef4444}
.pred-bar-fill.amber{background:#f59e0b}
.pred-bar-fill.white{background:rgba(255,255,255,.3)}
.pred-stat{font-size:10px;color:rgba(255,255,255,.4);white-space:nowrap}
/* weather */
.weather-card{background:#0a0e1a;border:1px solid rgba(59,130,246,.2);border-radius:16px;padding:16px}
.weather-main{display:flex;justify-content:space-between;margin-bottom:12px}
.weather-temp{font-size:30px;font-weight:700;color:#fff}
.weather-details{display:flex;gap:12px;font-size:12px;color:rgba(255,255,255,.5);margin-bottom:12px}
.weather-details span{display:flex;align-items:center;gap:4px}
.forecast-grid{display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px}
.forecast-day{background:rgba(255,255,255,.05);border-radius:8px;padding:8px;text-align:center}
.forecast-day .day-name{font-size:10px;color:rgba(255,255,255,.4);margin-bottom:4px}
.forecast-day .day-high{font-size:12px;color:#fff;font-weight:500}
.forecast-day .day-low{font-size:10px;color:rgba(255,255,255,.3)}
/* market */
.market-card{border-radius:16px;padding:16px;border:1px solid rgba(255,255,255,.1)}
.market-card h3{font-size:14px;font-weight:600;color:#fff;margin-bottom:12px}
.market-row{display:flex;align-items:center;justify-content:space-between;padding:6px 0;border-bottom:1px solid rgba(255,255,255,.05)}
.market-row:last-child{border:0}
.market-item .name{font-size:14px;font-weight:500;color:#fff}
.market-item .loc{font-size:12px;color:rgba(255,255,255,.4);margin-left:8px}
.market-price{text-align:right;display:flex;align-items:center;gap:8px}
.market-price .price{font-size:14px;font-weight:500;color:#fff}
.market-price .change{font-size:12px;display:flex;align-items:center;gap:2px;font-weight:500}
/* trending */
.trending-card{border-radius:16px;padding:16px;border:1px solid rgba(255,255,255,.1)}
.trending-card h3{font-size:14px;font-weight:600;color:#fff;margin-bottom:12px;display:flex;align-items:center;gap:8px}
.trend-row{display:flex;align-items:center;gap:12px;padding:8px 0;border-bottom:1px solid rgba(255,255,255,.05);cursor:pointer}
.trend-row:last-child{border:0}
.trend-num{font-size:14px;font-weight:700;color:rgba(255,255,255,.2);width:20px}
.trend-text{font-size:14px;color:rgba(255,255,255,.7);transition:color .2s;line-height:1.3}
.trend-row:hover .trend-text{color:#00c853}
/* footer */
footer{border-top:1px solid rgba(255,255,255,.1);margin-top:48px;padding:32px 0;text-align:center;color:rgba(255,255,255,.3);font-size:14px}
footer p:first-child{font-weight:700;color:rgba(255,255,255,.6);margin-bottom:4px}
/* loading */
.skeleton{height:96px;background:rgba(255,255,255,.05);border-radius:12px;animation:pulse 2s infinite}
@keyframes pulse{0%,100%{opacity:1}50%{opacity:.5}}
@keyframes slide-in{from{opacity:0;transform:translateY(6px)}to{opacity:1;transform:translateY(0)}}
.animated{animation:slide-in .4s ease-out}
/* direction badges */
.dir-badge{display:inline-flex;align-items:center;gap:4px;padding:2px 8px;border-radius:4px;font-size:11px;font-weight:500;border:1px solid}
.hero-meta{display:flex;align-items:center;justify-content:space-between;margin-top:12px}
.hero-meta-left{display:flex;align-items:center;gap:8px}
.hero-meta-right{display:flex;align-items:center;gap:12px;font-size:12px;color:rgba(255,255,255,.4)}
.hero-meta-right span{display:flex;align-items:center;gap:4px}
/* list articles */
.list-articles{display:flex;flex-direction:column;gap:8px}
.predictions-skeleton{background:rgba(0,0,0,.2);border-radius:8px;padding:12px;height:60px}
`; }

function timeAgo(dateStr) {
  try { return formatDistanceToNow(new Date(dateStr), { addSuffix: true }); }
  catch(e) { return dateStr; }
}

function tagColor(cat) { return `tag-${CAT_COLORS[cat] || 'neutral'}`; }
function dirBadge(dir, pct) {
  const cfgs = {
    up: { label: pct != null ? `+${pct}%` : 'Hejuru', cls: 'dir-badge tag-green' },
    down: { label: pct != null ? `${pct}%` : 'Hasi', cls: 'dir-badge tag-red' },
    warning: { label: 'Kugenzura', cls: 'dir-badge tag-amber' },
    neutral: { label: 'Ruguma', cls: 'dir-badge tag-neutral' },
  };
  const c = cfgs[dir] || cfgs.neutral;
  return `<span class="${c.cls}">${c.label}</span>`;
}

function renderHero(a) {
  const ta = timeAgo(a.publishedAt);
  return `<div class="hero-card animated">
    <div class="hero-bg">
      <div class="hero-content">
        <div style="display:flex;gap:8px;margin-bottom:8px">
          <span class="tag ${tagColor(a.category)}">${CAT_LABELS[a.category] || a.category}</span>
          ${a.isAIPrediction ? '<span class="ai-tag">AI</span>' : ''}
        </div>
        <h2 class="hero-title">${a.titleKiny}</h2>
      </div>
    </div>
    <div class="hero-body">
      <p>${a.excerptKiny}</p>
      <div class="hero-meta">
        <div class="hero-meta-left">
          ${a.hasPrediction && a.prediction ? dirBadge(a.prediction.direction, a.prediction.percentChange) : ''}
          ${a.isAIPrediction && a.prediction ? `<span style="font-size:11px;color:rgba(0,200,83,.7)">${a.prediction.confidence}% by'ukuri</span>` : ''}
        </div>
        <div class="hero-meta-right">
          <span>&#x1F552; ${ta}</span>
          <span>&#x1F441; ${a.views.toLocaleString()}</span>
        </div>
      </div>
    </div>
  </div>`;
}

function renderCard(a) {
  const ta = timeAgo(a.publishedAt);
  return `<div class="card">
    <div style="display:flex;align-items:flex-start;gap:8px;margin-bottom:8px">
      <span class="tag ${tagColor(a.category)}">${CAT_LABELS[a.category] || a.category}</span>
      ${a.isAIPrediction ? '<span class="ai-tag">AI</span>' : ''}
    </div>
    <div class="card-title">${a.titleKiny}</div>
    ${a.hasPrediction && a.prediction ? `<div style="margin-bottom:8px">${dirBadge(a.prediction.direction, a.prediction.percentChange)}</div>` : ''}
    <div class="card-meta">
      <span>${a.source}</span>
      <span>&#x1F552; ${ta}</span>
    </div>
  </div>`;
}

function renderPredictionBar(preds) {
  if (!preds.length) return '';
  return `<div class="pred-bar animated">
    <div class="pred-bar-header">
      <span style="color:#00c853;font-size:14px">&#x1F9E0;</span>
      <h3>Ibyahanuwe na AI — Uyu Munsi</h3>
      <span>Ibyahanuwe bishingiye ku makuru</span>
    </div>
    <div class="pred-grid">
      ${preds.slice(0,3).map(p => {
        const dirCls = p.direction === 'down' ? 'text-red' : p.direction === 'up' ? 'text-green' : 'text-amber';
        return `<div class="pred-item">
          <div class="topic">${p.topicKiny}</div>
          <div class="value">
            <span class="change">${p.percentChange ? `${p.percentChange > 0 ? '+' : ''}${p.percentChange}%` : p.timeframe}</span>
            <span class="conf">${p.confidence}% ukuri</span>
          </div>
          ${p.predictedValue ? `<div class="target ${dirCls}">\u2192 ${p.predictedValue}</div>` : ''}
        </div>`;
      }).join('')}
    </div>
  </div>`;
}

function renderPredPanel(preds) {
  const DIR_CFG = { up:'green', down:'red', warning:'amber', neutral:'white' };
  return `<div class="pred-panel animated">
    <div class="pred-panel-header">
      <div class="pred-panel-icon">&#x1F9E0;</div>
      <div>
        <div class="pred-panel-title">Ibyahanuwe na AI</div>
        <div class="pred-panel-sub">Guhanuriwa kw'igihe</div>
      </div>
      <div class="pred-dot"></div>
    </div>
    ${preds.map(p => {
      const dir = p.direction || 'neutral';
      const barCls = DIR_CFG[dir] || 'white';
      const arrow = dir === 'up' ? '\u2191' : dir === 'down' ? '\u2193' : dir === 'warning' ? '?' : '\u2014';
      const pctStr = p.percentChange ? `${Math.abs(p.percentChange)}%` : '';
      const badgeCls = `tag-${DIR_CFG[dir] || 'neutral'}`;
      return `<div class="pred-row">
        <div class="pred-row-header">
          <div class="pred-row-title">${p.topicKiny}</div>
          <span class="pred-row-badge ${badgeCls}">${arrow} ${pctStr}</span>
        </div>
        ${(p.currentValue || p.predictedValue) ? `<div class="pred-row-values">
          ${p.currentValue ? `<span class="old">${p.currentValue}</span>` : ''}
          ${p.predictedValue ? `<span style="margin-left:4px;font-size:10px">\u276F</span><span class="new ${dir === 'down' ? 'text-red' : dir === 'up' ? 'text-green' : dir === 'warning' ? 'text-amber' : ''}">${p.predictedValue}</span>` : ''}
        </div>` : ''}
        <div class="pred-bar-container">
          <div class="pred-bar-track"><div class="pred-bar-fill ${barCls}" style="width:${p.confidence}%"></div></div>
          <span class="pred-stat">${p.confidence}%</span>
          <span class="pred-stat">${p.timeframe}</span>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function iconChar(icon) {
  if (icon === 'rain') return '\u{1F327}';
  if (icon === 'sun') return '\u2600';
  return '\u2601';
}

function renderWeather(w) {
  return `<div class="weather-card animated">
    <div class="weather-main">
      <div>
        <div style="font-size:14px;font-weight:600;color:#fff">${w.city}</div>
        <div style="font-size:12px;color:rgba(255,255,255,.4)">${w.descriptionKiny}</div>
      </div>
      <div style="text-align:right">
        <div class="weather-temp">${w.temp}\u00B0</div>
        <div style="margin-top:2px;font-size:20px">\u2600</div>
      </div>
    </div>
    <div class="weather-details">
      <span>\u{1F4A7} ${w.humidity}%</span>
      <span>\u{1F4A8} ${w.wind} km/h</span>
    </div>
    <div class="forecast-grid">
      ${w.forecast.map(f => `<div class="forecast-day">
        <div class="day-name">${f.dayKiny}</div>
        <div style="font-size:16px;margin:4px 0">${iconChar(f.icon)}</div>
        <div class="day-high">${f.high}\u00B0</div>
        <div class="day-low">${f.low}\u00B0</div>
      </div>`).join('')}
    </div>
  </div>`;
}

function renderMarket(prices) {
  return `<div class="market-card animated">
    <h3>Isoko — Ibiciro Bihoraho</h3>
    ${prices.map(p => {
      const chgCls = p.changePercent > 0 ? 'text-green' : p.changePercent < 0 ? 'text-red' : '';
      const arrow = p.changePercent > 0 ? '\u2191' : p.changePercent < 0 ? '\u2193' : '\u2014';
      return `<div class="market-row">
        <div class="market-item">
          <span class="name">${p.itemKiny}</span>
          <span class="loc">${p.market}</span>
        </div>
        <div class="market-price">
          <span class="price">${p.currentPrice.toLocaleString()} Fr/${p.unit}</span>
          <span class="change ${chgCls}">${arrow} ${p.changePercent > 0 ? '+' : ''}${p.changePercent}%</span>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

function html() {
  const heroArticle = news[0];
  const gridArticles = news.slice(1, 5);
  const listArticles = news.slice(5);

  return `<!DOCTYPE html>
<html lang="rw">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>Ibihe AI News — Amakuru n'Ibyahanuwe</title>
<style>${css()}</style>
</head>
<body>

<header>
  <div class="nav-bar">
    <a href="/" class="logo">
      <div class="logo-icon">&#x1F9E0;</div>
      Ibihe<span>AI</span>
      <span class="badge">NEWS</span>
    </a>
    <nav class="nav-links">
      ${NAV_ITEMS.map(n => `<a href="${n.href}">${n.label}</a>`).join('')}
    </nav>
    <div style="display:flex;align-items:center;gap:8px">
      <span style="font-size:16px;cursor:pointer">&#x1F50D;</span>
      <span style="font-size:16px;cursor:pointer;position:relative">&#x1F514;<span style="position:absolute;top:2px;right:2px;width:6px;height:6px;background:#00c853;border-radius:50%"></span></span>
    </div>
  </div>
  <div class="ticker">
    <div class="ticker-label">
      <span style="font-size:12px">&#x26A1;</span>
      <span>AI LIVE</span>
    </div>
    <div class="ticker-divider"></div>
    <div class="ticker-text">${TICKER_ITEMS[0]}</div>
  </div>
</header>

<main class="max-w" style="padding-top:24px">

  <div class="categories">
    ${CATEGORIES.map(c => `<button class="cat-btn ${c.key === 'all' ? 'active' : ''}">${c.label}</button>`).join('')}
  </div>

  <div class="grid-layout">
    <div>
      ${heroArticle ? renderHero(heroArticle) : ''}
      ${renderPredictionBar(predictions)}
      ${gridArticles.length ? `<div>
        <div class="section-label"><span>&#x1F9F9;</span> Inkuru Zihambaye</div>
        <div class="news-grid">${gridArticles.map(renderCard).join('')}</div>
      </div>` : ''}
      ${listArticles.length ? `<div class="list-articles" style="margin-top:24px">
        ${listArticles.map(renderCard).join('')}
      </div>` : ''}
    </div>
    <div class="sidebar">
      ${renderPredPanel(predictions)}
      ${renderWeather(weather)}
      ${renderMarket(marketPrices)}
      <div class="trending-card">
        <h3><span style="color:#f97316">&#x1F525;</span> Ibiganirwaho Cyane</h3>
        ${TRENDING.map((item, i) => `<div class="trend-row">
          <span class="trend-num">${i+1}</span>
          <span class="trend-text">${item}</span>
        </div>`).join('')}
      </div>
    </div>
  </div>
</main>

<footer>
  <div class="max-w">
    <p>Ibihe AI News</p>
    <p>Amakuru n'ibyahanuwe bishingiye ku ikoranabuhanga rya AI — Rwanda &#x1F1F7;&#x1F1FC;</p>
  </div>
</footer>

</body>
</html>`;
}

const server = http.createServer((req, res) => {
  if (req.url === '/favicon.ico') { res.writeHead(204); return res.end(); }
  res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
  res.end(html());
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n  \u{1F9E0} Ibihe AI News \u2014 Dev Server`);
  console.log(`  \u{1F310} http://localhost:${PORT}\n`);
});
