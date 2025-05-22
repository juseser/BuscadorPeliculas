// ==== Variables globales ====
const contenedorFavoritos = document.querySelector('#favoritos'); // Contenedor donde se muestran los favoritos
let favoritos = [];
let timeoutMensaje;

document.addEventListener('DOMContentLoaded', () => {
    // Obtenemos los favoritos desde localStorage
    favoritos = JSON.parse(localStorage.getItem("favoritos")) || [];

    const buscador = document.querySelector('#buscadorFavoritos'); // Input de búsqueda por título

    // Renderizamos la lista completa al cargar la página
    renderizarFavoritos(favoritos);

    // Evento: eliminar favorito
    contenedorFavoritos.addEventListener('click', (e) => {
        if (e.target.classList.contains('btn-remove')) {
            const id = e.target.dataset.id;

            // Eliminamos el favorito por id
            favoritos = favoritos.filter(favorito => favorito.id !== id);
            localStorage.setItem("favoritos", JSON.stringify(favoritos));

            // Si la página actual quedó vacía, retrocede una página
            const totalPaginas = Math.ceil(favoritos.length / elementosPorPagina);
            if (paginaActual > totalPaginas) {
                paginaActual = totalPaginas;
            }
            paginaActual = Math.max(paginaActual, 1); // nunca menor a 1

            renderizarFavoritos(favoritos, paginaActual);
        }
    });

    // Evento: buscar por título
    buscador.addEventListener('keyup', () => {
        const texto = buscador.value.toLowerCase();

        if (texto === '') {
            renderizarFavoritos(favoritos); // Restablecemos todos los favoritos si el input está vacío
            return;
        }

        // Filtramos por coincidencia de texto
        const favFiltrados = favoritos.filter(favorito =>
            favorito.title.toLowerCase().includes(texto)
        );

        // Si hay resultados, renderizamos; si no, mostramos mensaje
        favFiltrados.length > 0
            ? renderizarFavoritos(favFiltrados)
            : mostrarMensaje('No hay favoritos con este título 🤏', 'info');
    });
});

const elementosPorPagina = 6; // Número de elementos que se mostrarán por página
let paginaActual = 1; // Página actual (empieza en 1)

// Renderiza los elementos favoritos paginados
const renderizarFavoritos = (favoritos, pagina = 1) => {
    const template = document.querySelector('#template-favorito');
    const fragment = document.createDocumentFragment();
    contenedorFavoritos.textContent = '';

    // Si no hay favoritos, mostramos mensaje y limpiamos paginador
    if (favoritos.length === 0) {
        mostrarMensaje('No hay películas favoritas guardadas 😢', 'info', false);
        borrarPaginador();
        return;
    }

    // Calculamos el rango de elementos a mostrar en esta página
    const inicio = (pagina - 1) * elementosPorPagina;
    const fin = inicio + elementosPorPagina;

    // Obtenemos el bloque de favoritos correspondiente a la página actual
    const favPagina = favoritos.slice(inicio, fin);

    // Ordenamos alfabéticamente por título
    favPagina.sort((a, b) => a.title.localeCompare(b.title));

    // Clonamos y rellenamos el template por cada favorito
    favPagina.forEach((dato) => {
        const { id, title, year, poster } = dato;
        const clone = template.content.cloneNode(true);

        clone.querySelector('.titulo').textContent = title;
        clone.querySelector('.anio').textContent = year;

        const btnEliminarFav = clone.querySelector('.btn-remove');
        btnEliminarFav.dataset.id = id;

        const img = clone.querySelector(".poster");
        img.src = poster;
        img.alt = title;

        // Fallback por si la imagen falla (el url de la imagen guardado en el array favoritos que esta en el localstorage)
        img.onerror = () => {
            img.src = "../imgs/no-image.png";
        };

        fragment.appendChild(clone);
    });

    contenedorFavoritos.appendChild(fragment);

    // Renderizamos la paginación
    renderizarPaginacion(favoritos, pagina);
};

// Función para renderizar los botones de paginación
const renderizarPaginacion = (favoritos, paginaAct) => {
    const contenedor = document.querySelector("#pagination-container");
    contenedor.innerHTML = ""; // Limpiamos el paginador actual

    // Calculamos el número total de páginas
    const totalPaginas = Math.ceil(favoritos.length / elementosPorPagina);

    // Creamos un botón por cada página
    for (let i = 1; i <= totalPaginas; i++) {
        const boton = document.createElement("button");
        boton.innerText = i;

        // Marcamos la página actual como activa
        if (i === paginaAct) {
            boton.classList.add("activo");
        }

        // Cambiamos de página al hacer clic
        boton.addEventListener("click", () => {
            paginaActual = i;
            renderizarFavoritos(favoritos, paginaActual);
        });

        contenedor.appendChild(boton);
    }
};

// Borra los botones de paginación
const borrarPaginador = () => {
    const contenedor = document.querySelector("#pagination-container");
    contenedor.textContent = '';
};

// Muestra un mensaje (con opción a ser temporal)
const mostrarMensaje = (texto, tipo, temporal = true) => {
    const mensajeDiv = document.querySelector('#mensaje');
    clearTimeout(timeoutMensaje); // Limpiamos timeout anterior si había

    mensajeDiv.textContent = texto;
    mensajeDiv.className = '';
    mensajeDiv.classList.add('mensaje', tipo);

    // Si es temporal, desaparece en 3 segundos
    if (temporal) {
        timeoutMensaje = setTimeout(() => {
            limpiarMensaje();
        }, 3000);
    }
};

// Limpia el mensaje de la interfaz
const limpiarMensaje = () => {
    const mensajeDiv = document.querySelector('#mensaje');
    mensajeDiv.textContent = '';
    mensajeDiv.className = '';
    clearTimeout(timeoutMensaje);
};
