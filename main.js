// === CONFIGURACIÓN DE SUPABASE ===
// REEMPLAZA ESTO CON TUS DATOS REALES DE SUPABASE
const supabaseUrl = 'https://xlsrviwsygmzalbcuqyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc3J2aXdzeWdtemFsYmN1cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDkxMjUsImV4cCI6MjA4NzA4NTEyNX0.maNasYLRxMr4lPuTrSs8tLtXYPfhcw3FXpI1vH-PAz4'; 

// Inicializar Supabase (CAMBIO: le pusimos 'supabaseClient' para que no choque)
const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const contenedor = document.getElementById('contenedor-productos');
const contadorText = document.getElementById('contador-resultados');

// === FUNCIÓN PARA DIBUJAR LOS PRODUCTOS EN PANTALLA ===
function renderizarProductos(lista) {
    contenedor.innerHTML = ''; 
    
    if(!lista || lista.length === 0) {
        contenedor.innerHTML = '<p style="grid-column: 1/-1; text-align: center;">No hay productos disponibles en este momento.</p>';
        contadorText.textContent = '0';
        return;
    }

    lista.forEach(prod => {
        const card = document.createElement('div');
        card.className = 'product-card';
        
        // Imagen por defecto si no hay foto en la BD
        const imagenPrincipal = (prod.imagenes && prod.imagenes.length > 0) 
            ? prod.imagenes[0] 
            : 'https://via.placeholder.com/500x400?text=Foto+Pendiente';
        
        // Formatear precio a CLP
        const precioFormateado = new Intl.NumberFormat('es-CL', {
            style: 'currency',
            currency: 'CLP'
        }).format(prod.precio);

        // Si no hay material especificado
        const materialPrincipal = (prod.material && prod.material.length > 0) ? prod.material[0] : 'Impresión 3D';

        card.innerHTML = `
            <div class="image-container">
                <span class="category-badge">${prod.categoria}</span>
                <img src="${imagenPrincipal}" alt="${prod.titulo}" class="product-image">
            </div>
            <div class="product-info">
                <h3 class="product-title">${prod.titulo}</h3>
                <div class="product-material">${materialPrincipal}</div>
                <div class="card-footer">
                    <div class="product-price">${precioFormateado}</div>
                    <a href="#" class="btn-details">Ver detalles</a>
                </div>
            </div>
        `;
        contenedor.appendChild(card);
    });
    
    contadorText.textContent = lista.length;
}

// === FUNCIÓN PARA CONSULTAR A SUPABASE ===
async function cargarProductosDesdeBD() {
    console.log("Iniciando conexión con Supabase..."); 
    
    try {
        // CAMBIO: Ahora usamos supabaseClient en lugar de supabase
        const { data, error } = await supabaseClient
            .from('productos')
            .select('*')
            .eq('disponible', true)
            .order('fecha_creacion', { ascending: false });

        if (error) {
            console.error('❌ Error de Supabase:', error.message);
            contenedor.innerHTML = '<p style="color: red; text-align: center; grid-column: 1/-1;">Error al cargar la base de datos. Revisa la consola (F12).</p>';
            return;
        }

        console.log("✅ Datos recibidos de Supabase:", data); 
        renderizarProductos(data);

    } catch (err) {
        console.error('❌ Error de red o código:', err);
        contenedor.innerHTML = '<p style="text-align: center; grid-column: 1/-1;">Ocurrió un error inesperado.</p>';
    }
}

// Ejecutar cuando cargue la página
cargarProductosDesdeBD();