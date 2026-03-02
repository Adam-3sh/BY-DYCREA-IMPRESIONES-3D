// === CONFIGURACIÓN DE SUPABASE ===
const supabaseUrl = 'https://xlsrviwsygmzalbcuqyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc3J2aXdzeWdtemFsYmN1cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDkxMjUsImV4cCI6MjA4NzA4NTEyNX0.maNasYLRxMr4lPuTrSs8tLtXYPfhcw3FXpI1vH-PAz4'; 

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

// === 🔒 BARRERA DE SEGURIDAD (CANDADO) ===
async function verificarSesion() {
    const { data: { session } } = await supabaseClient.auth.getSession();
    if (!session) {
        // Si no hay sesión iniciada, patearlo al login
        window.location.replace('login.html');
    }
}
verificarSesion();

// Función para cerrar sesión (logout)
window.cerrarSesion = async function() {
    await supabaseClient.auth.signOut();
    window.location.replace('login.html');
};
// =========================================

// === LÓGICA DE MÓDULOS DESPLEGABLES ===
window.toggleModule = function(headerElement) {
    const module = headerElement.parentElement;
    document.querySelectorAll('.admin-module').forEach(m => {
        if(m !== module) m.classList.remove('active');
    });

    module.classList.toggle('active');
};

const formulario = document.getElementById('form-publicar');
const btnSubmit = document.getElementById('btn-submit');
const mensajeEstado = document.getElementById('mensaje-estado');
const inputImagenes = document.getElementById('imagenes');
const previewContainer = document.getElementById('image-preview-container');
const fileCountText = document.getElementById('file-count-text');

// === GESTOR DE CATEGORÍAS EN PANEL VENDEDOR ===
const selectCategoria = document.getElementById('categoria');

async function cargarCategoriasAdmin() {
    try {
        const { data, error } = await supabaseClient.from('categorias').select('nombre').order('nombre');
        if (error) throw error;
        
        selectCategoria.innerHTML = '<option value="">Selecciona una categoría...</option>';
        data.forEach(cat => {
            selectCategoria.innerHTML += `<option value="${cat.nombre}">${cat.nombre}</option>`;
        });
    } catch (err) {
        console.error("Error al cargar categorías:", err);
        selectCategoria.innerHTML = '<option value="">Error al cargar</option>';
    }
}

// Cargar al iniciar
cargarCategoriasAdmin();

// Botón [+] Agregar Categoría
document.getElementById('btn-add-cat').addEventListener('click', async () => {
    const nuevaCat = prompt("Ingresa el nombre de la nueva categoría:");
    if (nuevaCat && nuevaCat.trim() !== "") {
        try {
            const { error } = await supabaseClient.from('categorias').insert([{ nombre: nuevaCat.trim() }]);
            if (error) throw error;
            alert(`✅ Categoría "${nuevaCat}" agregada con éxito.`);
            cargarCategoriasAdmin(); // Recargar el menú
        } catch (err) {
            console.error("Error agregando categoría:", err);
            alert("❌ Hubo un error al agregar (Puede que el nombre ya exista).");
        }
    }
});

// Botón [-] Eliminar Categoría Seleccionada
document.getElementById('btn-del-cat').addEventListener('click', async () => {
    const catAEliminar = selectCategoria.value;
    if (!catAEliminar) return alert("⚠️ Primero selecciona una categoría del menú para eliminarla.");
    
    if (confirm(`¿Estás 100% seguro de eliminar la categoría "${catAEliminar}"?`)) {
        try {
            const { error } = await supabaseClient.from('categorias').delete().eq('nombre', catAEliminar);
            if (error) throw error;
            alert(`🗑️ Categoría "${catAEliminar}" eliminada.`);
            cargarCategoriasAdmin(); // Recargar el menú
        } catch (err) {
            console.error(err);
            alert("❌ Error al eliminar la categoría.");
        }
    }
});

// === VISTA PREVIA DE LAS IMÁGENES ===
inputImagenes.addEventListener('change', function() {
    previewContainer.innerHTML = ''; // Limpiar previas anteriores
    const archivos = this.files;
    
    if (archivos.length === 0) {
        fileCountText.textContent = "Ningún archivo seleccionado";
        return;
    }
    
    fileCountText.textContent = `${archivos.length} archivo(s) seleccionado(s)`;

    // Crear miniatura por cada foto
    Array.from(archivos).forEach(archivo => {
        const imgElement = document.createElement('img');
        imgElement.src = URL.createObjectURL(archivo);
        imgElement.className = 'preview-img';
        previewContainer.appendChild(imgElement);
    });
});

// === PROCESO DE PUBLICACIÓN ===
formulario.addEventListener('submit', async (e) => {
    e.preventDefault(); 

    btnSubmit.disabled = true;
    btnSubmit.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo archivos...';
    mensajeEstado.textContent = '';

    try {
        const archivos = inputImagenes.files;
        let urlsImagenesSubidas = [];

        // 1. SUBIR MULTIPLES IMÁGENES A SUPABASE STORAGE
        if (archivos.length > 0) {
            for (let i = 0; i < archivos.length; i++) {
                const archivo = archivos[i];
                const extension = archivo.name.split('.').pop();
                const nombreUnico = `prod_${Date.now()}_${i}.${extension}`;

                // Subir archivo
                const { data: uploadData, error: uploadError } = await supabaseClient
                    .storage
                    .from('imagenes')
                    .upload(nombreUnico, archivo);

                if (uploadError) throw new Error(`Error subiendo la imagen ${i+1}: ` + uploadError.message);

                // Obtener URL
                const { data: publicUrlData } = supabaseClient
                    .storage
                    .from('imagenes')
                    .getPublicUrl(nombreUnico);

                urlsImagenesSubidas.push(publicUrlData.publicUrl);
            }
        }

        // 2. OBTENER MATERIALES Y COLORES SELECCIONADOS (Checkboxes)
        const materialesSeleccionados = Array.from(document.querySelectorAll('input[name="material"]:checked')).map(cb => cb.value);
        const coloresSeleccionados = Array.from(document.querySelectorAll('input[name="color"]:checked')).map(cb => cb.value);

        if(materialesSeleccionados.length === 0) throw new Error("Debes seleccionar al menos un material.");
        if(coloresSeleccionados.length === 0) throw new Error("Debes seleccionar al menos un color.");

        // 3. RECOPILAR LOS DEMÁS DATOS
        const nuevoProducto = {
            titulo: document.getElementById('titulo').value,
            descripcion: document.getElementById('descripcion').value,
            categoria: document.getElementById('categoria').value,
            precio: parseInt(document.getElementById('precio').value),
            stock: parseInt(document.getElementById('stock').value),
            altura: parseFloat(document.getElementById('altura').value) || null,
            peso: parseFloat(document.getElementById('peso').value) || null,
            material: materialesSeleccionados, // Se guarda el arreglo
            color: coloresSeleccionados,       // Se guarda el arreglo
            personalizable: document.getElementById('personalizable').checked,
            imagenes: urlsImagenesSubidas,     // Se guarda el arreglo de URLs
            disponible: true
        };

        // 4. GUARDAR EN LA TABLA
        const { error: dbError } = await supabaseClient
            .from('productos')
            .insert([nuevoProducto]);

        if (dbError) throw new Error('Error al guardar datos: ' + dbError.message);

        // ÉXITO
        mensajeEstado.style.color = '#27ae60'; // Verde
        mensajeEstado.innerHTML = '<i class="fas fa-check-circle"></i> ¡Producto publicado con éxito!';
        formulario.reset(); 
        previewContainer.innerHTML = '';
        fileCountText.textContent = "Ningún archivo seleccionado";
        cargarBannersAdmin();

    } catch (error) {
        console.error(error);
        mensajeEstado.style.color = 'var(--danger)';
        mensajeEstado.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar en el Catálogo';
    }
});

// === GESTOR DE BANNERS ===
const formBanner = document.getElementById('form-banner');
const inputImagenBanner = document.getElementById('banner-imagen');
const textBannerFile = document.getElementById('banner-file-text');
const btnSubmitBanner = document.getElementById('btn-submit-banner');
const msjBanner = document.getElementById('mensaje-banner');

if(inputImagenBanner) {
    inputImagenBanner.addEventListener('change', function() {
        textBannerFile.textContent = this.files.length > 0 ? this.files[0].name : "Ningún archivo seleccionado";
    });
}

if(formBanner) {
    formBanner.addEventListener('submit', async (e) => {
        e.preventDefault();
        btnSubmitBanner.disabled = true;
        btnSubmitBanner.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Subiendo Banner...';
        msjBanner.textContent = '';

        try {
            const archivo = inputImagenBanner.files[0];
            if (!archivo) throw new Error("Debes seleccionar una imagen.");

            const extension = archivo.name.split('.').pop();
            const nombreUnico = `banner_${Date.now()}.${extension}`;

            // Subir imagen a storage
            const { error: uploadError } = await supabaseClient.storage.from('imagenes').upload(nombreUnico, archivo);
            if (uploadError) throw new Error('Error al subir imagen: ' + uploadError.message);

            // Obtener URL
            const { data: publicUrlData } = supabaseClient.storage.from('imagenes').getPublicUrl(nombreUnico);
            const imageUrl = publicUrlData.publicUrl;

            // Calcular fecha de expiración
            const diasActivo = document.getElementById('banner-dias').value;
            let fechaExpiracion = null;
            if(diasActivo && diasActivo > 0) {
                const date = new Date();
                date.setDate(date.getDate() + parseInt(diasActivo));
                fechaExpiracion = date.toISOString();
            }

            const nuevoBanner = {
                titulo: document.getElementById('banner-titulo').value,
                descripcion: document.getElementById('banner-desc').value,
                etiqueta: document.getElementById('banner-tag').value,
                imagen_url: imageUrl,
                activo: true,
                fecha_expiracion: fechaExpiracion
            };

            // Guardar en tabla
            const { error: dbError } = await supabaseClient.from('banners').insert([nuevoBanner]);
            if (dbError) throw new Error('Error en BD: ' + dbError.message);

            msjBanner.style.color = '#27ae60';
            msjBanner.innerHTML = '<i class="fas fa-check-circle"></i> ¡Cartel publicado con éxito!';
            formBanner.reset();
            textBannerFile.textContent = "Ningún archivo seleccionado";

        } catch (error) {
            console.error(error);
            msjBanner.style.color = 'var(--danger)';
            msjBanner.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
        } finally {
            btnSubmitBanner.disabled = false;
            btnSubmitBanner.innerHTML = '<i class="fas fa-upload"></i> Publicar Cartel';
        }
    });
}

// === CARGAR Y ELIMINAR BANNERS EN EL PANEL ===
async function cargarBannersAdmin() {
    const contenedor = document.getElementById('lista-banners-admin');
    if(!contenedor) return;

    try {
        const { data, error } = await supabaseClient.from('banners').select('*').order('fecha_creacion', { ascending: false });
        if (error) throw error;

        contenedor.innerHTML = '';
        if(data.length === 0) {
            contenedor.innerHTML = '<p style="text-align: center; color: var(--text-light);">No tienes banners extra subidos.</p>';
            return;
        }

        data.forEach(banner => {
            // Mostrar fecha si expira
            const fechaTxt = banner.fecha_expiracion 
                ? `Expira: ${new Date(banner.fecha_expiracion).toLocaleDateString()}` 
                : 'No expira (Fijo)';

            contenedor.innerHTML += `
                <div style="display: flex; align-items: center; justify-content: space-between; background: #f8fafc; padding: 15px; border-radius: 8px; border: 1px solid #e2e8f0; flex-wrap: wrap; gap: 10px;">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${banner.imagen_url}" style="width: 80px; height: 50px; object-fit: cover; border-radius: 4px; box-shadow: var(--shadow-sm);">
                        <div>
                            <strong style="display: block; color: var(--text-dark); font-size: 0.95rem;">${banner.titulo}</strong>
                            <span style="font-size: 0.8rem; color: var(--text-light);"><i class="far fa-clock"></i> ${fechaTxt}</span>
                        </div>
                    </div>
                    <button onclick="eliminarBanner('${banner.id}')" style="background: var(--danger); color: white; border: none; padding: 8px 15px; border-radius: 6px; cursor: pointer; font-size: 0.85rem; font-weight: 600;">
                        <i class="fas fa-trash"></i> Quitar
                    </button>
                </div>
            `;
        });
    } catch (err) {
        console.error("Error al cargar banners admin:", err);
    }
}

// Función expuesta globalmente para el botón
window.eliminarBanner = async function(id) {
    if(confirm('¿Estás seguro de que deseas eliminar este Banner?')) {
        try {
            const { error } = await supabaseClient.from('banners').delete().eq('id', id);
            if (error) throw error;
            alert('Banner eliminado correctamente.');
            cargarBannersAdmin(); // Actualizamos la lista instantáneamente
        } catch(err) {
            alert('Error al eliminar banner: ' + err.message);
        }
    }
};

// Cargar la lista al entrar a la página
cargarBannersAdmin();

// === CARGAR, EDITAR Y ELIMINAR PRODUCTOS (ADMIN) ===
async function cargarProductosAdmin() {
    const contenedor = document.getElementById('lista-productos-admin');
    if(!contenedor) return;

    try {
        const { data, error } = await supabaseClient.from('productos').select('*').order('fecha_creacion', { ascending: false });
        if (error) throw error;

        contenedor.innerHTML = '';
        if(data.length === 0) {
            contenedor.innerHTML = '<p style="text-align: center; color: var(--text-light);">No hay productos registrados.</p>';
            return;
        }

        data.forEach(prod => {
            const img = (prod.imagenes && prod.imagenes.length > 0) ? prod.imagenes[0] : 'https://via.placeholder.com/60';
            let esOfertaValida = prod.precio_oferta && (!prod.fecha_fin_oferta || new Date(prod.fecha_fin_oferta) > new Date());
            
            let infoOferta = '';
            if (esOfertaValida) infoOferta = `<span style="color:var(--danger); font-weight:800; font-size: 0.85rem;"><i class="fas fa-fire"></i> Oferta: $${prod.precio_oferta.toLocaleString('es-CL')}</span>`;
            
            contenedor.innerHTML += `
                <div class="product-admin-card">
                    <div style="display: flex; align-items: center; gap: 15px;">
                        <img src="${img}" style="width: 60px; height: 60px; object-fit: cover; border-radius: 8px;">
                        <div>
                            <strong style="display: block; color: var(--text-dark);">${prod.titulo}</strong>
                            <span style="font-size: 0.85rem; color: var(--text-light);">Normal: $${prod.precio.toLocaleString('es-CL')} | Stock: ${prod.stock}</span><br>
                            ${infoOferta} ${prod.etiqueta_destacada ? `<span style="background:var(--secondary-brand); color:white; font-size:0.7rem; padding:3px 8px; border-radius:4px;">${prod.etiqueta_destacada}</span>` : ''}
                        </div>
                    </div>
                    <div style="display: flex; gap: 10px;">
                        <button onclick="abrirModalEditar('${prod.id}')" style="background: #3b82f6; color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-edit"></i>
                        </button>
                        <button onclick="eliminarProducto('${prod.id}')" style="background: var(--danger); color: white; border: none; padding: 10px 15px; border-radius: 8px; cursor: pointer; font-weight: 600;">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            `;
        });
    } catch (err) { console.error("Error cargando productos:", err); }
}

window.eliminarProducto = async function(id) {
    if(confirm('¿Seguro que deseas eliminar este producto de la tienda de forma permanente?')) {
        await supabaseClient.from('productos').delete().eq('id', id);
        cargarProductosAdmin();
    }
};

window.abrirModalEditar = async function(id) {
    const { data } = await supabaseClient.from('productos').select('*').eq('id', id).single();
    if(data) {
        document.getElementById('edit-id').value = data.id;
        document.getElementById('edit-titulo').value = data.titulo;
        document.getElementById('edit-precio').value = data.precio;
        document.getElementById('edit-stock').value = data.stock;
        document.getElementById('edit-precio-oferta').value = data.precio_oferta || '';
        document.getElementById('edit-etiqueta').value = data.etiqueta_destacada || '';
        document.getElementById('edit-dias-oferta').value = ''; // Se limpia para que pongas días nuevos si quieres
        
        document.getElementById('modal-editar-producto').classList.add('active');
    }
}
window.cerrarModalEditar = function() { document.getElementById('modal-editar-producto').classList.remove('active'); }

document.getElementById('form-editar-producto')?.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('edit-id').value;
    const precioOferta = document.getElementById('edit-precio-oferta').value;
    
    const updates = {
        titulo: document.getElementById('edit-titulo').value,
        precio: parseInt(document.getElementById('edit-precio').value),
        stock: parseInt(document.getElementById('edit-stock').value),
        precio_oferta: precioOferta ? parseInt(precioOferta) : null,
        etiqueta_destacada: document.getElementById('edit-etiqueta').value || null
    };

    // Calcular fecha final si hay días de oferta
    const diasOferta = document.getElementById('edit-dias-oferta').value;
    if(diasOferta && diasOferta > 0) {
        const date = new Date();
        date.setDate(date.getDate() + parseInt(diasOferta));
        updates.fecha_fin_oferta = date.toISOString();
    } else if (!precioOferta) {
        updates.fecha_fin_oferta = null; // Quitar la fecha si se quita la oferta
    }

    try {
        await supabaseClient.from('productos').update(updates).eq('id', id);
        cerrarModalEditar();
        cargarProductosAdmin();
        alert('✅ ¡Producto actualizado con éxito!');
    } catch(err) { alert('Error: ' + err.message); }
});

// Inicializar lista
cargarProductosAdmin();