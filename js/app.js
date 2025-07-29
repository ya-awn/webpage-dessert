// --- DATOS GENERALES ---
let productos = [];
let carrito = {};
let categorias = [];
const tempQty = {};    // Cantidades temporales por producto para agregar  

// --- CARGA de MENU.json, inicia todo ---
document.addEventListener('DOMContentLoaded', () => {
  fetch('js/menu.json')
    .then(res => res.json())
    .then(data => {
      productos = data;
      // 1) Hero slider decorativo (solo una imagen por producto)
      initHeroSlider();
      // 2) Categorías, ofertas y menú
      renderCategorias();
      renderOfertas();
      renderMenu(productos);
      updateCartCount();
      // 3) Evento BUSCADOR
      document.getElementById('buscar').addEventListener('input', () => filtrarMenu());
      // 4) Carrito
      document.getElementById('cart-icon').onclick = toggleCart;
      // 5) Botón GALERÍA global
      document.getElementById('btn-galeria').onclick = e => {
        e.preventDefault();
        abrirGaleriaGlobal();
      };
    });
});

/* ============================================================= */
/*                       HERO SLIDER                              */
/* ============================================================= */
let heroImgs = [], heroIdx = 0, heroInterval;
function initHeroSlider() {
  // toma la primera imagen de cada producto
  heroImgs = productos.map(p => Array.isArray(p.imagenes) && p.imagenes.length
    ? p.imagenes[0]
    : p.imagen
  );
  setHeroBgImg(0);
  heroInterval = setInterval(() => {
    heroIdx = (heroIdx + 1) % heroImgs.length;
    setHeroBgImg(heroIdx);
  }, 3700);
  window.onblur = () => clearInterval(heroInterval);
  window.onfocus = () => {
    clearInterval(heroInterval);
    heroInterval = setInterval(() => {
      heroIdx = (heroIdx + 1) % heroImgs.length;
      setHeroBgImg(heroIdx);
    }, 3700);
  };
}
function setHeroBgImg(idx) {
  const bg = document.getElementById('hero-slider-bg');
  if (!bg.children.length) {
    heroImgs.forEach((img, i) => {
      const el = document.createElement('img');
      el.src  = 'images/' + img;
      el.className = 'hero-slider-img' + (i === 0 ? ' active' : '');
      bg.appendChild(el);
    });
  }
  Array.from(bg.children).forEach((imgEl, i) => {
    imgEl.classList.toggle('active', i === idx);
  });
}

/* ============================================================= */
/*                  RENDERIZADO DE PRODUCTOS                      */
/* ============================================================= */
function renderCategorias() {
  const bar = document.getElementById('categories-bar');
  const cats = [...new Set(productos.map(p => p.categoria))];
  bar.innerHTML = `<button class="cat-btn active" onclick="filtrarMenu()">Todos</button>`;
  cats.forEach(c => {
    bar.innerHTML += `<button class="cat-btn" onclick="filtrarMenu('${c}')">${c}</button>`;
  });
}

function filtrarMenu(cat) {
  const txt = document.getElementById('buscar').value.toLowerCase();
  let lista = productos.filter(p =>
    (!cat || p.categoria===cat) &&
    (p.nombre.toLowerCase().includes(txt) || p.descripcion.toLowerCase().includes(txt))
  );
  document.querySelectorAll('.cat-btn')
    .forEach(btn => btn.classList.toggle('active', btn.textContent === (cat||'Todos')));
  renderMenu(lista);
}

function renderOfertas() {
  const cont = document.getElementById('ofertas-slider');
  cont.innerHTML = '';
  productos.filter(p => p.categoria==='combo').forEach(p => {
    cont.innerHTML += renderCard(p, true);
  });
}

function renderMenu(lista) {
  const grid = document.getElementById('menu-grid');
  const comboIds = productos.filter(p=>p.categoria==='combo').map(p=>p.id);
  grid.innerHTML = '';
  lista.filter(p=>!comboIds.includes(p.id)).forEach(p => {
    grid.innerHTML += renderCard(p, false);
  });
  // inicializa sliders-mini SOLO si existen
  setTimeout(() => {
    document.querySelectorAll('.slider-mini').forEach(el => {
      const imgs = el.dataset.imagenes.split(',').map(s=>s.trim());
      initSliderMini(el, imgs);
    });
  }, 10);
}


function renderCard(p, esOferta) {
  // Soporta p.imagenes = [ ... ] o p.imagen = 'x.jpg'
  if (!Array.isArray(p.imagenes)) p.imagenes = [ p.imagen ];
  // Si tiene varias imágenes, muestra slider-mini. Si tiene una, muestra la imagen con click para ampliar
  const slider = p.imagenes.length > 1
    ? `<div class="slider-mini" data-imagenes="${p.imagenes.join(',')}"></div>`
    : `<img src="images/${p.imagenes[0]}" alt="${p.nombre}" class="card-img-only" onclick="abrirGaleriaModal(['images/${p.imagenes[0]}'],0)">`;
  return `
    <div class="menu-card">
      ${slider}
      <div class="menu-name">${p.nombre}</div>
      <div class="menu-desc">${p.descripcion}</div>
      <div class="menu-precio">$${p.precio}</div>
      <div class="qty-controls">
        <button class="qty-btn" onclick="decrementTemp(${p.id})">−</button>
        <span class="qty-num" id="tempQty-${p.id}">${tempQty[p.id]||0}</span>
        <button class="qty-btn" onclick="incrementTemp(${p.id})">+</button>
        <button class="btn-agregar" onclick="addToCart(${p.id})">Agregar</button>
      </div>
    </div>
  `;
}


/* ============================================================= */
/*                      SLIDER MINI                               */
/* ============================================================= */
function initSliderMini(container, images) {
  if (!images.length) return;
  container.innerHTML = '';
  let idx=0, iv;
  images.forEach((img,i) => {
    const el = document.createElement('img');
    el.src = 'images/'+img;
    el.className = 'slider-mini-img'+(i===0?' active':'');
    el.onclick = () => abrirGaleriaModal(images.map(x=>'images/'+x), i);
    container.appendChild(el);
  });
  const dots = document.createElement('div');
  dots.className='slider-mini-dots';
  images.forEach((_,i) => {
    const d=document.createElement('div');
    d.className='slider-mini-dot'+(i===0?' active':'');
    d.onclick = e => { e.stopPropagation(); setSlide(i,true); };
    dots.appendChild(d);
  });
  container.appendChild(dots);

  function setSlide(n,reset){
    const imgs=container.querySelectorAll('.slider-mini-img');
    const dt=container.querySelectorAll('.slider-mini-dot');
    imgs.forEach((im,i)=>im.classList.toggle('active',i===n));
    dt.forEach((el,i)=>el.classList.toggle('active',i===n));
    idx=n;
    if(reset){ clearInterval(iv); iv=setInterval(next,5000); }
  }
  function next(){ setSlide((idx+1)%images.length,false); }
  iv=setInterval(next,5000);
}

/* ============================================================= */
/*                   MODAL DE IMAGEN SIMPLE                      */
/* ============================================================= */
let galeriaActual=[], galeriaIdx=0;
function abrirGaleriaModal(arr, i=0) {
  galeriaActual=arr; galeriaIdx=i;
  mostrarImgModal();
}
function mostrarImgModal() {
  const bg=document.getElementById('modal-img-bg');
  const img=document.getElementById('modal-img-ampliada');
  img.src = galeriaActual[galeriaIdx];
  bg.classList.add('activo');
  renderFlechasModal();
}
function cerrarModalImg() {
  document.getElementById('modal-img-bg').classList.remove('activo');
  galeriaActual=[]; galeriaIdx=0;
}
function renderFlechasModal() {
  const cont=document.querySelector('#modal-img-bg .modal-img-content');
  cont.querySelectorAll('.modal-flecha').forEach(e=>e.remove());
  if (galeriaActual.length<2) return;
  ['izq','der'].forEach(dir=>{
    const btn=document.createElement('button');
    btn.className=`modal-flecha ${dir}`;
    btn.innerHTML=dir==='izq'?'&#8678;':'&#8680;';
    btn.onclick=e=>{
      e.stopPropagation();
      galeriaIdx = dir==='izq'
        ? (galeriaIdx-1+galeriaActual.length)%galeriaActual.length
        : (galeriaIdx+1)%galeriaActual.length;
      mostrarImgModal();
    };
    cont.appendChild(btn);
  });
}

/* ============================================================= */
/*                  GALERÍA GLOBAL (todo el menú)                */
/* ============================================================= */
let galeriaGlobalImgs=[], galeriaGlobalIdx=0, thumbsOffset=0;
const VISIBLE=7;

function abrirGaleriaGlobal() {
  galeriaGlobalImgs=[];
  productos.forEach(p=>{
    const arr = Array.isArray(p.imagenes)?p.imagenes:[p.imagen];
    arr.forEach(img=>{
      galeriaGlobalImgs.push({nombre:p.nombre,src:'images/'+img});
    });
  });
  galeriaGlobalIdx=0; thumbsOffset=0;
  mostrarModalGaleriaGlobal();
}

function mostrarModalGaleriaGlobal() {
  if(!galeriaGlobalImgs.length) return;
  const modal = document.getElementById('modal-galeria-bg');
  modal.style.display='flex';
  updateGlobalMain();
  updateGlobalThumbs();
}

function updateGlobalMain() {
  const obj = galeriaGlobalImgs[galeriaGlobalIdx];
  document.getElementById('galeria-title').textContent = obj.nombre;
  document.getElementById('galeria-img-main').src = obj.src;
  // ajustar offset miniaturas
  if(galeriaGlobalIdx<thumbsOffset) thumbsOffset=galeriaGlobalIdx;
  if(galeriaGlobalIdx>=thumbsOffset+VISIBLE)
    thumbsOffset = galeriaGlobalIdx-VISIBLE+1;
  updateGlobalThumbs();
}

function updateGlobalThumbs() {
  const bar = document.getElementById('galeria-thumbnails');
  bar.innerHTML='';
  const end = Math.min(thumbsOffset+VISIBLE, galeriaGlobalImgs.length);
  for(let i=thumbsOffset;i<end;i++){
    const t=document.createElement('img');
    t.src = galeriaGlobalImgs[i].src;
    t.className = 'galeria-thumb'+(i===galeriaGlobalIdx?' active':'');
    t.onclick=()=>{
      galeriaGlobalIdx=i; updateGlobalMain();
    };
    bar.appendChild(t);
  }
}

document.getElementById('galeria-prev-main').onclick = e=>{
  e.stopPropagation();
  galeriaGlobalIdx = (galeriaGlobalIdx-1+galeriaGlobalImgs.length)%galeriaGlobalImgs.length;
  updateGlobalMain();
};
document.getElementById('galeria-next-main').onclick = e=>{
  e.stopPropagation();
  galeriaGlobalIdx = (galeriaGlobalIdx+1)%galeriaGlobalImgs.length;
  updateGlobalMain();
};
document.getElementById('galeria-prev-thumb').onclick = e=>{
  e.stopPropagation();
  thumbsOffset = Math.max(0, thumbsOffset-1);
  updateGlobalThumbs();
};
document.getElementById('galeria-next-thumb').onclick = e=>{
  e.stopPropagation();
  if(thumbsOffset+VISIBLE<galeriaGlobalImgs.length) thumbsOffset++;
  updateGlobalThumbs();
};

function cerrarModalGaleria() {
  document.getElementById('modal-galeria-bg').style.display='none';
  galeriaGlobalImgs=[]; galeriaGlobalIdx=0; thumbsOffset=0;
}

// --- CANTIDAD TEMPORAL ---
function incrementTemp(id) {
  tempQty[id] = (tempQty[id] || 0) + 1;
  document.getElementById(`tempQty-${id}`).innerText = tempQty[id];
}
function decrementTemp(id) {
  if ((tempQty[id] || 0) > 0) {
    tempQty[id]--;
    document.getElementById(`tempQty-${id}`).innerText = tempQty[id];
  }
}
function addToCart(id) {
  const cantidad = tempQty[id] || 0;
  if (cantidad > 0) {
    carrito[id] = (carrito[id] || 0) + cantidad;
    tempQty[id] = 0;
    document.getElementById(`tempQty-${id}`).innerText = 0;
    updateCartCount();
  }
}


// --- MODAL CARRITO / CONTADOR ---
function updateCartCount() {
  const total = Object.values(carrito).reduce((a, b) => a + b, 0);
  document.getElementById('cartCount').innerText = total;
}

function toggleCart() {
  const modal = document.getElementById('cart-modal');
  modal.classList.toggle('active');
  renderCart();
}

function renderCart() {
  const cont = document.getElementById('cart-items');
  cont.innerHTML = '';
  let suma = 0;
  Object.entries(carrito).forEach(([id, q]) => {
    const p = productos.find(x => x.id == id);
    const subtotal = p.precio * q;
    suma += subtotal;
    cont.innerHTML += `
      <div class="cart-item">
        ${p.nombre} x${q} — $${subtotal}
      </div>
    `;
  });
  document.getElementById('cart-total').innerText = suma;
  document.getElementById('send-whatsapp').href = armarLinkWhatsapp();
}
// --- MODAL CARRITO: ABRIR/CERRAR Y RENDERIZAR ---
function toggleCart() {
  const modal = document.getElementById('cart-modal');
  // Cambia display entre "flex" y "none"
  modal.style.display = (modal.style.display === 'flex') ? 'none' : 'flex';
  if (modal.style.display === 'flex') renderCart();
}

function renderCart() {
  const cont = document.getElementById('cart-items');
  cont.innerHTML = '';
  let suma = 0;
  Object.entries(carrito).forEach(([id, q]) => {
    const p = productos.find(x => x.id == id);
    if (!p) return;

    // --- Si cantidad > 0 se muestra normal, si es 0 muestra ❌ roja ---
    let controls;
    if (q > 0) {
      const subtotal = p.precio * q;
      suma += subtotal;
      controls = `
        <button class="cart-qty-btn" onclick="updateCartQty(${id},-1)">−</button>
        <span class="cart-qty-num" id="qty-cart-${id}">${q}</span>
        <button class="cart-qty-btn" onclick="updateCartQty(${id},1)">+</button>
      `;
      cont.innerHTML += `
        <div class="cart-item">
          <div class="cart-prod-info">
            ${p.nombre}
            <div style="font-size:.92em;color:#866;margin-top:.12em;">
              $${p.precio} c/u
            </div>
          </div>
          <div class="cart-qty-control">${controls}</div>
          <span class="cart-prod-total">$${subtotal}</span>
        </div>
      `;
    } else {
      // --- Si cantidad = 0 ---
      controls = `
        <button class="cart-qty-btn btn-x" onclick="removeCartItem(${id})">✕</button>
        <span class="cart-qty-num" id="qty-cart-${id}" style="color:#bbb">0</span>
        <button class="cart-qty-btn" onclick="updateCartQty(${id},1)">+</button>
      `;
      cont.innerHTML += `
        <div class="cart-item cart-item-zero">
          <div class="cart-prod-info">
            ${p.nombre}
            <div style="font-size:.92em;color:#aaa;margin-top:.12em;">
              $${p.precio} c/u
            </div>
          </div>
          <div class="cart-qty-control">${controls}</div>
          <span class="cart-prod-total" style="color:#ccc">$0</span>
        </div>
      `;
    }
  });
  document.getElementById('cart-total').innerText = suma;
  document.getElementById('send-whatsapp').href = armarLinkWhatsapp();
}

// Ajusta cantidad desde el modal
// Al cambiar cantidad
function updateCartQty(id, d) {
  carrito[id] = Math.max(0, (carrito[id] || 0) + d);
  renderCart();
  updateCartCount();
}
// Eliminar item al apretar X
function removeCartItem(id) {
  delete carrito[id];
  renderCart();
  updateCartCount();
}


// Asocia el icono del carrito al modal
document.getElementById('cart-icon').onclick = toggleCart;


// --- Al armar el mensaje para WhatsApp, ignora productos en cero ---
function armarLinkWhatsapp() {
  let mensaje = "Hola! Quiero hacer un pedido:%0A";
  Object.entries(carrito).forEach(([id, cant]) => {
    if (cant > 0) {
      const prod = productos.find(p => p.id == id);
      if (prod) mensaje += `- ${prod.nombre} x${cant}%0A`;
    }
  });
  mensaje += `%0ATotal: $${document.getElementById('cart-total').textContent}`;
  return `https://api.whatsapp.com/send?phone=54911XXXXXXXX&text=${mensaje}`;
}