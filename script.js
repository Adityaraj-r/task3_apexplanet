
const $ = s=>document.querySelector(s);
const loader = $("#loader");

function showLoader(){loader.classList.remove("hidden");}
function hideLoader(){loader.classList.add("hidden");}

/* THEME */
$("#themeToggle").onclick = ()=> {
  document.body.classList.toggle("dark");
};

/* QUIZ */
let score = Number(localStorage.getItem("score_final")||0);
$("#score").innerText = score;

async function loadRandomQuestion(){
  $("#quiz-box").innerHTML="Loading...";
  let res = await fetch("https://opentdb.com/api.php?amount=1&type=multiple");
  let data = await res.json();
  let q = data.results[0];

  const decode = h => {
    const t = document.createElement("textarea");
    t.innerHTML = h;
    return t.value;
  };

  let question = decode(q.question);
  let correct = decode(q.correct_answer);
  let options = [...q.incorrect_answers.map(decode), correct].sort(()=>Math.random()-0.5);

  let box = $("#quiz-box");
  box.innerHTML = `<h3>${question}</h3>`;
  options.forEach(opt=>{
    let btn = document.createElement("button");
    btn.className="quiz-option";
    btn.innerText=opt;
    btn.onclick = ()=>{
      document.querySelectorAll(".quiz-option").forEach(b=>b.disabled=true);
      if(opt===correct){
        btn.classList.add("correct");
        score++;
        $("#score").innerText=score;
        localStorage.setItem("score_final",score);
      } else btn.classList.add("wrong");
    };
    box.appendChild(btn);
  });
}
$("#nextQ").onclick = loadRandomQuestion;
loadRandomQuestion();

/* CAROUSEL */
let images=[
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1501785888041-af3ef285b470?q=80&w=1400&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?q=80&w=1400&auto=format&fit=crop"
];
let ci=0;
function startCarousel(){
  $("#cimg").src = images[ci];
  setInterval(()=>{
    ci=(ci+1)%images.length;
    $("#cimg").src=images[ci];
    gsap.fromTo("#cimg",{opacity:0.6},{opacity:1,duration:0.8});
  },4000);
}
startCarousel();

/* WEATHER FIX (Nominatim + OpenMeteo) */
async function geocodeCity(name){
  let res = await fetch(`https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(name)}&format=json&limit=1`,
  {headers:{'User-Agent':'Mozilla/5.0'}});
  return await res.json();
}

function weatherEmoji(c){
  if(c===0) return "☀️";
  if(c<=3) return "⛅";
  if(c<=48) return "🌫️";
  if(c<=57) return "🌧️";
  if(c<=67) return "🌨️";
  if(c<=82) return "🌧️";
  if(c<=86) return "❄️";
  return "🌈";
}

async function getWeather(lat,lon){
  let q=$("#city").value.trim();
  let box=$("#weather-result");

  if(!lat && !q){box.innerHTML="Enter city or state";return;}

  showLoader();
  try{
    let latitude=lat, longitude=lon, label="";

    if(!lat){
      let geo=await geocodeCity(q);
      if(!geo.length){ hideLoader(); box.innerHTML="Location not found"; return;}
      latitude=geo[0].lat;
      longitude=geo[0].lon;
      label=geo[0].display_name;
    }

    let w = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current_weather=true`)
      .then(r=>r.json());

    hideLoader();
    if(w.current_weather){
      box.innerHTML = `
        <div style="font-size:30px">${weatherEmoji(w.current_weather.weathercode)}</div>
        <b>${label}</b><br>
        Temp: ${w.current_weather.temperature}°C<br>
        Wind: ${w.current_weather.windspeed} km/h
      `;
    }
  }catch(e){
    hideLoader();
    $("#weather-result").innerText = "Weather error";
  }
}

$("#getWeatherBtn").onclick = ()=>getWeather();

function getLocationWeather(){
  navigator.geolocation.getCurrentPosition(p=>{
    getWeather(p.coords.latitude,p.coords.longitude);
  },err=>alert(err.message));
}
$("#locWeather").onclick=getLocationWeather;
