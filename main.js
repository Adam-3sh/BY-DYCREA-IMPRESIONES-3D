// === CONFIGURACIÓN DE SUPABASE ===
const supabaseUrl = 'https://xlsrviwsygmzalbcuqyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc3J2aXdzeWdtemFsYmN1cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDkxMjUsImV4cCI6MjA4NzA4NTEyNX0.maNasYLRxMr4lPuTrSs8tLtXYPfhcw3FXpI1vH-PAz4'; 
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const contenedor = document.getElementById('contenedor-productos');
const contadorText = document.getElementById('contador-resultados');
let productosGlobales = [];

// === SISTEMA DE CARRITO DE COMPRAS ===
let carrito = JSON.parse(localStorage.getItem('dycrea_carrito')) || [];

function actualizarIconoCarrito() {
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => badge.textContent = carrito.length);
}

function agregarAlCarrito(id, titulo, precio, imagen) {
    carrito.push({ id, titulo, precio, imagen });
    localStorage.setItem('dycrea_carrito', JSON.stringify(carrito));
    actualizarIconoCarrito();
    renderizarCarrito();
    mostrarNotificacion('¡Agregado al carrito!', 'info');
    document.getElementById('cartSidebar').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
}

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    localStorage.setItem('dycrea_carrito', JSON.stringify(carrito));
    actualizarIconoCarrito();
    renderizarCarrito();
}

function renderizarCarrito() {
    const container = document.getElementById('cartItemsContainer');
    const priceText = document.getElementById('cartTotalPrice');
    container.innerHTML = '';
    let total = 0;

    if(carrito.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: gray; margin-top: 20px;">Tu carrito está vacío</p>';
        priceText.textContent = '$0';
        return;
    }

    carrito.forEach((item, index) => {
        total += item.precio;
        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.imagen}" alt="${item.titulo}">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.titulo}</div>
                <div class="cart-item-price">$${item.precio.toLocaleString('es-CL')}</div>
                <button class="btn-remove-item" onclick="eliminarDelCarrito(${index})"><i class="fas fa-trash"></i> Quitar</button>
            </div>
        `;
        container.appendChild(div);
    });
    priceText.textContent = `$${total.toLocaleString('es-CL')}`;
}

// === ENVIAR CARRITO POR WHATSAPP ===
function enviarCarritoWhatsApp() {
    if(carrito.length === 0) return alert("El carrito está vacío.");
    
    const numeroTelefonico = "56974139790"; // TU NÚMERO
    let mensaje = `*¡Hola! Vengo de dycrea.cl y quiero confirmar el siguiente pedido:*\n\n`;
    let total = 0;

    carrito.forEach((item, i) => {
        mensaje += `${i+1}. ${item.titulo} - $${item.precio.toLocaleString('es-CL')}\n`;
        total += item.precio;
    });

    mensaje += `\n*Total Estimado: $${total.toLocaleString('es-CL')}*`;
    
    // 🔥 TEXTO NUEVO PARA FACILITAR EL PAGO
    mensaje += `\n\nPor favor, envíame los datos bancarios para realizar la transferencia y adjuntar el comprobante. 🧾`;

    const url = `https://api.whatsapp.com/send?phone=${numeroTelefonico}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// Eventos de abrir/cerrar carrito
document.querySelectorAll('.cart-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.getElementById('cartSidebar').classList.add('active');
        document.getElementById('cartOverlay').classList.add('active');
    });
});
document.getElementById('closeCartBtn').addEventListener('click', () => {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
});
document.getElementById('cartOverlay').addEventListener('click', () => {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
});

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

// === SISTEMA DE NOTIFICACIONES ===
function mostrarNotificacion(mensaje, tipo = "oferta") {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icono = tipo === 'oferta' ? '<i class="fas fa-fire"></i>' : '<i class="fas fa-check"></i>';
    toast.innerHTML = `<div class="toast-icon">${icono}</div><div class="toast-text">${mensaje}</div>`;
    toastContainer.appendChild(toast);
    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => { toast.classList.remove('show'); setTimeout(() => toast.remove(), 400); }, 3000);
}

// === SKELETON LOADING ===
function mostrarSkeleton() {
    contenedor.innerHTML = '';
    for(let i=0; i<8; i++){
        contenedor.innerHTML += `<div class="skeleton-card"><div class="skeleton-img"></div><div class="skeleton-title"></div><div class="skeleton-text"></div><div class="skeleton-price"></div></div>`;
    }
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

        // --- CÁLCULO MÁGICO DE OFERTAS Y ETIQUETAS ---
        let esOfertaValida = prod.precio_oferta && (!prod.fecha_fin_oferta || new Date(prod.fecha_fin_oferta) > new Date());
        let precioMostrar = esOfertaValida ? prod.precio_oferta : prod.precio;
        
        let precioOriginalHTML = esOfertaValida ? `<span style="text-decoration: line-through; color: #a0aec0; font-size: 0.9rem; margin-right: 5px;">$${prod.precio.toLocaleString('es-CL')}</span>` : '';
        const precioFormateado = precioOriginalHTML + new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(precioMostrar);

        let badgesHTML = `<span class="badge category">${prod.categoria}</span>`;
        if (prod.etiqueta_destacada) {
            // Si le pusiste una etiqueta personalizada manual ("Poco Stock")
            badgesHTML += `<span class="badge oferta" style="background:var(--secondary-brand); animation:none;">${prod.etiqueta_destacada}</span>`;
        } else if (esOfertaValida) {
            // Si tiene oferta pero no etiqueta manual, calcula el % de descuento automático
            let dcto = Math.round(100 - (prod.precio_oferta * 100 / prod.precio));
            badgesHTML += `<span class="badge oferta" style="background:var(--danger);">¡${dcto}% OFF!</span>`;
        }

        const materialPrincipal = (prod.material && prod.material.length > 0) ? prod.material.join(', ') : 'Impresión 3D';

        card.innerHTML = `
            <div class="image-container">
                <div class="badges-container">${badgesHTML}</div>
                <a href="producto.html?id=${prod.id}">
                    <img src="${imagenPrincipal}" alt="${prod.titulo}" class="product-image ${tieneMultiples ? 'auto-slider' : ''}" data-images="${dataImagesStr}" data-index="0">
                </a>
                <div class="quick-action-overlay">
                    <button class="btn-add-cart" onclick="agregarAlCarrito('${prod.id}', '${prod.titulo.replace(/'/g, "")}', ${precioMostrar}, '${imagenPrincipal}')" style="background: var(--secondary-brand); color: white;">
                        <i class="fas fa-cart-plus"></i> Al Carrito
                    </button>
                </div>
            </div>
            <div class="product-info">
                <a href="producto.html?id=${prod.id}"><h3 class="product-title" style="cursor: pointer; color: inherit;">${prod.titulo}</h3></a>
                <div class="product-material">${materialPrincipal}</div>
                <div class="product-price">${precioFormateado}</div>
            </div>
        `;
        contenedor.appendChild(card);
    });
    
    contadorText.textContent = lista.length;
    iniciarAutoSlider(); // Iniciar animación automática
}

// === MOTOR DE FILTROS ===
function aplicarFiltros() {
    const textoBuscado = document.getElementById('searchInput').value.toLowerCase();
    const catActiva = document.querySelector('.category-list a.active');
    const categoria = catActiva ? catActiva.textContent.trim() : 'Todas';
    const matSeleccionados = Array.from(document.querySelectorAll('.filter-section:nth-of-type(2) input[type="checkbox"]:checked')).map(cb => cb.closest('label').textContent.trim());

    const filtrados = productosGlobales.filter(prod => {
        const cTexto = prod.titulo.toLowerCase().includes(textoBuscado) || prod.categoria.toLowerCase().includes(textoBuscado);
        const cCat = (categoria === 'Todas') || (prod.categoria === categoria);
        let cMat = true;
        if (matSeleccionados.length > 0) {
            cMat = prod.material ? prod.material.some(m => matSeleccionados.includes(m)) : false;
        }
        return cTexto && cCat && cMat;
    });
    renderizarProductos(filtrados);
}

document.getElementById('searchInput').addEventListener('input', aplicarFiltros);
document.querySelectorAll('.category-list a').forEach(enlace => {
    enlace.addEventListener('click', (e) => {
        e.preventDefault(); 
        document.querySelectorAll('.category-list a').forEach(el => el.classList.remove('active'));
        e.target.classList.add('active');
        aplicarFiltros();
    });
});
document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(cb => cb.addEventListener('change', aplicarFiltros));

// === CARGAR BASE DE DATOS ===
async function cargarProductosDesdeBD() {
    mostrarSkeleton(); 
    try {
        const { data, error } = await supabaseClient.from('productos').select('*').eq('disponible', true).order('fecha_creacion', { ascending: false });
        if (error) throw error;
        productosGlobales = data;
        setTimeout(() => { aplicarFiltros(); }, 400); 
    } catch (err) {
        console.error(err);
        contenedor.innerHTML = '<p>Ocurrió un error.</p>';
    }
}

cargarProductosDesdeBD();
actualizarIconoCarrito();
renderizarCarrito();

// Lógica de UI Móvil
const btnFiltros = document.getElementById('btnToggleFiltros');
const sidebar = document.getElementById('sidebarFiltros');
if(btnFiltros && sidebar) {
    btnFiltros.addEventListener('click', () => {
        sidebar.classList.toggle('mostrar');
        btnFiltros.innerHTML = sidebar.classList.contains('mostrar') ? '<i class="fas fa-times"></i> Ocultar Filtros' : '<i class="fas fa-filter"></i> Mostrar Filtros';
    });
}
// === CARGAR CATEGORÍAS DINÁMICAMENTE EN LA TIENDA ===
async function cargarCategoriasStore() {
    try {
        const { data, error } = await supabaseClient
            .from('categorias')
            .select('nombre')
            .order('nombre');

        if (error) throw error;

        const listaSidebar = document.getElementById('lista-categorias-sidebar');
        
        // Mantenemos la opción "Todas"
        listaSidebar.innerHTML = '<li><a href="#" class="active">Todas</a></li>';
        
        // Agregamos las de la base de datos
        data.forEach(cat => {
            listaSidebar.innerHTML += `<li><a href="#">${cat.nombre}</a></li>`;
        });

        // Volvemos a activar los "clics" para los filtros en las nuevas categorías
        document.querySelectorAll('.category-list a').forEach(enlace => {
            enlace.addEventListener('click', (e) => {
                e.preventDefault(); 
                document.querySelectorAll('.category-list a').forEach(el => el.classList.remove('active'));
                e.target.classList.add('active');
                aplicarFiltros();
            });
        });

    } catch (err) {
        console.error("Error cargando categorías:", err);
    }
}

// Ejecutamos la carga de categorías al abrir la página
cargarCategoriasStore();

// === LÓGICA DEL ACORDEÓN DEL FOOTER (CORREGIDA) ===
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
        // Evaluamos el tamaño de la pantalla al hacer clic
        if(window.innerWidth <= 768) {
            const item = header.parentElement;
            if(item.classList.contains('activo')) {
                item.classList.remove('activo');
            } else {
                document.querySelectorAll('.accordion-item').forEach(other => other.classList.remove('activo')); 
                item.classList.add('activo'); 
            }
        }
    });
});

// === CARGAR BANNERS (CARTELES DE OFERTAS) ===
async function cargarBanners() {
    const container = document.getElementById('hero-slider-container');
    if (!container) return;

    try {
        const { data, error } = await supabaseClient
            .from('banners')
            .select('*')
            .eq('activo', true)
            .order('fecha_creacion', { ascending: false });

        if (error) throw error;

        // 1. Filtrar los banners que ya expiraron (si tienen fecha límite)
        const ahora = new Date();
        const bannersActivos = data ? data.filter(b => !b.fecha_expiracion || new Date(b.fecha_expiracion) > ahora) : [];

        // 2. SIEMPRE ponemos el cartel por defecto como el primero
        let slidesHTML = `
            <div class="slide active" style="background: linear-gradient(to right, #0f172a, #1e293b);">
                <div class="hero-content">
                    <span class="hero-tag">BIENVENIDO</span>
                    <h2>Imprime tus ideas <br>en alta calidad</h2>
                    <p>Descubre miles de modelos listos para fabricar.</p>
                </div>
            </div>
        `;

        // 3. Añadimos los carteles extraídos de Supabase
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
        const totalSlides = bannersActivos.length + 1; // +1 por el banner por defecto

        // 4. Dibujar los puntitos y activar el loop SIN ERRORES
        if (totalSlides > 1) {
            let dotsHTML = '<div class="slider-controls">';
            for(let i=0; i < totalSlides; i++) {
                dotsHTML += `<div class="slider-dot ${i === 0 ? 'active' : ''}" onclick="cambiarSlide(${i})"></div>`;
            }
            dotsHTML += '</div>';
            container.innerHTML += dotsHTML;

            // Limpiamos intervalos anteriores por si acaso
            if(window.bannerInterval) clearInterval(window.bannerInterval);
            
            // Loop perfecto que no se rompe al final
            window.bannerInterval = setInterval(() => {
                const slides = document.querySelectorAll('#hero-slider-container .slide');
                let currentIndex = Array.from(slides).findIndex(s => s.classList.contains('active'));
                let nextIndex = (currentIndex + 1) % slides.length;
                cambiarSlide(nextIndex);
            }, 5000); // Cambia cada 5 segundos
        }
    } catch (err) {
        console.error("Error cargando banners:", err);
    }
}

// Función global para cambiar slides manualmente y automáticamente
window.cambiarSlide = function(index) {
    document.querySelectorAll('#hero-slider-container .slide').forEach((s, i) => s.classList.toggle('active', i === index));
    document.querySelectorAll('#hero-slider-container .slider-dot').forEach((d, i) => d.classList.toggle('active', i === index));
};

// Ejecutamos
cargarBanners();