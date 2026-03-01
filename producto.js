// === CONFIGURACIÓN DE SUPABASE ===
const supabaseUrl = 'https://xlsrviwsygmzalbcuqyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc3J2aXdzeWdtemFsYmN1cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDkxMjUsImV4cCI6MjA4NzA4NTEyNX0.maNasYLRxMr4lPuTrSs8tLtXYPfhcw3FXpI1vH-PAz4'; 
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

function obtenerIdDeLaURL() { return new URLSearchParams(window.location.search).get('id'); }

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
                    imgPrincipal.src = img; // Cambia la grande al hacer clic
                    document.querySelectorAll('.thumbnail').forEach(t => t.classList.remove('active'));
                    thumb.classList.add('active');
                });
                thumbContainer.appendChild(thumb);
            });
        }
        
        // Textos
        document.getElementById('detail-title').textContent = data.titulo;
        document.getElementById('detail-badge').textContent = data.categoria;
        document.getElementById('detail-desc').textContent = data.descripcion || "Sin descripción.";
        document.getElementById('detail-price').textContent = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(data.precio);

        // Especificaciones
        document.getElementById('detail-material').textContent = (data.material && data.material.length > 0) ? data.material.join(', ') : 'N/A';
        document.getElementById('detail-color').textContent = (data.color && data.color.length > 0) ? data.color.join(', ') : 'A elección';
        document.getElementById('detail-altura').textContent = data.altura || 'N/A';
        document.getElementById('detail-peso').textContent = data.peso || 'N/A';
        document.getElementById('detail-pers').textContent = data.personalizable ? 'Sí' : 'No';

        // Botón: Ahora agrega al carrito en lugar de enviar directo
        const btnAccion = document.getElementById('btn-cotizar-detail');
        btnAccion.innerHTML = '<i class="fas fa-cart-plus"></i> Agregar a mi Cotización';
        btnAccion.style.background = 'var(--secondary-brand)'; // Oscuro premium
        
        btnAccion.addEventListener('click', () => {
            let carrito = JSON.parse(localStorage.getItem('dycrea_carrito')) || [];
            carrito.push({ id: data.id, titulo: data.titulo, precio: data.precio, imagen: imagenUrl });
            localStorage.setItem('dycrea_carrito', JSON.stringify(carrito));
            
            alert(`¡${data.titulo} agregado a tu carrito!\nVuelve a la tienda para revisar tu cotización.`);
            // Opcional: Redirigir a index.html para abrir el carrito
            window.location.href = 'index.html'; 
        });

        document.getElementById('loading-spinner').style.display = 'none';
        document.getElementById('product-detail-content').style.display = 'grid';

    } catch (err) {
        console.error(err);
        document.getElementById('loading-spinner').innerHTML = '<h2>Error al cargar</h2>';
    }
}
cargarDetalleProducto();