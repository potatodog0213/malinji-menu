"use strict";

const CATEGORIES = ["牛&豬肉類","羊肉&鴨肉類","雞肉類","海鮮類","蔬菜類","碳烤伴餐類","炸物類","飲品類"];
const $ = (id) => document.getElementById(id);
const config = window.SUPABASE_CONFIG || {};
const configured = config.url && config.anonKey && !config.url.includes("YOUR_PROJECT") && !config.anonKey.includes("YOUR_SUPABASE");
const db = configured && window.supabase ? window.supabase.createClient(config.url, config.anonKey) : null;
let isAdmin = false, menuItems = [], editingId = null;
let store = {address:"地址尚未設定",hours:"營業時間：17:30~24:00",notice:"以現場點餐叫號碼牌為主",holiday:"公休日：星期三",line_url:""};

function status(message){ $("status").textContent = message; }
function setTab(name){
  document.querySelectorAll(".tab").forEach(b=>b.classList.toggle("active",b.dataset.tab===name));
  document.querySelectorAll(".tab-panel").forEach(p=>p.classList.toggle("hidden",p.id!==name));
}
document.querySelectorAll(".tab").forEach(b=>b.addEventListener("click",()=>setTab(b.dataset.tab)));
$("item-category").innerHTML = CATEGORIES.map(c=>`<option value="${escapeHtml(c)}">${escapeHtml(c)}</option>`).join("");

function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function sortedItems(){
  return [...menuItems].sort((a,b)=>CATEGORIES.indexOf(a.category)-CATEGORIES.indexOf(b.category)||Number(a.price)-Number(b.price)||a.name.localeCompare(b.name,"zh-Hant"));
}
function grouped(items){
  return CATEGORIES.map(category=>({category,items:items.filter(i=>i.category===category)})).filter(g=>g.items.length);
}
function renderMenu(){
  const cols=[sortedItems().slice(0,20),sortedItems().slice(20,40),sortedItems().slice(40,60)];
  $("menu-columns").innerHTML=cols.map(col=>`<div class="menu-col">${grouped(col).map(g=>`<section><div class="category-title">${escapeHtml(g.category)}</div>${g.items.map(i=>`<div class="menu-item"><span>${escapeHtml(i.name)}</span><span>$${Number(i.price)}</span></div>`).join("")}</section>`).join("")||'<div class="muted">目前沒有品項</div>'}</div>`).join("");
  renderManager();
}
function renderManager(){
  if(!isAdmin){$("manage-list").innerHTML='<p class="muted">請先登入管理員帳號。</p>';return;}
  $("manage-list").innerHTML=sortedItems().map(i=>`<div class="item-row"><div><b>${escapeHtml(i.name)}</b><small>${escapeHtml(i.category)}・$${Number(i.price)}</small></div><div class="row-actions"><button class="mini" data-edit="${i.id}">編輯</button><button class="mini" data-delete="${i.id}">刪除</button></div></div>`).join("")||'<p class="muted">尚無菜單品項。</p>';
  $("manage-list").querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>editItem(b.dataset.edit)));
  $("manage-list").querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteItem(b.dataset.delete)));
}
function renderStore(){
  $("sign-address").textContent=store.address||"地址尚未設定";
  $("sign-hours").textContent=store.hours;
  $("sign-notice").textContent=store.notice;
  $("sign-holiday").textContent=store.holiday;
  $("store-hours").value=store.hours;
  $("store-notice").value=store.notice;
  $("store-holiday").value=store.holiday;
  $("store-line").value=store.line_url||"";
  const qr=$("sign-qr");
  if(store.line_url){qr.src=store.line_url;qr.classList.remove("hidden");$("qr-placeholder").classList.add("hidden");}
  else{qr.removeAttribute("src");qr.classList.add("hidden");$("qr-placeholder").classList.remove("hidden");}
}
function setAdmin(value){
  isAdmin=value;
  document.querySelectorAll(".admin-only").forEach(el=>el.classList.toggle("is-visible",value));
  $("logout-button").classList.toggle("hidden",!value);
  $("auth-state").textContent=value?"已登入管理員":"目前尚未登入";
  renderManager();
}
async function loadData(){
  if(!db){status("請先在 config.js 填入 Supabase Project URL 與 anon/public key。");return;}
  const [itemsRes,storeRes]=await Promise.all([
    db.from("menu_items").select("*"),
    db.from("store_settings").select("*").eq("id",1).maybeSingle()
  ]);
  if(itemsRes.error) status("讀取菜單失敗："+itemsRes.error.message);
  else menuItems=(itemsRes.data||[]).map(x=>({id:x.id,name:x.name,price:Number(x.price),category:x.category}));
  if(storeRes.data) store={...store,...storeRes.data};
  renderMenu();renderStore();
}
async function editItem(id){
  const item=menuItems.find(x=>x.id===id);if(!item)return;
  editingId=id;$("item-name").value=item.name;$("item-price").value=item.price;$("item-category").value=item.category;
  $("item-form-title").textContent="編輯菜單品項";$("cancel-edit").classList.remove("hidden");
  $("item-form").scrollIntoView({behavior:"smooth",block:"center"});
}
function resetItemForm(){
  editingId=null;$("item-form").reset();$("item-category").value=CATEGORIES[0];
  $("item-form-title").textContent="新增菜單品項";$("cancel-edit").classList.add("hidden");
}
$("cancel-edit").addEventListener("click",resetItemForm);
$("item-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!db||!isAdmin)return;
  const name=$("item-name").value.trim(),price=Number($("item-price").value),category=$("item-category").value;
  if(!name||!Number.isInteger(price)||price<0){status("請輸入正確品項名稱及整數價格。");return;}
  const payload={name,price,category,category_order:CATEGORIES.indexOf(category)};
  const result=editingId?await db.from("menu_items").update(payload).eq("id",editingId).select().single():await db.from("menu_items").insert(payload).select().single();
  if(result.error){status("儲存失敗："+result.error.message);return;}
  const x=result.data,record={id:x.id,name:x.name,price:Number(x.price),category:x.category};
  menuItems=editingId?menuItems.map(i=>i.id===editingId?record:i):[...menuItems,record];
  resetItemForm();renderMenu();status("菜單品項已儲存至 Supabase。");
});
async function deleteItem(id){
  if(!db||!isAdmin||!confirm("確定刪除此菜單品項？"))return;
  const {error}=await db.from("menu_items").delete().eq("id",id);
  if(error){status("刪除失敗："+error.message);return;}
  menuItems=menuItems.filter(i=>i.id!==id);renderMenu();status("品項已刪除。");
}
$("store-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!db||!isAdmin)return;
  const payload={id:1,hours:$("store-hours").value.trim(),notice:$("store-notice").value.trim(),holiday:$("store-holiday").value.trim(),line_url:$("store-line").value.trim()};
  const {error}=await db.from("store_settings").upsert(payload);
  if(error){status("儲存店面資訊失敗："+error.message);return;}
  store={...store,...payload};renderStore();status("店面資訊已儲存至 Supabase。");
});
$("login-form").addEventListener("submit",async e=>{
  e.preventDefault();if(!db){status("請先設定 Supabase。");return;}
  const {error}=await db.auth.signInWithPassword({email:$("login-email").value,password:$("login-password").value});
  if(error)status("登入失敗："+error.message);else status("管理員登入成功。");
});
$("logout-button").addEventListener("click",async()=>{await db?.auth.signOut();});
if(db){
  db.auth.getSession().then(({data})=>setAdmin(!!data.session));
  db.auth.onAuthStateChange((_event,session)=>setAdmin(!!session));
}
$("print-menu").addEventListener("click",()=>{setTab("menu");window.print();});
$("print-sign").addEventListener("click",()=>{setTab("sign");window.print();});
renderMenu();renderStore();loadData();
