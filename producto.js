// === CONFIGURACIÓN DE SUPABASE ===
const supabaseUrl = 'https://xlsrviwsygmzalbcuqyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc3J2aXdzeWdtemFsYmN1cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDkxMjUsImV4cCI6MjA4NzA4NTEyNX0.maNasYLRxMr4lPuTrSs8tLtXYPfhcw3FXpI1vH-PAz4'; 

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// Función para obtener el ID de la URL
function obtenerIdDeLaURL() {
    const parametros = new URLSearchParams(window.location.search);
    return parametros.get('id');
}

// Función principal
async function cargarDetalleProducto() {
    const productoId = obtenerIdDeLaURL();

    if (!productoId) {
        document.getElementById('loading-spinner').innerHTML = '<h2>Error: No se encontró el producto.</h2><a href="index.html">Volver a la tienda</a>';
        return;
    }

    try {
        // Buscar el producto en Supabase por su ID
        const { data, error } = await supabaseClient
            .from('productos')
            .select('*')
            .eq('id', productoId)
            .single(); // Pedimos que traiga solo 1 resultado

        if (error) throw error;

        // --- LLENAR LOS DATOS EN EL HTML ---
        
        // Imagen
        const imagenUrl = (data.imagenes && data.imagenes.length > 0) ? data.imagenes[0] : 'https://via.placeholder.com/800x800?text=Foto+Pendiente';
        document.getElementById('detail-image').src = imagenUrl;
        
        // Textos principales
        document.getElementById('detail-title').textContent = data.titulo;
        document.getElementById('detail-badge').textContent = data.categoria;
        document.getElementById('detail-desc').textContent = data.descripcion || "Sin descripción detallada.";
        
        // Precio
        const precioCLP = new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(data.precio);
        document.getElementById('detail-price').textContent = precioCLP;

        // Especificaciones (Validamos si existen, si no ponemos un guion)
        document.getElementById('detail-material').textContent = (data.material && data.material.length > 0) ? data.material.join(', ') : 'No especificado';
        document.getElementById('detail-color').textContent = (data.color && data.color.length > 0) ? data.color.join(', ') : 'Varios / A elección';
        document.getElementById('detail-altura').textContent = data.altura ? data.altura : 'N/A';
        document.getElementById('detail-peso').textContent = data.peso ? data.peso : 'N/A';
        document.getElementById('detail-pers').textContent = data.personalizable ? 'Sí' : 'No';

        // Botón WhatsApp
        document.getElementById('btn-cotizar-detail').addEventListener('click', () => {
            const numeroTelefonico = "56912345678"; // <--- PON TU NÚMERO AQUÍ
            const mensaje = `¡Hola! Vengo de dycrea.cl y me interesa cotizar el producto exacto: *${data.titulo}*`;
            const url = `https://api.whatsapp.com/send?phone=${numeroTelefonico}&text=${encodeURIComponent(mensaje)}`;
            window.open(url, '_blank');
        });

        // Ocultar carga y mostrar producto
        document.getElementById('loading-spinner').style.display = 'none';
        document.getElementById('product-detail-content').style.display = 'grid';

    } catch (err) {
        console.error("Error al cargar detalle:", err);
        document.getElementById('loading-spinner').innerHTML = '<h2>Error de conexión.</h2><p>No se pudo cargar la información.</p><a href="index.html">Volver a la tienda</a>';
    }
}

cargarDetalleProducto();