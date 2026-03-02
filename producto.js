// === CONFIGURACIÓN DE SUPABASE ===
const supabaseUrl = 'https://xlsrviwsygmzalbcuqyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc3J2aXdzeWdtemFsYmN1cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDkxMjUsImV4cCI6MjA4NzA4NTEyNX0.maNasYLRxMr4lPuTrSs8tLtXYPfhcw3FXpI1vH-PAz4'; 
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

function obtenerIdDeLaURL() { return new URLSearchParams(window.location.search).get('id'); }

// === SISTEMA DE CARRITO (Replicado para página de detalles) ===
let carrito = JSON.parse(localStorage.getItem('dycrea_carrito')) || [];

function actualizarIconoCarrito() {
    const badge = document.querySelector('.cart-badge');
    if(badge) badge.textContent = carrito.length;
}

function renderizarCarrito() {
    const container = document.getElementById('cartItemsContainer');
    const priceText = document.getElementById('cartTotalPrice');
    if(!container) return; 
    
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

function eliminarDelCarrito(index) {
    carrito.splice(index, 1);
    localStorage.setItem('dycrea_carrito', JSON.stringify(carrito));
    actualizarIconoCarrito();
    renderizarCarrito();
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

// Eventos del Carrito en UI
document.getElementById('openCartBtnProd')?.addEventListener('click', () => {
    document.getElementById('cartSidebar').classList.add('active');
    document.getElementById('cartOverlay').classList.add('active');
});
document.getElementById('closeCartBtn')?.addEventListener('click', () => {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
});
document.getElementById('cartOverlay')?.addEventListener('click', () => {
    document.getElementById('cartSidebar').classList.remove('active');
    document.getElementById('cartOverlay').classList.remove('active');
});


// === CARGAR EL DETALLE DEL PRODUCTO ===
async function cargarDetalleProducto() {
    const productoId = obtenerIdDeLaURL();
    if (!productoId) { document.getElementById('loading-spinner').innerHTML = '<h2>Error.</h2>'; return; }

    try {
        const { data, error } = await supabaseClient.from('productos').select('*').eq('id', productoId).single();
        if (error) throw error;

        // --- GALERÍA DE IMÁGENES ---
        const imagenUrl = (data.imagenes && data.imagenes.length > 0) ? data.imagenes[0] : 'https://via.placeholder.com/800x800';
        const imgPrincipal = document.getElementById('detail-image');
        imgPrincipal.src = imagenUrl;

        const thumbContainer = document.getElementById('thumbnails-container');
        if(data.imagenes && data.imagenes.length > 1) {
            data.imagenes.forEach((img, idx) => {
                const thumb = document.createElement('img');
                thumb.src = img;
                thumb.className = idx === 0 ? 'thumbnail active' : 'thumbnail';
                thumb.addEventListener('click', () => {
                    imgPrincipal.src = img; 
                    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                });
                thumbContainer.appendChild(thumb);
            });
        }
        
        // Textos y Lógica de Ofertas
        document.getElementById('detail-title').textContent = data.titulo;
        
        let esOfertaValida = data.precio_oferta && (!data.fecha_fin_oferta || new Date(data.fecha_fin_oferta) > new Date());
        let precioMostrar = esOfertaValida ? data.precio_oferta : data.precio;
        
        if (esOfertaValida) {
            document.getElementById('detail-price').innerHTML = `<span style="text-decoration: line-through; color: #a0aec0; font-size: 1.5rem; margin-right: 10px;">$${data.precio.toLocaleString('es-CL')}</span> $${precioMostrar.toLocaleString('es-CL')}`;
        } else {
            document.getElementById('detail-price').textContent = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(precioMostrar);
        }

        // Lógica de Etiquetas en Detalle
        let etiquetasExtras = '';
        if (data.etiqueta_destacada) {
            etiquetasExtras = ` <span style="background:var(--secondary-brand); color:white; font-size:0.8rem; padding: 4px 10px; border-radius:4px; margin-left: 10px;">${data.etiqueta_destacada}</span>`;
        } else if (esOfertaValida) {
             let dcto = Math.round(100 - (data.precio_oferta * 100 / data.precio));
             etiquetasExtras = ` <span style="background:var(--danger); color:white; font-size:0.8rem; padding: 4px 10px; border-radius:4px; margin-left: 10px;">¡${dcto}% OFF!</span>`;
        }
        document.getElementById('detail-badge').innerHTML = data.categoria + etiquetasExtras;
        
        document.getElementById('detail-desc').textContent = data.descripcion || "Sin descripción.";

        // Más abajo, asegúrate de que el botón de AGREGAR AL CARRITO use precioMostrar
        const btnAccion = document.getElementById('btn-cotizar-detail');
        btnAccion.innerHTML = '<i class="fas fa-cart-plus"></i> Agregar a mi Cotización';
        btnAccion.style.background = 'var(--secondary-brand)'; 
        
        // Aquí debes reemplazar el evento del click por este:
        btnAccion.onclick = () => {
            carrito.push({ id: data.id, titulo: data.titulo, precio: precioMostrar, imagen: imagenUrl });
            localStorage.setItem('dycrea_carrito', JSON.stringify(carrito));
            actualizarIconoCarrito();
            renderizarCarrito();
            
            document.getElementById('cartSidebar').classList.add('active');
            document.getElementById('cartOverlay').classList.add('active');
        };

        document.getElementById('loading-spinner').style.display = 'none';
        document.getElementById('product-detail-content').style.display = 'grid';

    } catch (err) {
        console.error(err);
        document.getElementById('loading-spinner').innerHTML = '<h2>Error al cargar</h2>';
    }
}

// Inicializadores
cargarDetalleProducto();
actualizarIconoCarrito();
renderizarCarrito();

// === LÓGICA DEL ACORDEÓN DEL FOOTER ===
document.querySelectorAll('.accordion-header').forEach(header => {
    header.addEventListener('click', () => {
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