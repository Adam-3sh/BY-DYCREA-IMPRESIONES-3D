// === CONFIGURACIÓN DE SUPABASE ===
const supabaseUrl = 'https://xlsrviwsygmzalbcuqyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc3J2aXdzeWdtemFsYmN1cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDkxMjUsImV4cCI6MjA4NzA4NTEyNX0.maNasYLRxMr4lPuTrSs8tLtXYPfhcw3FXpI1vH-PAz4'; 

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const contenedor = document.getElementById('contenedor-productos');
const contadorText = document.getElementById('contador-resultados');

// Variable global para guardar los productos
let productosGlobales = [];

// === SISTEMA DE NOTIFICACIONES ===
function mostrarNotificacion(mensaje, tipo = "oferta") {
    const toastContainer = document.getElementById('toast-container');
    const toast = document.createElement('div');
    toast.className = 'toast';
    const icono = tipo === 'oferta' ? '<i class="fas fa-fire"></i>' : '<i class="fas fa-bell"></i>';

    toast.innerHTML = `<div class="toast-icon">${icono}</div><div class="toast-text">${mensaje}</div>`;
    toastContainer.appendChild(toast);

    setTimeout(() => toast.classList.add('show'), 100);
    setTimeout(() => {
        toast.classList.remove('show');
        setTimeout(() => toast.remove(), 400); 
    }, 4000);
}

// === SKELETON LOADING ===
function mostrarSkeleton() {
    contenedor.innerHTML = '';
    for(let i=0; i<8; i++){
        contenedor.innerHTML += `
            <div class="skeleton-card">
                <div class="skeleton-img"></div>
                <div class="skeleton-title"></div>
                <div class="skeleton-text"></div>
                <div class="skeleton-price"></div>
            </div>
        `;
    }
}

// === ENVIAR A WHATSAPP ===
function cotizarPorWhatsApp(tituloProducto) {
    const numeroTelefonico = "56944018617"; // <--- RECUERDA PONER TU NÚMERO REAL AQUÍ
    const mensaje = `¡Hola! Vengo de dycrea.cl y me gustaría cotizar el producto: *${tituloProducto}*`;
    const url = `https://api.whatsapp.com/send?phone=${numeroTelefonico}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// === RENDERIZAR PRODUCTOS ===
// === RENDERIZAR PRODUCTOS ===
function renderizarProductos(lista) {
    contenedor.innerHTML = ''; 
    
    if(!lista || lista.length === 0) {
        contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light); margin-top: 20px;">No encontramos productos con esos filtros.</p>';
        contadorText.textContent = '0';
        return;
    }

    lista.forEach((prod, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.05}s`; 
        
        const imagenPrincipal = (prod.imagenes && prod.imagenes.length > 0) 
            ? prod.imagenes[0] 
            : 'https://via.placeholder.com/500x500?text=Foto+Pendiente';
        
        const precioFormateado = new Intl.NumberFormat('es-CL', {
            style: 'currency', currency: 'CLP'
        }).format(prod.precio);

        const materialPrincipal = (prod.material && prod.material.length > 0) ? prod.material.join(', ') : 'Impresión 3D';

        let badgesHTML = `<span class="badge category">${prod.categoria}</span>`;
        if(prod.precio < 10000) {
            badgesHTML += `<span class="badge oferta">¡Oferta!</span>`;
        } else if (prod.stock < 3) {
            badgesHTML += `<span class="badge" style="background:#ff9f43; color:white;">Últimas uds.</span>`;
        }

        // HTML DE LA TARJETA ECOMMERCE ACTUALIZADA
        card.innerHTML = `
            <div class="image-container">
                <div class="badges-container">
                    ${badgesHTML}
                </div>
                <a href="producto.html?id=${prod.id}">
                    <img src="${imagenPrincipal}" alt="${prod.titulo}" class="product-image">
                </a>
                
                <div class="quick-action-overlay">
                    <button class="btn-add-cart" onclick="cotizarPorWhatsApp('${prod.titulo}')" style="background: #25D366; color: white;">
                        <i class="fab fa-whatsapp" style="font-size: 1.2rem;"></i> Cotizar Rápidamente
                    </button>
                </div>
            </div>
            <div class="product-info">
                <a href="producto.html?id=${prod.id}">
                    <h3 class="product-title" style="cursor: pointer; color: inherit;">${prod.titulo}</h3>
                </a>
                <div class="product-material">${materialPrincipal}</div>
                <div class="product-price">${precioFormateado}</div>
            </div>
        `;
        contenedor.appendChild(card);
    });
    
    contadorText.textContent = lista.length;
}

// ==========================================
// 🚀 NUEVO: MOTOR DE FILTROS INTELIGENTE
// ==========================================
function aplicarFiltros() {
    // 1. Obtener texto del buscador
    const textoBuscado = document.getElementById('searchInput').value.toLowerCase();
    
    // 2. Obtener la categoría seleccionada (la que tiene la clase 'active')
    const categoriaActivaElement = document.querySelector('.category-list a.active');
    const categoriaSeleccionada = categoriaActivaElement ? categoriaActivaElement.textContent.trim() : 'Todas';

    // 3. Obtener los materiales seleccionados (checkboxes marcados)
    // Buscamos solo en la sección de materiales para evitar cruces con otros checkboxes
    const checkboxesMaterial = document.querySelectorAll('.filter-section:nth-of-type(2) input[type="checkbox"]:checked');
    const materialesSeleccionados = Array.from(checkboxesMaterial).map(cb => cb.closest('label').textContent.trim());

    // 4. Filtrar la lista global usando las 3 condiciones
    const productosFiltrados = productosGlobales.filter(prod => {
        
        // Filtro A: Texto
        const coincideTexto = prod.titulo.toLowerCase().includes(textoBuscado) || 
                              prod.categoria.toLowerCase().includes(textoBuscado) ||
                              (prod.material && prod.material.join(' ').toLowerCase().includes(textoBuscado));
        
        // Filtro B: Categoría
        const coincideCategoria = (categoriaSeleccionada === 'Todas') || (prod.categoria === categoriaSeleccionada);

        // Filtro C: Materiales
        let coincideMaterial = true;
        if (materialesSeleccionados.length > 0) {
            if (prod.material && prod.material.length > 0) {
                // Chequea si alguno de los materiales del producto está en la lista de seleccionados
                coincideMaterial = prod.material.some(m => materialesSeleccionados.includes(m));
            } else {
                coincideMaterial = false; // Si seleccionó filtro de material pero el producto no tiene, se oculta
            }
        }

        // El producto solo se muestra si cumple LAS 3 condiciones a la vez
        return coincideTexto && coincideCategoria && coincideMaterial;
    });

    // 5. Dibujar los resultados filtrados
    renderizarProductos(productosFiltrados);
}

// Escuchar cambios en el Buscador
document.getElementById('searchInput').addEventListener('input', aplicarFiltros);

// Escuchar clics en las Categorías
document.querySelectorAll('.category-list a').forEach(enlace => {
    enlace.addEventListener('click', (e) => {
        e.preventDefault(); // Evita que la página salte hacia arriba
        // Quitar la clase active a todas las categorías
        document.querySelectorAll('.category-list a').forEach(el => el.classList.remove('active'));
        // Poner la clase active solo a la que hicimos clic
        e.target.classList.add('active');
        // Ejecutar los filtros
        aplicarFiltros();
    });
});

// Escuchar cambios en los Checkboxes de Material y Precio
document.querySelectorAll('.sidebar input[type="checkbox"]').forEach(checkbox => {
    checkbox.addEventListener('change', aplicarFiltros);
});

// === CARGA DESDE SUPABASE ===
async function cargarProductosDesdeBD() {
    mostrarSkeleton(); 
    
    try {
        const { data, error } = await supabaseClient
            .from('productos')
            .select('*')
            .eq('disponible', true)
            .order('fecha_creacion', { ascending: false });

        if (error) throw error;

        productosGlobales = data;

        setTimeout(() => {
            // En vez de renderizar todo ciegamente, llamamos a aplicarFiltros 
            // para que respete si hay algún checkbox marcado por defecto en tu HTML
            aplicarFiltros();
            
            setTimeout(() => {
                mostrarNotificacion("🔥 ¡Catálogo actualizado!", "oferta");
            }, 1000);
        }, 600); 

    } catch (err) {
        console.error('❌ Error:', err);
        contenedor.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Ocurrió un error de conexión.</p>';
    }
}

cargarProductosDesdeBD();

// === LÓGICA EXCLUSIVA PARA MÓVIL (Mostrar/Ocultar Filtros) ===
const btnFiltros = document.getElementById('btnToggleFiltros');
const sidebar = document.getElementById('sidebarFiltros');

if(btnFiltros && sidebar) {
    btnFiltros.addEventListener('click', () => {
        sidebar.classList.toggle('mostrar');
        if(sidebar.classList.contains('mostrar')) {
            btnFiltros.innerHTML = '<i class="fas fa-times"></i> Ocultar Filtros';
        } else {
            btnFiltros.innerHTML = '<i class="fas fa-filter"></i> Mostrar Filtros';
        }
    });
}

// === LÓGICA DEL ACORDEÓN DEL FOOTER ===
const headersAccordiones = document.querySelectorAll('.accordion-header');
if(window.innerWidth <= 768) {
    headersAccordiones.forEach(header => {
        header.addEventListener('click', () => {
            const item = header.parentElement;
            if(item.classList.contains('activo')) {
                item.classList.remove('activo');
            } else {
                document.querySelectorAll('.accordion-item').forEach(otherItem => otherItem.classList.remove('activo'));
                item.classList.add('activo');
            }
        });
    });
}