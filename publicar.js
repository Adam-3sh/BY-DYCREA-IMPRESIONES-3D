// Usamos tus credenciales exactas
const supabaseUrl = 'https://xlsrviwsygmzalbcuqyf.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inhsc3J2aXdzeWdtemFsYmN1cXlmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE1MDkxMjUsImV4cCI6MjA4NzA4NTEyNX0.maNasYLRxMr4lPuTrSs8tLtXYPfhcw3FXpI1vH-PAz4'; 

const supabaseClient = window.supabase.createClient(supabaseUrl, supabaseKey);

const formulario = document.getElementById('form-publicar');
const btnSubmit = document.getElementById('btn-submit');
const mensajeEstado = document.getElementById('mensaje-estado');

formulario.addEventListener('submit', async (e) => {
    e.preventDefault(); // Evita que la página se recargue

    // Cambiar estado del botón mientras carga
    btnSubmit.disabled = true;
    btnSubmit.textContent = 'Subiendo producto... (Por favor espera)';
    mensajeEstado.textContent = '';
    mensajeEstado.style.color = 'black';

    try {
        // 1. OBTENER EL ARCHIVO DE IMAGEN
        const archivoInput = document.getElementById('imagen');
        const archivo = archivoInput.files[0];
        
        let imageUrl = '';

        if (archivo) {
            // Creamos un nombre único para la imagen para que no se sobreescriban
            const extension = archivo.name.split('.').pop();
            const nombreUnico = `producto_${Date.now()}.${extension}`;

            // SUBIR LA IMAGEN AL BUCKET 'imagenes'
            const { data: uploadData, error: uploadError } = await supabaseClient
                .storage
                .from('imagenes')
                .upload(nombreUnico, archivo);

            if (uploadError) throw new Error('Error al subir la imagen: ' + uploadError.message);

            // OBTENER LA URL PÚBLICA DE LA IMAGEN
            const { data: publicUrlData } = supabaseClient
                .storage
                .from('imagenes')
                .getPublicUrl(nombreUnico);

            imageUrl = publicUrlData.publicUrl;
        }

        // 2. RECOPILAR LOS DEMÁS DATOS DEL FORMULARIO
        // Transformamos los textos separados por comas en Arreglos (Arrays)
        const materialesStr = document.getElementById('material').value;
        const arrayMateriales = materialesStr ? materialesStr.split(',').map(item => item.trim()) : [];

        const coloresStr = document.getElementById('color').value;
        const arrayColores = coloresStr ? coloresStr.split(',').map(item => item.trim()) : [];

        const nuevoProducto = {
            titulo: document.getElementById('titulo').value,
            descripcion: document.getElementById('descripcion').value,
            categoria: document.getElementById('categoria').value,
            precio: parseInt(document.getElementById('precio').value),
            stock: parseInt(document.getElementById('stock').value),
            altura: parseFloat(document.getElementById('altura').value) || null,
            peso: parseFloat(document.getElementById('peso').value) || null,
            material: arrayMateriales,
            color: arrayColores,
            personalizable: document.getElementById('personalizable').checked,
            imagenes: imageUrl ? [imageUrl] : [], // Guardamos la URL de la imagen en el arreglo
            disponible: true
        };

        // 3. GUARDAR TODO EN LA BASE DE DATOS
        const { error: dbError } = await supabaseClient
            .from('productos')
            .insert([nuevoProducto]);

        if (dbError) throw new Error('Error al guardar datos: ' + dbError.message);

        // ÉXITO
        mensajeEstado.style.color = 'green';
        mensajeEstado.textContent = '¡Producto publicado con éxito!';
        formulario.reset(); // Limpiar el formulario

    } catch (error) {
        console.error(error);
        mensajeEstado.style.color = 'red';
        mensajeEstado.textContent = error.message;
    } finally {
        // Restaurar el botón
        btnSubmit.disabled = false;
        btnSubmit.textContent = 'Publicar Producto';
    }
});