// ==== Variables globales ====
const divResultado = document.querySelector('#results'); // Contenedor de resultados
const boton = document.querySelector('#searchButton'); // Botón para ejecutar la búsqueda
const template = document.querySelector('#template-pelicula'); // Template para clonar tarjetas
const btnSiguiente = document.querySelector('#siguiente'); // Botón de página siguiente
const btnAnterior = document.querySelector('#anterior'); // Botón de página anterior
const fragment = document.createDocumentFragment(); // Fragmento para evitar reflow en el DOM
const paginacion = document.querySelector('.paginacion'); // Contenedor de paginación
const nPagina = document.querySelector('.nPagina'); // Span con el número de la página actual
const totPaginas = document.querySelector('.totPaginas'); // Span con el total de páginas
const favoritos = JSON.parse(localStorage.getItem("favoritos")) || []; // Lista de favoritos persistida en localStorage
const apiKey = '25e56aa5'; // Clave de acceso a la API OMDb

let pagina; // Página actual de resultados
let timeoutMensaje; // ID del timeout para mensajes temporales

// ==== EVENTOS PRINCIPALES ====

// Evento al hacer clic en "Buscar"
boton.addEventListener('click', async () => {
    pagina = 1;
    
    const nombrePelicula = document.querySelector('#searchInput').value.trim();
    const tipo = document.querySelector('#tipo').value;

    // Validación: campos vacíos
    if (nombrePelicula === '' || tipo === '') {
        paginacion.classList.add("oculto");
        mostrarMensaje('Campos obligatorios vacíos 😡', 'error', true);
        return;
    }

    mostrarMensaje('Buscando películas... 👀', 'info');
    consumirApi(nombrePelicula, tipo, pagina);
});

// Evento al hacer clic en "Siguiente"
btnSiguiente.addEventListener('click', async () => {
    const nombrePelicula = document.querySelector('#searchInput').value.trim();
    const tipo = document.querySelector('#tipo').value;
    pagina += 1;
    
    consumirApi(nombrePelicula, tipo, pagina);
});

// Evento al hacer clic en "Anterior"
btnAnterior.addEventListener('click', async () => {
    const nombrePelicula = document.querySelector('#searchInput').value.trim();
    const tipo = document.querySelector('#tipo').value;
    pagina -= 1;

    consumirApi(nombrePelicula, tipo, pagina);
});

// Evento para marcar una película como favorita
divResultado.addEventListener('click', (e) => {
    if (e.target.classList.contains('btn-fav')) {
        const id = e.target.dataset.id; //obtenemos el id de la pelicula con dataset
        const existeID = favoritos.some(fav => fav.id === id);//validamos si ya existe una pelicula con ese id

        //Si no existe
        if (!existeID) {
            const favorito = {
                id,
                title: e.target.dataset.title,
                year: e.target.dataset.year,
                poster: e.target.dataset.poster
            };
            e.target.textContent = "✅ En favoritos";
            e.target.disabled = true;
            favoritos.push(favorito);
            localStorage.setItem("favoritos", JSON.stringify(favoritos));
        }
    }
});

// ==== FUNCIONES ====

// Función que hace la petición a la API OMDb
const consumirApi = async (nombrePelicula, tipo, pagina) => {
    try {
        const respuesta = await fetch(`https://www.omdbapi.com/?apikey=${apiKey}&s=${nombrePelicula}&type=${tipo}&page=${pagina}`);
        const datos = await respuesta.json();

        if (datos.Response !== 'True') {
            mostrarMensaje('No se encontraron resultados 😓', 'error', true);
            paginacion.classList.add("oculto");
            return;//Finalizamos
        }
        limpiarMensaje();//Limpiamos los mensajes para que no se acumulen
        renderizarPeliculas(datos);
    } catch (error) {
        console.log(error);
    }
};

// Función que renderiza las películas en el DOM
const renderizarPeliculas = (datos) => {
    const totalPaginas = Math.ceil(datos.totalResults / 10);//Calculamos el total de paginas
    
    valPaginador(pagina,totalPaginas)
    
    divResultado.textContent = '';
    nPagina.textContent = pagina;
    totPaginas.textContent = totalPaginas;

    if (datos.Response === 'True') {
        datos.Search.forEach(dato => {
            const { imdbID, Title, Year, Poster } = dato;//accedemos a todos los datos con destructuring
            const clone = template.content.cloneNode(true);

            clone.querySelector('.titulo').textContent = Title;
            clone.querySelector('.anio').textContent = Year;

            const btnFav = clone.querySelector('.btn-fav');
            btnFav.dataset.id = imdbID;
            btnFav.dataset.title = Title;
            btnFav.dataset.year = Year;
            btnFav.dataset.poster = Poster;
            //Comportamiento del boton añadir a favoritos
            btnFav.textContent = favoritos.some(favorito => favorito.id === imdbID) ? "✅ En favoritos" : "⭐ Agregar a favoritos";
            btnFav.disabled = favoritos.some(favorito => favorito.id === imdbID);

            const img = clone.querySelector('.poster');
            img.src = Poster !== "N/A" ? Poster : "imgs/no-image.png";
            img.alt = Title;
            img.onerror = () => img.src = "imgs/no-image.png"; //En caso de que no cargue la imagen

            fragment.appendChild(clone);
        });

        divResultado.appendChild(fragment);
        paginacion.classList.remove("oculto");
    } else {
        mostrarMensaje('No se encontraron resultados 😓', 'error', true);
        paginacion.classList.add("oculto");
    }
};

//Funcion encargada de habilitar o deshabilitar los botones Anterior y Siguiente
const valPaginador=(pagina, totalPaginas)=>{
    btnSiguiente.disabled = pagina === totalPaginas; //Si estamos en la ultima pagina o en la primer pagina y solo existe una pagina deshabilitamos el boton
    btnAnterior.disabled= pagina===1
}

// Muestra un mensaje temporal en pantalla dentro del div con id "mensaje"
// Recibe:
// - texto: el contenido que se quiere mostrar
// - tipo: el estilo visual del mensaje ("info", "error", "ok")
// - limpiarResultados: si es true, borra el contenido del divResultado antes de mostrar el mensaje
const mostrarMensaje = (texto, tipo = "info", limpiarResultados = false) => {
    // Si se indica, limpiamos los resultados antes de mostrar el mensaje
    if (limpiarResultados) {
        divResultado.textContent = '';
    }

    const mensajeDiv = document.querySelector('#mensaje'); // Capturamos el contenedor del mensaje

    // Cancelamos cualquier timeout anterior para evitar superposición de mensajes
    clearTimeout(timeoutMensaje);

    // Mostramos el nuevo mensaje con la clase correspondiente
    mensajeDiv.textContent = texto;
    mensajeDiv.className = ''; // Limpiamos clases anteriores
    mensajeDiv.classList.add('mensaje', tipo); // Aplicamos clase "mensaje" + tipo

    // Guardamos el ID del timeout para poder cancelarlo más adelante si es necesario
    timeoutMensaje = setTimeout(() => {
        limpiarMensaje();
    }, 3000); // El mensaje se elimina automáticamente después de 3 segundos
};

// Elimina el contenido y clases del mensaje en pantalla
// También cancela el timeout para evitar posibles conflictos si ya fue limpiado manualmente
const limpiarMensaje = () => {
    const mensajeDiv = document.querySelector('#mensaje');

    // Limpiamos el texto y clases del contenedor del mensaje
    mensajeDiv.textContent = '';
    mensajeDiv.className = '';

    // Cancelamos cualquier temporizador activo (por seguridad)
    clearTimeout(timeoutMensaje);
};