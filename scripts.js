// --- UTILS ---
function formatTimeAMPM(d){
  var hours = d.getHours();
  var minutes = d.getMinutes();
  var seconds = d.getSeconds();
  var ampm = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  hours = hours ? hours : 12;
  function pad(n){return n<10?'0'+n:n}
  return hours+':'+pad(minutes)+':'+pad(seconds)+' '+ampm;
}

function setUpdatedNow(){
  var el = document.getElementById('last-updated');
  if(el) el.textContent = 'Updated ' + formatTimeAMPM(new Date());
}

// --- NEWS (пример) ---
var sampleNews = {
  world: [
    'Trump withdraws US from key climate treaty and dozens of other groups',
    'Tensions linger over targeting and impact of US airstrikes in Nigeria',
    'Vance criticises Denmark and Europe\'s handling of Greenland'
  ],
  tech: [
    'Japanese electronics store pleads for old PCs amid critical hardware shortage',
    'AI benchmark for preference-aware resolution in top-calling agents',
    'Microsoft will put buy buttons directly in Copilot'
  ],
  finance: [
    'Senate votes to block Trump from future military strikes on Venezuela',
    'Wildcatters race for Venezuelan oil deals ahead of wary western majors',
    'US oil groups warn they will need guarantees to invest in Venezuela'
  ]
};

function renderNews(){
  var list1 = document.getElementById('news-list-1');
  var list2 = document.getElementById('news-list-2');
  var list3 = document.getElementById('news-list-3');
  list1.innerHTML='';list2.innerHTML='';list3.innerHTML='';
  sampleNews.world.forEach(function(t){var li=document.createElement('li');li.textContent=t;list1.appendChild(li)});
  sampleNews.tech.forEach(function(t){var li=document.createElement('li');li.textContent=t;list2.appendChild(li)});
  sampleNews.finance.forEach(function(t){var li=document.createElement('li');li.textContent=t;list3.appendChild(li)});
}

// Button refresh behaviour
document.addEventListener('DOMContentLoaded', function(){
  renderNews();
  setUpdatedNow();
  // map init below
  initMap();

  document.getElementById('btn-refresh').addEventListener('click', function(){
    // Simulate fetch/update: in real case, call your API and re-render lists
    // Here — rotate news arrays and update timestamp
    sampleNews.world.unshift(sampleNews.world.pop());
    sampleNews.tech.unshift(sampleNews.tech.pop());
    sampleNews.finance.unshift(sampleNews.finance.pop());
    renderNews();
    setUpdatedNow();
  });

  // Filters
  var filters = document.querySelectorAll('.filter');
  filters.forEach(function(btn){
    btn.addEventListener('click', function(){
      filters.forEach(function(b){b.classList.remove('active')});
      btn.classList.add('active');
      var kind = btn.dataset.kind;
      applyFilter(kind);
    });
  });

  // sectors demo
  var sectors = document.getElementById('sectors');
  ['Tech','Finance','Energy','Health','Materials','RealEst'].forEach(function(s){
    var el = document.createElement('div');el.className='sector';el.textContent=s;sectors.appendChild(el);
  });

  // predictions demo
  var pred = document.getElementById('pred-list');
  var preds = ['Will Aston Villa win the 2025–26 EPL?','Will Tyrese Maxey lead the NBA in points 2025–26?','Product X will exceed $1B ARR'];
  preds.forEach(function(p){var li=document.createElement('li');li.textContent=p;pred.appendChild(li)});
});

// --- MAP + HEATMAP ---
var map, heatLayer, markersLayer;

function initMap(){
  // Тёмный централизованный стиль: используем OpenStreetMap tiles с тёмной темой (CartoDB Dark Matter)
  map = L.map('map', {preferCanvas:true,renderer: L.canvas()}).setView([20,0], 2);

  L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
    attribution: '&copy; OpenStreetMap contributors & CartoDB',
    maxZoom: 19
  }).addTo(map);

  // демонстрационные реальные координаты (cities)
  var points = [
    {lat:40.7128,lng:-74.0060,intensity:0.6,type:'finance',title:'New York — finance hub'},
    {lat:51.5074,lng:-0.1278,intensity:0.9,type:'world',title:'London — geopolitical'},
    {lat:34.0522,lng:-118.2437,intensity:0.7,type:'tech',title:'Los Angeles — events'},
    {lat:35.6895,lng:139.6917,intensity:0.8,type:'tech',title:'Tokyo — incidents'},
    {lat:-23.5505,lng:-46.6333,intensity:0.5,type:'world',title:'Sao Paulo — protests'},
    {lat:28.6139,lng:77.2090,intensity:0.6,type:'health',title:'Delhi — health alert'},
    {lat:55.7558,lng:37.6173,intensity:0.85,type:'world',title:'Moscow — military'},
    {lat:-33.8688,lng:151.2093,intensity:0.4,type:'world',title:'Sydney — shipping'}
  ];

  // markers layer for clickable markers
  markersLayer = L.layerGroup().addTo(map);

  points.forEach(function(p){
    var c = L.circleMarker([p.lat,p.lng], {
      radius:8,
      fillColor: colorByType(p.type),
      color:'#000000',
      weight:1,
      opacity:1,
      fillOpacity:0.9
    }).addTo(markersLayer);

    c.bindTooltip('<strong>'+p.title+'</strong><br>Type: '+p.type, {className:'mytooltip'});
    c.options.meta = p;
  });

  // heatmap: prepare points array [lat, lng, intensity]
  var heatPoints = points.map(function(p){ return [p.lat,p.lng,p.intensity] });
  heatLayer = L.heatLayer(heatPoints, {radius: 40, blur: 25, maxZoom: 6, gradient: {0.2: 'blue',0.4:'cyan',0.6:'lime',0.8:'orange',1:'red'}}).addTo(map);

  // add simple polylines example (routes)
  var route = L.polyline([[40.7128,-74.0060],[51.5074,-0.1278],[55.7558,37.6173]], {color:'#00e6a8',weight:1.2,opacity:0.8}).addTo(map);

  // interactive: clicking marker will show popup details and center
  markersLayer.eachLayer(function(layer){
    layer.on('click', function(e){
      var meta = layer.options.meta || {};
      var html = '<div style="font-weight:700;color:#fff">'+meta.title+'</div><div style="color:#cbd8d4;font-size:13px;margin-top:4px">Intensity: '+(meta.intensity||0)+'</div>';
      L.popup({className:'mytooltip',closeButton:true,autoPan:true}).setLatLng(layer.getLatLng()).setContent(html).openOn(map);
    });
  });
}

// helper for color
function colorByType(t){
  if(t==='tech') return '#2ad8ff';
  if(t==='finance') return '#ffd24a';
  if(t==='health') return '#ff6b6b';
  if(t==='world') return '#ff4db1';
  if(t==='cyber') return '#8a7bff';
  return '#a3f7c2';
}

// filter application
function applyFilter(kind){
  // Show/hide markers and heat data by type
  markersLayer.clearLayers();
  // Recreate points same as initMap (in real app keep state)
  var all = [
    {lat:40.7128,lng:-74.0060,intensity:0.6,type:'finance',title:'New York — finance hub'},
    {lat:51.5074,lng:-0.1278,intensity:0.9,type:'world',title:'London — geopolitical'},
    {lat:34.0522,lng:-118.2437,intensity:0.7,type:'tech',title:'Los Angeles — events'},
    {lat:35.6895,lng:139.6917,intensity:0.8,type:'tech',title:'Tokyo — incidents'},
    {lat:-23.5505,lng:-46.6333,intensity:0.5,type:'world',title:'Sao Paulo — protests'},
    {lat:28.6139,lng:77.2090,intensity:0.6,type:'health',title:'Delhi — health alert'},
    {lat:55.7558,lng:37.6173,intensity:0.85,type:'world',title:'Moscow — military'},
    {lat:-33.8688,lng:151.2093,intensity:0.4,type:'world',title:'Sydney — shipping'}
  ];

  var filtered = all.filter(function(p){ return kind==='all' ? true : p.type===kind });
  filtered.forEach(function(p){
    var c = L.circleMarker([p.lat,p.lng], {
      radius:8,
      fillColor: colorByType(p.type),
      color:'#000000',
      weight:1,
      opacity:1,
      fillOpacity:0.9
    }).addTo(markersLayer);
    c.bindTooltip('<strong>'+p.title+'</strong><br>Type: '+p.type, {className:'mytooltip'});
    c.options.meta = p;
  });

  // rebuild heat layer
  if(heatLayer) map.removeLayer(heatLayer);
  heatLayer = L.heatLayer(filtered.map(function(p){ return [p.lat,p.lng,p.intensity] }), {radius:40,blur:25,gradient:{0.2:'blue',0.4:'cyan',0.6:'lime',0.8:'orange',1:'red'}}).addTo(map);
}
