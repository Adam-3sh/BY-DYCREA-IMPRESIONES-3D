// === CONFIGURACIÓN DE SUPABASE ===
const supabaseUrl = 'https://xlsrviwsygmzalbcuqyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc3J2aXdzeWdtemFsYmN1cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDkxMjUsImV4cCI6MjA4NzA4NTEyNX0.maNasYLRxMr4lPuTrSs8tLtXYPfhcw3FXpI1vH-PAz4'; 

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const contenedor = document.getElementById('contenedor-productos');
const contadorText = document.getElementById('contador-resultados');

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

// === RENDERIZAR PRODUCTOS ECOMMERCE ===
function renderizarProductos(lista) {
    contenedor.innerHTML = ''; 
    
    if(!lista || lista.length === 0) {
        contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No encontramos productos.</p>';
        contadorText.textContent = '0';
        return;
    }

    lista.forEach((prod, index) => {
        const card = document.createElement('div');
        card.className = 'product-card';
        card.style.animationDelay = `${index * 0.1}s`; // Efecto cascada más rápido
        
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
                    <button class="btn-add-cart" onclick="mostrarNotificacion('Agregado a cotización', 'info')">
                        <i class="fas fa-shopping-cart"></i> Cotizar
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

        setTimeout(() => {
            renderizarProductos(data);
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