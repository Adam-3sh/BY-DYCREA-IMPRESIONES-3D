// === CONFIGURACIÓN DE SUPABASE ===
const supabaseUrl = 'https://xlsrviwsygmzalbcuqyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc3J2aXdzeWdtemFsYmN1cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDkxMjUsImV4cCI6MjA4NzA4NTEyNX0.maNasYLRxMr4lPuTrSs8tLtXYPfhcw3FXpI1vH-PAz4'; 

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const contenedor = document.getElementById('contenedor-productos');
const contadorText = document.getElementById('contador-resultados');

// Variable global para guardar los productos y poder filtrarlos rápido
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
// Reemplaza "569XXXXXXXX" por tu número de teléfono real con el código de Chile (56)
function cotizarPorWhatsApp(tituloProducto) {
    const numeroTelefonico = "56944018617"; // <--- PON TU NÚMERO AQUÍ
    const mensaje = `¡Hola! Vengo de dycrea.cl y me gustaría cotizar el producto: *${tituloProducto}*`;
    const url = `https://api.whatsapp.com/send?phone=${numeroTelefonico}&text=${encodeURIComponent(mensaje)}`;
    window.open(url, '_blank');
}

// === RENDERIZAR PRODUCTOS ECOMMERCE ===
function renderizarProductos(lista) {
    contenedor.innerHTML = ''; 
    
    if(!lista || lista.length === 0) {
        contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align: center; color: var(--text-light); margin-top: 20px;">No encontramos productos que coincidan con tu búsqueda.</p>';
        contadorText.textContent = '0';
        return;
    }

    lista.forEach((prod, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.05}s`; // Cascada rápida
        
        const imagenPrincipal = (prod.imagenes && prod.imagenes.length > 0) 
            ? prod.imagenes[0] 
            : 'https://via.placeholder.com/500x500?text=Foto+Pendiente';
        
        const precioFormateado = new Intl.NumberFormat('es-CL', {
            style: 'currency', currency: 'CLP'
        }).format(prod.precio);

        const materialPrincipal = (prod.material && prod.material.length > 0) ? prod.material.join(', ') : 'Impresión 3D';

        // Lógica de Badges
        let badgesHTML = `<span class="badge category">${prod.categoria}</span>`;
        if(prod.precio < 10000) {
            badgesHTML += `<span class="badge oferta">¡Oferta!</span>`;
        } else if (prod.stock < 3) {
            badgesHTML += `<span class="badge" style="background:#ff9f43; color:white;">Últimas uds.</span>`;
        }

        // HTML DE LA TARJETA ECOMMERCE
        card.innerHTML = `
            <div class="image-container">
                <div class="badges-container">
                    ${badgesHTML}
                </div>
                <img src="${imagenPrincipal}" alt="${prod.titulo}" class="product-image">
                
                <div class="quick-action-overlay">
                    <button class="btn-add-cart" onclick="cotizarPorWhatsApp('${prod.titulo}')" style="background: #25D366; color: white;">
                        <i class="fab fa-whatsapp" style="font-size: 1.2rem;"></i> Cotizar
                    </button>
                </div>
            </div>
            <div class="product-info">
                <h3 class="product-title">${prod.titulo}</h3>
                <div class="product-material">${materialPrincipal}</div>
                <div class="product-price">${precioFormateado}</div>
            </div>
        `;
        contenedor.appendChild(card);
    });
    
    contadorText.textContent = lista.length;
}

// === BUSCADOR EN TIEMPO REAL ===
document.getElementById('searchInput').addEventListener('input', (e) => {
    const textoBuscado = e.target.value.toLowerCase();
    
    // Filtramos la lista global de productos
    const productosFiltrados = productosGlobales.filter(prod => {
        return prod.titulo.toLowerCase().includes(textoBuscado) || 
               prod.categoria.toLowerCase().includes(textoBuscado) ||
               (prod.material && prod.material.join(' ').toLowerCase().includes(textoBuscado));
    });

    renderizarProductos(productosFiltrados);
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

        // Guardamos los datos en la variable global para el buscador
        productosGlobales = data;

        setTimeout(() => {
            renderizarProductos(productosGlobales);
            // Mostrar notificación de bienvenida
            setTimeout(() => {
                mostrarNotificacion("🔥 ¡Nueva colección de Props disponible!", "oferta");
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