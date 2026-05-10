// js/main.js
// === CONTROLADOR DE LA PÁGINA DE INICIO ===

const contenedor = document.getElementById('contenedor-productos');
const contadorText = document.getElementById('contador-resultados');
let productosGlobales = [];

// === SKELETON LOADING ===
function mostrarSkeleton() {
    if (!contenedor) return;
    contenedor.innerHTML = '';
    for(let i=0; i<8; i++){
        contenedor.innerHTML += `<div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-title"></div><div class="skeleton-text"></div><div class="skeleton-price"></div></div>`;
    }
}

// === AUTO SLIDER DE IMÁGENES ===
let sliderInterval;
function iniciarAutoSlider() {
    if(sliderInterval) clearInterval(sliderInterval);
    sliderInterval = setInterval(() => {
        document.querySelectorAll('.auto-slider').forEach(img => {
            const imagenes = img.getAttribute('data-images').split('|||');
            if(imagenes.length > 1) {
                let currentIndex = parseInt(img.getAttribute('data-index'));
                let nextIndex = (currentIndex + 1) % imagenes.length;
                img.style.opacity = 0; // Desvanecer
                setTimeout(() => {
                    img.src = imagenes[nextIndex];
                    img.setAttribute('data-index', nextIndex);
                    img.style.opacity = 1; // Aparecer
                }, 200);
            }
        });
    }, 3000); // Cambia cada 3 segundos
}

// === RENDERIZAR PRODUCTOS ===
function renderizarProductos(lista) {
    contenedor.innerHTML = ''; 
    if(!lista || lista.length === 0) {
        contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align: center; margin-top: 20px;">No encontramos productos.</p>';
        contadorText.textContent = '0';
        return;
    }

    lista.forEach((prod, index) => {
       const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.05}s`; 
        
        const tieneMultiples = prod.imagenes && prod.imagenes.length > 1;
        const imagenPrincipal = (prod.imagenes && prod.imagenes.length > 0) ? prod.imagenes[0] : 'https://via.placeholder.com/500x500';
        const dataImagesStr = tieneMultiples ? prod.imagenes.join('|||') : imagenPrincipal;

        let esOfertaValida = prod.precio_oferta && (!prod.fecha_fin_oferta || new Date(prod.fecha_fin_oferta) > new Date());
        let precioMostrar = esOfertaValida ? prod.precio_oferta : prod.precio;
        const sinStock = prod.stock <= 0; 
        
        let precioOriginalHTML = esOfertaValida ? `<span style="display: block; text-decoration: line-through; color: #a0aec0; font-size: 0.85rem; font-weight: 500; margin-bottom: -2px;">Normal: $${prod.precio.toLocaleString('es-CL')}</span>` : '';
        let colorNuevo = esOfertaValida ? 'var(--danger)' : 'var(--secondary-brand)';
        const precioFormateado = precioOriginalHTML + `<span style="color: ${colorNuevo};">` + new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(precioMostrar) + `</span>`;

        let badgesHTML = `<span class="badge category">${prod.categoria}</span>`;
        if (sinStock) {
            badgesHTML += `<span class="badge oferta" style="background: #718096; animation: none;">AGOTADO</span>`;
        } else if (prod.etiqueta_destacada) {
            badgesHTML += `<span class="badge oferta" style="background:var(--secondary-brand); animation:none;">${prod.etiqueta_destacada}</span>`;
        } else if (esOfertaValida) {
            let dcto = Math.round(100 - (prod.precio_oferta * 100 / prod.precio));
            badgesHTML += `<span class="badge oferta" style="background:var(--danger);">¡${dcto}% OFF!</span>`;
        }

        const materialPrincipal = (prod.material && prod.material.length > 0) ? prod.material.join(', ') : 'Impresión 3D';

        let btnCartHTML = '';
        if (sinStock) {
            btnCartHTML = `<button class="btn-add-cart" disabled style="background: #cbd5e1; color: #64748b; cursor: not-allowed; width: 100%;"><i class="fas fa-times-circle"></i> Agotado</button>`;
        } else {
            // Llama a la función global agregarAlCarrito de carrito.js
            btnCartHTML = `<button class="btn-add-cart" onclick="agregarAlCarrito('${prod.id}', '${prod.titulo.replace(/'/g, "")}', ${precioMostrar}, '${imagenPrincipal}', ${esOfertaValida ? prod.precio : null})" style="background: var(--secondary-brand); color: white; width: 100%;"><i class="fas fa-cart-plus"></i> Al Carrito</button>`;
        }

        card.innerHTML = `
            <div class="image-container">
                <div class="badges-container">${badgesHTML}</div>
                <img src="${imagenPrincipal}" alt="${prod.titulo}" class="product-image ${tieneMultiples ? 'auto-slider' : ''}" data-images="${dataImagesStr}" data-index="0" loading="lazy">
                <div class="quick-action-overlay">
                    ${btnCartHTML}
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${prod.titulo}</h3>
                <div class="product-material">${materialPrincipal}</div>
                <div class="product-price">${precioFormateado}</div>
            </div>
        `;
        
        card.style.cursor = "pointer";
        card.addEventListener("click", (e) => {
            if (!e.target.closest(".btn-add-cart")) {
                window.location.href = `producto.html?id=${prod.id}`;
            }
        });
        contenedor.appendChild(card);
    });
    
    contadorText.textContent = lista.length;
    iniciarAutoSlider(); 
}

// === MOTOR DE FILTROS ===
function aplicarFiltros() {
    const textoBuscado = document.getElementById('searchInput').value.toLowerCase();
    const catActiva = document.querySelector('.category-list a.active');
    const categoria = catActiva ? catActiva.textContent.trim() : 'Todas';
    const matSeleccionados = Array.from(document.querySelectorAll('.filter-section:nth-of-type(2) input[type="checkbox"]:checked')).map(cb => cb.closest('label').textContent.trim());
    const sortSelect = document.querySelector('.sort-select');
    const ordenSeleccionado = sortSelect ? sortSelect.value : 'Más Relevantes';

    let filtrados = productosGlobales.filter(prod => {
        const cTexto = prod.titulo.toLowerCase().includes(textoBuscado) || prod.categoria.toLowerCase().includes(textoBuscado);
        const cCat = (categoria === 'Todas') || (prod.categoria === categoria);
        let cMat = true;
        if (matSeleccionados.length > 0) {
            cMat = prod.material ? prod.material.some(m => matSeleccionados.includes(m)) : false;
        }
        return cTexto && cCat && cMat;
    });

    if (ordenSeleccionado === 'Menor Precio') {
        filtrados.sort((a, b) => {
            let precioA = (a.precio_oferta && (!a.fecha_fin_oferta || new Date(a.fecha_fin_oferta) > new Date())) ? a.precio_oferta : a.precio;
            let precioB = (b.precio_oferta && (!b.fecha_fin_oferta || new Date(b.fecha_fin_oferta) > new Date())) ? b.precio_oferta : b.precio;
            return precioA - precioB; 
        });
    } else if (ordenSeleccionado === 'Mayor Precio') {
        filtrados.sort((a, b) => {
            let precioA = (a.precio_oferta && (!a.fecha_fin_oferta || new Date(a.fecha_fin_oferta) > new Date())) ? a.precio_oferta : a.precio;
            let precioB = (b.precio_oferta && (!b.fecha_fin_oferta || new Date(b.fecha_fin_oferta) > new Date())) ? b.precio_oferta : b.precio;
            return precioB - precioA; 
        });
    }

    renderizarProductos(filtrados);
}

// Escuchadores de Filtros
document.getElementById('searchInput')?.addEventListener('input', aplicarFiltros);
document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(cb => cb.addEventListener('change', aplicarFiltros));
document.querySelector('.sort-select')?.addEventListener('change', aplicarFiltros);

// Lógica de UI Móvil para Filtros
const btnFiltros = document.getElementById('btnToggleFiltros');
const sidebar = document.getElementById('sidebarFiltros');
if(btnFiltros && sidebar) {
    btnFiltros.addEventListener('click', () => {
        sidebar.classList.toggle('mostrar');
        btnFiltros.innerHTML = sidebar.classList.contains('mostrar') ? '<i class="fas fa-times"></i> Ocultar Filtros' : '<i class="fas fa-filter"></i> Mostrar Filtros';
    });
}

// === CARGA INICIAL DE BASE DE DATOS ===
async function cargarProductosDesdeBD() {
    mostrarSkeleton(); 
    try {
        const { data, error } = await supabaseClient.from('productos').select('*').eq('disponible', true).order('fecha_creacion', { ascending: false });
        if (error) throw error;
        productosGlobales = data;
        setTimeout(() => { aplicarFiltros(); }, 400); 
    } catch (err) {
        console.error(err);
        contenedor.innerHTML = '<p>Ocurrió un error al cargar los productos.</p>';
    }
}

async function cargarCategoriasStore() {
    try {
        const { data, error } = await supabaseClient.from('categorias').select('nombre').order('nombre');
        if (error) throw error;

        const listaSidebar = document.getElementById('lista-categorias-sidebar');
        if (!listaSidebar) return;

        listaSidebar.innerHTML = '<li><a href="#" class="active">Todas</a></li>';
        data.forEach(cat => { listaSidebar.innerHTML += `<li><a href="#">${cat.nombre}</a></li>`; });

        document.querySelectorAll('.category-list a').forEach(enlace => {
            enlace.addEventListener('click', (e) => {
                e.preventDefault(); 
                document.querySelectorAll('.category-list a').forEach(el => el.classList.remove('active'));
                e.target.classList.add('active');
                aplicarFiltros();
            });
        });
    } catch (err) { console.error("Error cargando categorías:", err); }
}

async function cargarBanners() {
    const container = document.getElementById('hero-slider-container');
    if (!container) return;

    try {
        const { data, error } = await supabaseClient.from('banners').select('*').eq('activo', true).order('fecha_creacion', { ascending: false });
        if (error) throw error;

        const ahora = new Date();
        const bannersActivos = data ? data.filter(b => !b.fecha_expiracion || new Date(b.fecha_expiracion) > ahora) : [];

        let slidesHTML = `
            <div class="slide active" style="background: linear-gradient(to right, #0f172a, #1e293b);">
                <div class="hero-content">
                    <span class="hero-tag">BIENVENIDO</span>
                    <h2>Imprime tus ideas <br>en alta calidad</h2>
                    <p>Descubre miles de modelos listos para fabricar.</p>
                </div>
            </div>
        `;

        bannersActivos.forEach((banner) => {
            slidesHTML += `
                <div class="slide" style="background-image: url('${banner.imagen_url}');">
                    <div class="hero-content">
                        ${banner.etiqueta ? `<span class="hero-tag">${banner.etiqueta}</span>` : ''}
                        <h2>${banner.titulo}</h2>
                        ${banner.descripcion ? `<p>${banner.descripcion}</p>` : ''}
                    </div>
                </div>
            `;
        });

        container.innerHTML = slidesHTML;
        const totalSlides = bannersActivos.length + 1; 

        if (totalSlides > 1) {
            let dotsHTML = '<div class="slider-controls">';
            for(let i=0; i < totalSlides; i++) {
                dotsHTML += `<div class="slider-dot ${i === 0 ? 'active' : ''}" onclick="cambiarSlide(${i})"></div>`;
            }
            dotsHTML += '</div>';
            container.innerHTML += dotsHTML;

            if(window.bannerInterval) clearInterval(window.bannerInterval);
            
            window.bannerInterval = setInterval(() => {
                const slides = document.querySelectorAll('#hero-slider-container .slide');
                let currentIndex = Array.from(slides).findIndex(s => s.classList.contains('active'));
                let nextIndex = (currentIndex + 1) % slides.length;
                cambiarSlide(nextIndex);
            }, 5000); 
        }
    } catch (err) { console.error("Error cargando banners:", err); }
}

window.cambiarSlide = function(index) {
    document.querySelectorAll('#hero-slider-container .slide').forEach((s, i) => s.classList.toggle('active', i === index));
    document.querySelectorAll('#hero-slider-container .slider-dot').forEach((d, i) => d.classList.toggle('active', i === index));
};

// Ejecución inicial
cargarProductosDesdeBD();
cargarCategoriasStore();
cargarBanners();