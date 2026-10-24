const GEO = "https://geocoding-api.open-meteo.com/v1/search";
const FORECAST = "https://api.open-meteo.com/v1/forecast";

const $ = id => document.getElementById(id);
const status = $("status"), results = $("results"), q = $("q");

// Weather code -> [belgi kunduz, belgi tun, tavsif]
const WMO = {
  0:["☀️","🌙","Ochiq osmon"],1:["🌤️","🌙","Asosan ochiq"],2:["⛅","☁️","Qisman bulutli"],3:["☁️","☁️","Bulutli"],
  45:["🌫️","🌫️","Tuman"],48:["🌫️","🌫️","Qirovli tuman"],
  51:["🌦️","🌧️","Yengil shivir"],53:["🌦️","🌧️","Shivirlash"],55:["🌧️","🌧️","Kuchli shivir"],
  56:["🌧️","🌧️","Muzlovchi shivir"],57:["🌧️","🌧️","Muzlovchi shivir"],
  61:["🌦️","🌧️","Yengil yomg‘ir"],63:["🌧️","🌧️","Yomg‘ir"],65:["🌧️","🌧️","Kuchli yomg‘ir"],
  66:["🌧️","🌧️","Muzlovchi yomg‘ir"],67:["🌧️","🌧️","Muzlovchi yomg‘ir"],
  71:["🌨️","🌨️","Yengil qor"],73:["🌨️","🌨️","Qor"],75:["❄️","❄️","Kuchli qor"],77:["❄️","❄️","Qor donalari"],
  80:["🌦️","🌧️","Jala"],81:["🌧️","🌧️","Kuchli jala"],82:["⛈️","⛈️","Juda kuchli jala"],
  85:["🌨️","🌨️","Qor yog‘ishi"],86:["❄️","❄️","Kuchli qor yog‘ishi"],
  95:["⛈️","⛈️","Momaqaldiroq"],96:["⛈️","⛈️","Do‘l bilan momaqaldiroq"],99:["⛈️","⛈️","Kuchli do‘l"]
};
const info = (code, day=1) => { const w = WMO[code] || ["❓","❓","Noma’lum"]; return {icon: day ? w[0] : w[1], text: w[2]}; };
const DAYS = ["Yak","Du","Se","Chor","Pay","Ju","Sha"];
const deg = n => Math.round(n) + "°";

async function searchCity(name){
  const url = `${GEO}?name=${encodeURIComponent(name)}&count=5&language=en&format=json`;
  const r = await fetch(url);
  if(!r.ok) throw new Error("Qidiruvda xatolik");
  return (await r.json()).results || [];
}

async function loadWeather(place){
  status.textContent = "Yuklanmoqda…";
  try{
    const url = `${FORECAST}?latitude=${place.latitude}&longitude=${place.longitude}`
      + `&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m`
      + `&daily=weather_code,temperature_2m_max,temperature_2m_min&timezone=auto`;
    const r = await fetch(url);
    if(!r.ok) throw new Error("Ob-havo ma’lumotini olib bo‘lmadi");
    render(place, await r.json());
    status.textContent = "";
    localStorage.setItem("place", JSON.stringify(place));
  }catch(e){
    status.textContent = e.message + ". Internetni tekshirib, qayta urinib ko‘ring.";
  }
}

function render(place, d){
  const c = d.current, w = info(c.weather_code, c.is_day);
  $("city").textContent = [place.name, place.country].filter(Boolean).join(", ");
  $("date").textContent = new Date(c.time).toLocaleString("uz-UZ",{weekday:"long",day:"numeric",month:"long",hour:"2-digit",minute:"2-digit"});
  $("desc").textContent = w.text;
  $("icon").textContent = w.icon;
  $("temp").textContent = deg(c.temperature_2m);
  $("feels").textContent = deg(c.apparent_temperature);
  $("hum").textContent = c.relative_humidity_2m + "%";
  $("wind").textContent = Math.round(c.wind_speed_10m) + " km/soat";
  $("prec").textContent = c.precipitation + " mm";

  $("days").innerHTML = d.daily.time.map((t,i)=>{
    const dt = new Date(t + "T00:00");
    return `<div class="day${i===0?" today":""}">
      <span>${i===0?"Bugun":DAYS[dt.getDay()]}</span>
      <span class="ic">${info(d.daily.weather_code[i]).icon}</span>
      <span class="mx">${deg(d.daily.temperature_2m_max[i])}</span>
      <span class="mn">${deg(d.daily.temperature_2m_min[i])}</span></div>`;
  }).join("");
}

// Qidiruv (kechiktirilgan)
let timer;
q.addEventListener("input", () => {
  clearTimeout(timer);
  const v = q.value.trim();
  if(v.length < 2){ results.hidden = true; return; }
  timer = setTimeout(async () => {
    try{
      const list = await searchCity(v);
      results.innerHTML = "";
      if(!list.length){ results.innerHTML = '<li>Hech narsa topilmadi</li>'; results.hidden = false; return; }
      list.forEach(p => {
        const li = document.createElement("li");
        li.tabIndex = 0;
        li.textContent = [p.name, p.admin1, p.country].filter(Boolean).join(", ");
        const pick = () => { results.hidden = true; q.value = ""; loadWeather(p); };
        li.addEventListener("click", pick);
        li.addEventListener("keydown", e => e.key === "Enter" && pick());
        results.appendChild(li);
      });
      results.hidden = false;
    }catch(e){ status.textContent = e.message; }
  }, 350);
});
q.addEventListener("keydown", async e => {
  if(e.key === "Enter"){
    const list = await searchCity(q.value.trim()).catch(()=>[]);
    if(list[0]){ results.hidden = true; q.value = ""; loadWeather(list[0]); }
  }
});
document.addEventListener("click", e => { if(!e.target.closest(".search")) results.hidden = true; });

// Mavzu
const root = document.documentElement;
function setTheme(t){ root.dataset.theme = t; $("theme").textContent = t === "dark" ? "🌙" : "☀️"; localStorage.setItem("theme", t); }
$("theme").addEventListener("click", () => setTheme(root.dataset.theme === "dark" ? "light" : "dark"));
setTheme(localStorage.getItem("theme") || "dark");

// Boshlang‘ich shahar: oxirgi tanlangan yoki Bishkek
let start = { name:"Bishkek", country:"Kyrgyzstan", latitude:42.87, longitude:74.59 };
try{ start = JSON.parse(localStorage.getItem("place")) || start; }catch(_){}
loadWeather(start);
