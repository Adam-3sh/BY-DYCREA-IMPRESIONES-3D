// === CONFIGURACIÓN DE SUPABASE ===
const supabaseUrl = 'https://xlsrviwsygmzalbcuqyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc3J2aXdzeWdtemFsYmN1cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDkxMjUsImV4cCI6MjA4NzA4NTEyNX0.maNasYLRxMr4lPuTrSs8tLtXYPfhcw3FXpI1vH-PAz4'; 
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

function obtenerIdDeLaURL() { return new URLSearchParams(window.location.search).get('id'); }

// === SISTEMA DE CARRITO ===
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
        
        // --- MAGIA: Calcular diseño de oferta para el carrito ---
        let precioInfo = `<div class="cart-item-price">$${item.precio.toLocaleString('es-CL')}</div>`;
        if (item.precioOriginal && item.precioOriginal > item.precio) {
            let ahorro = item.precioOriginal - item.precio;
            precioInfo = `
                <div class="cart-item-price" style="display: flex; flex-direction: column; line-height: 1.2; margin-top: 5px;">
                    <span style="text-decoration: line-through; color: #a0aec0; font-size: 0.8rem; font-weight: 500;">$${item.precioOriginal.toLocaleString('es-CL')}</span>
                    <span style="color: var(--danger); font-size: 1.1rem;">$${item.precio.toLocaleString('es-CL')}</span>
                    <span style="color: #27ae60; font-size: 0.75rem; font-weight: 700;">¡Ahorras $${ahorro.toLocaleString('es-CL')}!</span>
                </div>
            `;
        }

        const div = document.createElement('div');
        div.className = 'cart-item';
        div.innerHTML = `
            <img src="${item.imagen}" alt="${item.titulo}">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.titulo}</div>
                ${precioInfo}
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

// === PROCESAR COMPRA (CORREO SILENCIOSO + WHATSAPP) ===
// === PROCESAR COMPRA (CORREO SILENCIOSO + WHATSAPP) ===
async function procesarCompra() {
    if(carrito.length === 0) return alert("El carrito está vacío.");
    
    // 1. Capturar y Validar datos del cliente
    const nombre = document.getElementById('cart-nombre').value.trim();
    const telefonoInput = document.getElementById('cart-telefono').value.trim();

    // Validaciones básicas
    if(!nombre || nombre.length < 3) {
        return alert("Por favor, ingresa un nombre válido (mínimo 3 letras).");
    }
    if(telefonoInput.length !== 8) {
        return alert("El número de teléfono debe tener exactamente 8 dígitos. (Ej: 12345678)");
    }

    // Armamos el teléfono completo de forma automática
    const telefonoCompleto = "+569" + telefonoInput;

    // 2. Cambiar botón a estado de carga
    const btn = document.querySelector('.btn-checkout');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    btn.disabled = true;
    btn.style.background = "#94a3b8"; 

    const numeroStore = "56974139790"; // TU NÚMERO
    let mensajeWP = `*¡Hola! Soy ${nombre} y vengo de dycrea.cl para confirmar mi pedido:*\n\n`;
    let detalleCorreo = ``;
    let total = 0;

    carrito.forEach((item, i) => {
        mensajeWP += `${i+1}. ${item.titulo} - $${item.precio.toLocaleString('es-CL')}\n`;
        detalleCorreo += `${i+1}. ${item.titulo} - $${item.precio.toLocaleString('es-CL')}\n`;
        total += item.precio;
    });

    mensajeWP += `\n*Total Estimado: $${total.toLocaleString('es-CL')}*`;
    mensajeWP += `\n\nPor favor, envíame los datos bancarios para realizar la transferencia y adjuntar el comprobante. 🧾`;

    // 3. ENVIAR CORREO SILENCIOSO DE RESPALDO A DYCREA
    try {
        await emailjs.send(
            "service_ao0l06w",   // ¡RECUERDA REEMPLAZAR ESTO!
            "template_zgoy0jh",  // ¡RECUERDA REEMPLAZAR ESTO!
            {
                nombre_cliente: nombre,
                telefono_cliente: telefonoCompleto,
                total_carrito: `$${total.toLocaleString('es-CL')}`,
                detalle_carrito: detalleCorreo
            }
        );
        console.log("Respaldo enviado a dycrea exitosamente.");
    } catch (error) {
        console.log("Error silencioso (no detener compra):", error);
    }

    // 4. ABRIR WHATSAPP Y RESTAURAR BOTÓN
    btn.innerHTML = textoOriginal;
    btn.disabled = false;
    btn.style.background = "#25D366"; 
    
    // Abrir WhatsApp al número de la tienda
    const url = `https://api.whatsapp.com/send?phone=${numeroStore}&text=${encodeURIComponent(mensajeWP)}`;
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
    if (!productoId) { document.getElementById('loading-spinner').innerHTML = '<h2>Error. No se encontró el producto.</h2>'; return; }

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
        
        // --- TEXTOS Y OFERTAS ---
        document.getElementById('detail-title').textContent = data.titulo;
        document.getElementById('detail-desc').textContent = data.descripcion || "Sin descripción adicional.";
        
        // Calcular si hay oferta vigente
        let esOfertaValida = data.precio_oferta && (!data.fecha_fin_oferta || new Date(data.fecha_fin_oferta) > new Date());
        let precioMostrar = esOfertaValida ? data.precio_oferta : data.precio;
        
        if (esOfertaValida) {
            let dcto = Math.round(100 - (data.precio_oferta * 100 / data.precio));
            let textoTermina = '';
            
            // Si le pusiste días de duración, mostramos un aviso de urgencia
            if (data.fecha_fin_oferta) {
                const diasRestantes = Math.ceil((new Date(data.fecha_fin_oferta) - new Date()) / (1000 * 60 * 60 * 24));
                textoTermina = `<div style="font-size: 0.95rem; color: var(--danger); margin-top: 8px; font-weight: 700;"><i class="fas fa-stopwatch"></i> ¡Termina en ${diasRestantes} días!</div>`;
            }

            // Diseño Premium de Oferta
            document.getElementById('detail-price').innerHTML = `
                <div style="display: flex; flex-direction: column; gap: 5px;">
                    <span style="font-size: 1.1rem; color: #a0aec0; font-weight: 500; text-decoration: line-through;">Normal: $${data.precio.toLocaleString('es-CL')}</span>
                    <div style="display: flex; align-items: center; gap: 15px; flex-wrap: wrap;">
                        <span style="color: var(--danger); font-size: 3rem; font-weight: 800; line-height: 1;">$${precioMostrar.toLocaleString('es-CL')}</span>
                        <span style="background: var(--danger); color: white; padding: 6px 14px; border-radius: 8px; font-size: 1.2rem; font-weight: 800; box-shadow: 0 4px 15px rgba(255, 71, 87, 0.4);">¡${dcto}% OFF!</span>
                    </div>
                    ${textoTermina}
                </div>
            `;
        } else {
            // Diseño normal sin oferta
            document.getElementById('detail-price').textContent = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(precioMostrar);
        }

        // Lógica de Etiquetas (Badges en la imagen)
        let etiquetasExtras = '';
        if (data.etiqueta_destacada) {
            etiquetasExtras = ` <span style="background:var(--secondary-brand); color:white; font-size:0.8rem; padding: 4px 10px; border-radius:4px; margin-left: 10px;">${data.etiqueta_destacada}</span>`;
        } else if (esOfertaValida) {
             let dcto = Math.round(100 - (data.precio_oferta * 100 / data.precio));
             etiquetasExtras = ` <span style="background:var(--danger); color:white; font-size:0.8rem; padding: 4px 10px; border-radius:4px; margin-left: 10px;">¡${dcto}% OFF!</span>`;
        }
        document.getElementById('detail-badge').innerHTML = data.categoria + etiquetasExtras;

        // --- ESPECIFICACIONES TÉCNICAS (Protegidas contra errores) ---
        // Convertimos a string seguro incluso si Supabase devuelve un formato extraño
        const formatArray = (arr) => Array.isArray(arr) ? arr.join(', ') : (typeof arr === 'string' ? arr.replace(/[{""}]/g, '') : '');
        
        const matStr = formatArray(data.material);
        const colStr = formatArray(data.color);

        document.getElementById('detail-material').textContent = matStr ? matStr : 'No especificado';
        document.getElementById('detail-color').textContent = colStr ? colStr : 'A elección';
        document.getElementById('detail-altura').textContent = data.altura ? `${data.altura} cm` : 'No especificada';
        document.getElementById('detail-peso').textContent = data.peso ? `${data.peso} g` : 'No especificado';
        document.getElementById('detail-pers').textContent = data.personalizable ? 'Sí' : 'No';

        // --- TEXTO DE STOCK DINÁMICO ---
        const sinStock = data.stock <= 0;
        const textoStock = document.getElementById('detail-stock');
        if (textoStock) {
            textoStock.textContent = sinStock ? 'Agotado' : `${data.stock} disponibles`;
            textoStock.style.color = sinStock ? 'var(--danger)' : '#27ae60';
        }

        // --- BOTÓN: AGREGAR AL CARRITO (Con bloqueo de stock) ---
        const btnAccion = document.getElementById('btn-cotizar-detail');
        
        if (sinStock) {
            btnAccion.innerHTML = '<i class="fas fa-times-circle"></i> Producto Agotado';
            btnAccion.style.background = '#cbd5e1'; 
            btnAccion.style.color = '#64748b';
            btnAccion.style.cursor = 'not-allowed';
            btnAccion.onclick = (e) => { e.preventDefault(); }; // Evita clics
        } else {
            btnAccion.innerHTML = '<i class="fas fa-cart-plus"></i> Agregar al Carrito';
            btnAccion.style.background = 'var(--secondary-brand)'; 
            
            btnAccion.onclick = () => {
                carrito.push({ 
                    id: data.id, 
                    titulo: data.titulo, 
                    precio: precioMostrar, 
                    imagen: imagenUrl,
                    precioOriginal: esOfertaValida ? data.precio : null 
                });
                localStorage.setItem('dycrea_carrito', JSON.stringify(carrito));
                actualizarIconoCarrito();
                renderizarCarrito();
                
                document.getElementById('cartSidebar').classList.add('active');
                document.getElementById('cartOverlay').classList.add('active');
            };
        }

        // Mostrar la página una vez que todo cargó
        document.getElementById('loading-spinner').style.display = 'none';
        document.getElementById('product-detail-content').style.display = 'grid';

    } catch (err) {
        console.error(err);
        document.getElementById('loading-spinner').innerHTML = '<h2>Error al cargar los datos de la figura.</h2>';
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