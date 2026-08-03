const cfg=window.SKYFIT_CONFIG||{};
const isConfigured=cfg.SUPABASE_URL&&!cfg.SUPABASE_URL.includes("YOUR_PROJECT")&&cfg.SUPABASE_ANON_KEY&&!cfg.SUPABASE_ANON_KEY.includes("YOUR_ANON_KEY");
const sb=isConfigured?window.supabase.createClient(cfg.SUPABASE_URL,cfg.SUPABASE_ANON_KEY,{auth:{persistSession:true,autoRefreshToken:true,detectSessionInUrl:true}}):null;
window.sky={cfg,sb,isConfigured};

export const $=(s,r=document)=>r.querySelector(s);
export const $$=(s,r=document)=>[...r.querySelectorAll(s)];
export const money=n=>`${Number(n||0).toFixed(2)} AZN`;
export const fmtDate=v=>v?new Intl.DateTimeFormat("az-AZ",{day:"2-digit",month:"2-digit",year:"numeric"}).format(new Date(v)):"—";
export const esc=v=>String(v??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
export const uid=()=>crypto.randomUUID();
export function toast(message,type="info"){let w=$(".toast-wrap");if(!w){w=document.createElement("div");w.className="toast-wrap";document.body.append(w)}let t=document.createElement("div");t.className=`toast ${type}`;t.textContent=message;w.append(t);setTimeout(()=>t.remove(),3500)}
export function setBusy(btn,busy,label="Gözləyin..."){if(!btn)return;if(busy){btn.dataset.old=btn.textContent;btn.textContent=label;btn.disabled=true}else{btn.textContent=btn.dataset.old||btn.textContent;btn.disabled=false}}
export function toggleTheme(){const html=document.documentElement;const next=html.dataset.theme==="light"?"dark":"light";html.dataset.theme=next;localStorage.setItem("skyfit_theme",next)}
export function initTheme(){document.documentElement.dataset.theme=localStorage.getItem("skyfit_theme")||"dark"}
export function daysLeft(end){if(!end)return null;const a=new Date();a.setHours(0,0,0,0);const b=new Date(end);b.setHours(0,0,0,0);return Math.ceil((b-a)/86400000)}
export function statusBadge(end){const d=daysLeft(end);if(d===null)return `<span class="badge">Abunə yoxdur</span>`;if(d<0)return `<span class="badge danger">Bitib</span>`;if(d<=3)return `<span class="badge danger">${d} gün qalıb</span>`;if(d<=7)return `<span class="badge warn">${d} gün qalıb</span>`;return `<span class="badge ok">${d} gün qalıb</span>`}
export async function getSession(){if(!sb)return null;const {data}=await sb.auth.getSession();return data.session}
export async function getProfile(){const s=await getSession();if(!s)return null;const {data,error}=await sb.from("profiles").select("*").eq("id",s.user.id).single();if(error)return null;return data}
export async function requireAuth(role){if(!isConfigured){location.href="setup.html";return null}const s=await getSession();if(!s){location.href=`login.html?next=${encodeURIComponent(location.pathname.split("/").pop())}`;return null}const p=await getProfile();if(role&&p?.role!==role&&p?.role!=="admin"){location.href="profile.html";return null}return p}
export function layout(active=""){const b=cfg.BUSINESS||{};const h=document.querySelector("[data-header]");if(h)h.innerHTML=`<header class="topbar"><div class="shell topbar-inner"><a class="brand" href="index.html"><img src="assets/img/logo.png"><span>SKy</span> Fit</a><nav class="nav"><a class="${active==="home"?"active":""}" href="index.html">Ana səhifə</a><a class="${active==="favorites"?"active":""}" href="sevimliler.html">Sevimlilər</a><a class="${active==="profile"?"active":""}" href="profile.html">Profil</a><a href="admin.html">Admin</a></nav><button class="icon-btn mobile-toggle" onclick="location.href='profile.html'">👤</button><button class="icon-btn" id="themeBtn">◐</button></div></header>`;$("#themeBtn")?.addEventListener("click",toggleTheme);const f=document.querySelector("[data-footer]");if(f)f.innerHTML=`<footer class="footer"><div class="shell split"><div>© ${new Date().getFullYear()} SKy Fit</div><div>${esc(b.address||"")} · <a href="https://wa.me/${b.whatsapp||""}" target="_blank">WhatsApp</a></div></div></footer>`}
export async function uploadPublic(bucket,file,folder="uploads"){if(!sb||!file)return null;const ext=file.name.split(".").pop().toLowerCase();const path=`${folder}/${Date.now()}-${uid()}.${ext}`;const {error}=await sb.storage.from(bucket).upload(path,file,{cacheControl:"3600",upsert:false});if(error)throw error;return sb.storage.from(bucket).getPublicUrl(path).data.publicUrl}
export function modal(html){let m=$(".modal");if(!m){m=document.createElement("div");m.className="modal";m.innerHTML=`<div class="card modal-card"></div>`;document.body.append(m);m.addEventListener("click",e=>{if(e.target===m)m.classList.remove("open")})}$(".modal-card",m).innerHTML=html;m.classList.add("open");return m}
initTheme();
