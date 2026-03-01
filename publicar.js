// === CONFIGURACIÓN DE SUPABASE ===
const supabaseUrl = 'https://xlsrviwsygmzalbcuqyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc3J2aXdzeWdtemFsYmN1cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDkxMjUsImV4cCI6MjA4NzA4NTEyNX0.maNasYLRxMr4lPuTrSs8tLtXYPfhcw3FXpI1vH-PAz4'; 

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

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

    } catch (error) {
        console.error(error);
        mensajeEstado.style.color = 'var(--danger)';
        mensajeEstado.innerHTML = `<i class="fas fa-exclamation-circle"></i> ${error.message}`;
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerHTML = '<i class="fas fa-paper-plane"></i> Publicar en el Catálogo';
    }
});