// js/carrito.js
// === SISTEMA CENTRALIZADO DE CARRITO DE COMPRAS ===

let carrito = JSON.parse(localStorage.getItem('dycrea_carrito')) || [];

window.actualizarIconoCarrito = function() {
    const badges = document.querySelectorAll('.cart-badge');
    badges.forEach(badge => badge.textContent = carrito.length);
};

window.renderizarCarrito = function() {
    const container = document.getElementById('cartItemsContainer');
    const priceText = document.getElementById('cartTotalPrice');
    if(!container) return; 
    
    container.innerHTML = '';
    let total = 0;

    if(carrito.length === 0) {
        container.innerHTML = '<p style="text-align: center; color: gray; margin-top: 20px;">Tu carrito está vacío</p>';
        if(priceText) priceText.textContent = '$0';
        return;
    }

    carrito.forEach((item, index) => {
        total += item.precio;
        
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
            <img src="${item.imagen}" alt="${item.titulo}" loading="lazy">
            <div class="cart-item-info">
                <div class="cart-item-title">${item.titulo}</div>
                ${precioInfo}
                <button class="btn-remove-item" onclick="eliminarDelCarrito(${index})"><i class="fas fa-trash"></i> Quitar</button>
            </div>
        `;
        container.appendChild(div);
    });
    if(priceText) priceText.textContent = `$${total.toLocaleString('es-CL')}`;
};

window.agregarAlCarrito = function(id, titulo, precio, imagen, precioOriginal = null) {
    carrito.push({ id, titulo, precio, imagen, precioOriginal });
    localStorage.setItem('dycrea_carrito', JSON.stringify(carrito));
    actualizarIconoCarrito();
    renderizarCarrito();
    
    // Validamos si la función global de notificación existe (está en main.js)
    if(typeof window.mostrarNotificacion === 'function') {
        window.mostrarNotificacion('¡Agregado al carrito!', 'info');
    }
    abrirCarrito();
};

window.eliminarDelCarrito = function(index) {
    carrito.splice(index, 1);
    localStorage.setItem('dycrea_carrito', JSON.stringify(carrito));
    actualizarIconoCarrito();
    renderizarCarrito();
};

// === MANEJO DE LA VISTA DEL CARRITO ===
window.abrirCarrito = function() {
    document.getElementById('cartSidebar')?.classList.add('active');
    document.getElementById('cartOverlay')?.classList.add('active');
    history.pushState({ carritoAbierto: true }, '');
};

window.cerrarCarrito = function() {
    document.getElementById('cartSidebar')?.classList.remove('active');
    document.getElementById('cartOverlay')?.classList.remove('active');
};

window.cerrarYResetearCarrito = function() {
    cerrarCarrito();
    setTimeout(() => renderizarCarrito(), 300); 
};

// === PROCESAR COMPRA ===
window.procesarCompra = async function() {
    if(carrito.length === 0) return alert("El carrito está vacío.");
    
    const nombre = document.getElementById('cart-nombre').value.trim();
    const telefonoInput = document.getElementById('cart-telefono').value.trim();

    if(!nombre || nombre.length < 3) return alert("Por favor, ingresa un nombre válido (mínimo 3 letras).");
    if(telefonoInput.length !== 8) return alert("El número de teléfono debe tener exactamente 8 dígitos. (Ej: 12345678)");

    const telefonoCompleto = "+569" + telefonoInput;
    const btn = document.querySelector('.btn-checkout');
    const textoOriginal = btn.innerHTML;
    btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Procesando...';
    btn.disabled = true;
    btn.style.background = "#94a3b8"; 

    const numeroStore = "56944018617"; 
    let detalleCorreo = ``;
    let total = 0;
    let lineasProductos = ``;

    carrito.forEach((item, i) => {
        lineasProductos += `${i+1}. ${item.titulo} — $${item.precio.toLocaleString('es-CL')}\n`;
        detalleCorreo   += `${i+1}. ${item.titulo} — $${item.precio.toLocaleString('es-CL')}\n`;
        total += item.precio;
    });

    let mensajeWP =
`¡Hola! 👋 Soy *${nombre}* y me contacto desde *dycrea.cl* para hacer una cotización.

📦 *Productos que me interesan:*
${lineasProductos}
💰 *Total estimado: $${total.toLocaleString('es-CL')} CLP*

⚠️ _Entiendo que este pedido queda pendiente de confirmación por parte del vendedor._

Cuando puedas, por favor confírmame la disponibilidad y envíame los datos para la transferencia. ¡Gracias! 😊`;

    try {
        await emailjs.send("service_3qfabfd", "template_fso1jri", {
            nombre_cliente: nombre,
            telefono_cliente: telefonoCompleto,
            total_carrito: `$${total.toLocaleString('es-CL')}`,
            detalle_carrito: detalleCorreo
        });
    } catch (error) { console.log("Error silencioso:", error); }

    const url = `https://api.whatsapp.com/send?phone=${numeroStore}&text=${encodeURIComponent(mensajeWP)}`;
    window.open(url, '_blank');

    carrito = [];
    localStorage.removeItem('dycrea_carrito');
    actualizarIconoCarrito();
    
    document.getElementById('cartItemsContainer').innerHTML = `
        <div style="text-align: center; padding: 40px 20px; animation: fadeInPage 0.4s;">
            <i class="fas fa-check-circle" style="font-size: 4.5rem; color: #25D366; margin-bottom: 20px;"></i>
            <h3 style="color: var(--secondary-brand); font-size: 1.5rem; margin-bottom: 15px;">¡Listo, ${nombre}!</h3>
            <p style="color: var(--text-body); font-size: 0.95rem; margin-bottom: 25px; line-height: 1.6;">
                Tu cotización fue generada y hemos abierto WhatsApp.<br><br>
                <strong style="color: var(--danger);">¡IMPORTANTE!</strong> No olvides presionar <strong>"Enviar"</strong> en tu chat.
            </p>
            <button onclick="cerrarYResetearCarrito()" style="background: #f8fafc; color: var(--text-dark); padding: 12px 20px; border: 2px solid #e2e8f0; border-radius: 8px; font-weight: 700; cursor: pointer; width: 100%; transition: 0.3s;">
                Entendido, cerrar
            </button>
        </div>
    `;
    
    document.getElementById('cartTotalPrice').textContent = '$0';
    document.getElementById('cart-nombre').value = '';
    document.getElementById('cart-telefono').value = '';
    
    btn.innerHTML = textoOriginal;
    btn.disabled = false;
    btn.style.background = "#25D366"; 
};

// === EVENTOS UNIVERSALES AL CARGAR ===
document.addEventListener('DOMContentLoaded', () => {
    actualizarIconoCarrito();
    renderizarCarrito();

    document.querySelectorAll('.cart-btn, #openCartBtnProd').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault(); 
            abrirCarrito();
        });
    });
    document.getElementById('closeCartBtn')?.addEventListener('click', () => { history.back(); });
    document.getElementById('cartOverlay')?.addEventListener('click', () => { history.back(); });
    window.addEventListener('popstate', (e) => {
        if (document.getElementById('cartSidebar')?.classList.contains('active')) { cerrarCarrito(); }
    });
});