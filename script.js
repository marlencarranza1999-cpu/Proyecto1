let candidatos = [];

 //se encarga del historial de quien voto y a que hora lo hizo //
let historial = JSON.parse(localStorage.getItem('historial_db')) || [];

 // Carga los candidatos desde archivo o almacenamiento //
async function cargarCandidatos() {
    const res = await fetch('candidatos.json');
    const data = await res.json();
 // Si ya hay datos guardados, los usa; si no, usa el JSON
    const guardados = JSON.parse(localStorage.getItem('votos_db'));
    candidatos = guardados || data;
 // Guarda en localStorage //
    localStorage.setItem('votos_db', JSON.stringify(candidatos));
}

async function init() {
    await cargarCandidatos();

    const sesion = JSON.parse(localStorage.getItem('sesion_activa'));

    if (!sesion) {
        window.location.href = 'login.html';
        return;
    }

    document.getElementById('nombre-usuario').innerText = sesion.nombre;

    if (sesion.rol === 'admin') {
        document.getElementById('admin-section').style.display = 'block';
    }

    renderCandidatos();
    actualizarPanelAdmin();
}
// Muestra a los candidatos en pantalla //
function renderCandidatos() {
    const container = document.getElementById('grid-candidatos');
    const sesion = JSON.parse(localStorage.getItem('sesion_activa'));

    const yaVoto = historial.some(h => h.nombre === sesion.nombre);

    container.innerHTML = candidatos.map(c => `
        <div class="card-cand">
            <img src="${c.img}" onerror="this.src='https://via.placeholder.com/300x200'">
            <div class="cand-info">
                <h3>${c.nombre}</h3>
                <p>${c.partido}</p>
                ${
                    yaVoto
                    ? `<button class="btn" disabled style="background:#cbd5e1; color:#64748b">Ya votaste</button>`
                    : `<button onclick="votar(${c.id})" class="btn btn-primary">Votar</button>`
                }
            </div>
        </div>
    `).join('');
}

function votar(id) {
    const sesion = JSON.parse(localStorage.getItem('sesion_activa'));
    let votosUsuarios = JSON.parse(localStorage.getItem('votos_usuarios')) || {};

     // Evita que se vote dos veces //
    if (votosUsuarios[sesion.nombre]) {
        alert("Ya votaste");
        return;
    }
// Busca el candidato//
    const candidato = candidatos.find(c => c.id === id);

    if (candidato) {
        candidato.votos++;
        votosUsuarios[sesion.nombre] = true;

        historial.push({
            nombre: sesion.nombre,
            fecha: new Date().toLocaleString()
        });

        localStorage.setItem('votos_db', JSON.stringify(candidatos));
        localStorage.setItem('historial_db', JSON.stringify(historial));
        localStorage.setItem('votos_usuarios', JSON.stringify(votosUsuarios));

        alert("Voto registrado");
        renderCandidatos();
        actualizarPanelAdmin();
    }
}

function actualizarPanelAdmin() {
    const total = candidatos.reduce((acc, c) => acc + c.votos, 0);
    document.getElementById('total-votos').innerText = total;

    const barras = document.getElementById('barras-container');
    barras.innerHTML = candidatos.map(c => {
        const porcentaje = total === 0 ? 0 : Math.round((c.votos / total) * 100);

        return `
            <div>
                ${c.nombre} (${porcentaje}%)
                <div style="background:#ddd; height:10px; border-radius:5px;">
                    <div style="width:${porcentaje}%; background:${c.color}; height:100%; border-radius:5px;"></div>
                </div>
            </div>
        `;
    }).join('');

    const tabla = document.getElementById('tabla-body');
    tabla.innerHTML = historial.map(h => `
        <tr>
            <td>${h.nombre}</td>
            <td>${h.fecha}</td>
        </tr>
    `).join('');
}

function cerrarSesion() {
    localStorage.removeItem('sesion_activa');
    window.location.href = 'login.html';
}

function resetDatos() {
    if(confirm("¿Seguro que quieres borrar todos los votos, usuarios e historial?")) {
        //Borramos todo
        localStorage.clear();
        
        //Se crea un admin llamado (El "Resucitador") para que entre en funcion de nuevo //
        const adminDefault = [{
            nombre: 'admin', 
            pass: '1234', 
            rol: 'admin'
        }];
        
        //Lo guardamos de nuevo en la base de datos limpia //
        localStorage.setItem('usuarios_db', JSON.stringify(adminDefault));
    
        alert("Sistema reseteado. Solo el usuario 'admin' está activo.");
        
        //Refrescamos//
        location.reload();
    }
}

document.addEventListener('DOMContentLoaded', init);