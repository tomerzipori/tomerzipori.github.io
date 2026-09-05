"use strict";
(() => {
  const $ = (id) => document.getElementById(id);
  const labels = {animals:"animals",humans:"human roles",plants:"plants",foods:"foods",vehicles:"vehicles",tools:"tools",household_objects:"household",natural_nonliving:"natural objects"};
  const hostFrame = window.frameElement;
  if (hostFrame) new ResizeObserver(([entry]) => {
    hostFrame.style.height = `${Math.ceil(entry.target.getBoundingClientRect().height)}px`;
  }).observe($("playground"));
  const compact = new URLSearchParams(location.search).get("compact") === "1";
  if (compact) document.documentElement.classList.add("compact");
  let data, selected, wordA, wordB, category = "animals";
  const key = (u) => `${u.layer}/${u.unit}`;
  const value = (u, i) => $("scale").value === "raw" ? u.values[i] : u.sd ? (u.values[i] - u.mean) / u.sd : 0;
  const average = (a) => a.reduce((s,v) => s + v, 0) / a.length;
  function setUnit(u) {
    selected = u;
    $("layer").value = u.layer;
    $("layer-value").textContent = u.layer;
    const units = data.units.filter((v) => v.layer === u.layer);
    $("unit").replaceChildren(...units.map((v) => new Option(`U${v.unit}${v.rank ? ` · frozen #${v.rank}` : " · exploratory"}`, key(v))));
    $("unit").value = key(u);
    $("selection-note").textContent = u.rank ? `Frozen winner #${u.rank} of 20. Selected on separate animal/tool words.` : "Extra unit for exploration. Selected from the earlier animal/tool localizer only.";
    document.querySelectorAll("#layer-map button").forEach((b) => b.setAttribute("aria-pressed", String(Number(b.dataset.layer) === u.layer)));
    document.querySelectorAll("[data-preset]").forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.preset === key(u))));
    render();
  }
  function sync() {
    const params = new URLSearchParams({layer:selected.layer,unit:selected.unit,a:data.words[wordA].word,b:data.words[wordB].word,scale:$("scale").value,category});
    if (compact) params.set("compact", "1");
    history.replaceState(null,"",`${location.pathname}?${params}`);
  }
  function render() {
    const values = selected.values.map((_,i) => value(selected,i));
    const lo = Math.min(...values,0), hi = Math.max(...values,0);
    const pad = (hi-lo || 1) * .05;
    const min = lo-pad, max = hi+pad;
    const x = (v) => 5 + (v-min)/(max-min)*490;
    $("unit-title").textContent = `Layer ${selected.layer} / unit ${selected.unit}`;
    const rows = Object.keys(labels).map((name) => {
      const indices = data.words.flatMap((w,i) => w.category === name ? [i] : []);
      const mean = average(indices.map((i) => values[i]));
      const row = document.createElement("div"); row.className = "response-row";
      const button = document.createElement(compact ? "span" : "button"); button.className = "category-button";
      button.textContent = labels[name]; if (!compact) button.setAttribute("aria-pressed",String(name === category));
      button.setAttribute("aria-label",`${labels[name]}: mean ${mean.toFixed(2)}. Inspect 40 words.`);
      if (!compact) button.onclick = () => {category=name; $("word-detail").open=true; render();};
      const svg = document.createElementNS("http://www.w3.org/2000/svg","svg");
      svg.setAttribute("viewBox","0 0 500 30"); svg.setAttribute("preserveAspectRatio","none");
      svg.setAttribute("role","img"); svg.setAttribute("aria-label",`${labels[name]}: 40 word responses, mean ${mean.toFixed(2)}`);
      const point = (tag,attrs) => {const e=document.createElementNS(svg.namespaceURI,tag);Object.entries(attrs).forEach(([k,v])=>e.setAttribute(k,v));svg.append(e);return e;};
      point("line",{x1:0,x2:500,y1:15,y2:15,stroke:"#d8d9cf","stroke-width":.6});
      point("line",{x1:x(0),x2:x(0),y1:0,y2:30,stroke:"#b1b5a8","stroke-dasharray":"2 3"});
      indices.forEach((i,n) => {
        const dot=point("circle",{cx:x(values[i]),cy:6+(n%4)*6,r:2.5,class:"dot"});
        const title=document.createElementNS(svg.namespaceURI,"title");title.textContent=`${data.words[i].word}: ${values[i].toFixed(3)}`;dot.append(title);
      });
      point("circle",{cx:x(mean),cy:15,r:5,class:"mean"});
      (compact ? [] : [wordA,wordB]).forEach((i,n) => {if(data.words[i].category===name) point("circle",{cx:x(values[i]),cy:n?21:9,r:5,class:n?"word-b":"word-a"});});
      const number=document.createElement("span");number.className="mean-label";number.textContent=mean.toFixed(2);
      row.append(button,svg,number); return row;
    });
    $("response-chart").replaceChildren(...rows);
    $("axis").replaceChildren(...[min.toFixed(1), $("scale").value === "z" ? "response (SD from this unit’s mean)" : "raw activation", max.toFixed(1)].map((text)=>{const s=document.createElement("span");s.textContent=text;return s;}));
    $("word-a").value=wordA; $("word-b").value=wordB;
    $("readout").replaceChildren();
    (compact ? [] : [[wordA,"A","word-a-label"],[wordB,"B","word-b-label"]]).forEach(([i,label,cls]) => {const s=document.createElement("strong");s.className=cls;s.textContent=`${label}: ${data.words[i].word} ${values[i].toFixed(2)}`;$("readout").append(s,document.createTextNode(" · "));});
    const best=Object.keys(labels).reduce((a,b)=> average(data.words.flatMap((w,i)=>w.category===a?[values[i]]:[])) >= average(data.words.flatMap((w,i)=>w.category===b?[values[i]]:[]))?a:b);
    $("readout").append(document.createTextNode(`Highest category mean: ${labels[best]}.`));
    $("category-summary").textContent=`Inspect all 40 ${labels[category]} words`;
    const words=data.words.flatMap((w,i)=>w.category===category?[i]:[]).sort((a,b)=>values[b]-values[a]);
    $("word-list").replaceChildren(...words.map((i)=>{const b=document.createElement("button");b.textContent=data.words[i].word;const s=document.createElement("span");s.textContent=values[i].toFixed(2);b.append(s);b.setAttribute("aria-label",`Set word A to ${data.words[i].word}, response ${values[i].toFixed(2)}`);b.onclick=()=>{wordA=i;render();};return b;}));
    sync();
  }
  async function init() {
    try {
      if (compact) $("chart-help").textContent = "Each dot is one of 40 words in a category. The large dot is the mean. Axis fits each unit.";
      const response=await fetch("data.json"); if(!response.ok) throw new Error(`Data request failed (${response.status}).`);
      data=await response.json();
      const params=new URLSearchParams(location.search);
      const wordIndex=(word,fallback)=>{const i=data.words.findIndex((w)=>w.word===word);return i<0?data.words.findIndex((w)=>w.word===fallback):i;};
      wordA=wordIndex(params.get("a"),"pigeon");wordB=wordIndex(params.get("b"),"rose");
      if(Object.hasOwn(labels,params.get("category"))) category=params.get("category");
      $("scale").value=params.get("scale")==="raw"?"raw":"z";
      const ordered=data.words.map((w,i)=>({...w,i})).sort((a,b)=>a.word.localeCompare(b.word));
      ["word-a","word-b"].forEach((id)=>$(id).replaceChildren(...ordered.map((w)=>new Option(`${w.word} · ${labels[w.category]}`,w.i))));
      const chooseLayer=(layer)=>setUnit(data.units.find((u)=>u.layer===Number(layer)));
      $("layer-map").replaceChildren(...Array.from({length:data.n_layers},(_,i)=>{const b=document.createElement("button");b.textContent=i;b.dataset.layer=i;b.setAttribute("aria-label",`Layer ${i}`);b.onclick=()=>chooseLayer(i);return b;}));
      $("layer").oninput=(e)=>chooseLayer(e.target.value);
      $("unit").onchange=(e)=>setUnit(data.units.find((u)=>key(u)===e.target.value));
      $("scale").onchange=render;
      $("word-a").onchange=(e)=>{wordA=Number(e.target.value);render();};
      $("word-b").onchange=(e)=>{wordB=Number(e.target.value);render();};
      ["previous","next"].forEach((id)=>$(id).onclick=()=>{const units=data.units.filter((u)=>u.layer===selected.layer);const i=units.indexOf(selected);setUnit(units[(i+(id==="next"?1:units.length-1))%units.length]);});
      document.querySelectorAll("[data-preset]").forEach((b)=>b.onclick=()=>setUnit(data.units.find((u)=>key(u)===b.dataset.preset)));
      $("surprise").onclick=()=>{wordA=Math.floor(Math.random()*data.words.length);wordB=(wordA+1+Math.floor(Math.random()*(data.words.length-1)))%data.words.length;render();};
      $("reset").onclick=()=>{wordA=wordIndex("pigeon");wordB=wordIndex("rose");category="animals";$("scale").value="z";$("word-detail").open=false;setUnit(data.units.find((u)=>key(u)==="12/646"));};
      $("loading").hidden=true;$("workspace").hidden=false;
      const requested=data.units.find((u)=>u.layer===Number(params.get("layer"))&&u.unit===Number(params.get("unit")));
      setUnit(requested||data.units.find((u)=>key(u)==="12/646"));
    } catch(error) {$("loading").hidden=false;$("loading").setAttribute("role","alert");$("loading").textContent=`The recorded data could not load. Reload to retry. ${error.message}`;}
  }
  init();
})();
