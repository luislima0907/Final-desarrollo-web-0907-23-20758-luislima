import { StrictMode, useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import "./estilos.css";

const DIRECCION_SERVIDOR = "http://localhost:3000/api";

async function pedir(ruta, opciones = {}) {
  const respuesta = await fetch(`${DIRECCION_SERVIDOR}${ruta}`, {
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...opciones.headers
    },
    ...opciones
  });

  const contenido = await respuesta.json().catch(() => ({}));
  if (!respuesta.ok) {
    if (respuesta.status === 401) {
      window.dispatchEvent(new Event("sesion-expirada"));
    }
    const error = new Error(contenido.error || "No se pudo completar la solicitud");
    error.estado = respuesta.status;
    throw error;
  }
  return contenido;
}

function InicioSesion({ alIniciarSesion }) {
  const [correo, setCorreo] = useState("");
  const [contrasena, setContrasena] = useState("");
  const [error, setError] = useState("");
  const [cargando, setCargando] = useState(false);

  async function enviarFormulario(evento) {
    evento.preventDefault();
    setError("");
    setCargando(true);
    try {
      const usuario = await pedir("/inicio-sesion", {
        method: "POST",
        body: JSON.stringify({ correo, contrasena })
      });
      alIniciarSesion(usuario);
    } catch (errorInicio) {
      setError(errorInicio.message);
    } finally {
      setCargando(false);
    }
  }

  return (
    <main className="contenedor-login">
      <section className="tarjeta">
        <h1>Reservas de biblioteca</h1>
        <p>Inicia sesión para reservar una sala.</p>
        <form onSubmit={enviarFormulario}>
          <label>
            Correo
            <input
              type="email"
              value={correo}
              onChange={(evento) => setCorreo(evento.target.value)}
              required
            />
          </label>
          <label>
            Contraseña
            <input
              type="password"
              value={contrasena}
              onChange={(evento) => setContrasena(evento.target.value)}
              required
            />
          </label>
          {error && <p className="mensaje error">{error}</p>}
          <button type="submit" disabled={cargando}>
            {cargando ? "Ingresando..." : "Iniciar sesión"}
          </button>
        </form>
        <p className="ayuda">Usuario de prueba: demo@biblioteca.com / 123456</p>
      </section>
    </main>
  );
}

function Panel({ usuario, cerrarSesion }) {
  const [salas, setSalas] = useState([]);
  const [reservas, setReservas] = useState([]);
  const [formulario, setFormulario] = useState({
    salaId: "",
    fecha: "",
    horaInicio: "",
    horaFin: ""
  });
  const [mensaje, setMensaje] = useState("");
  const [error, setError] = useState("");

  async function cargarDatos() {
    const [salasCargadas, reservasCargadas] = await Promise.all([
      pedir("/salas"),
      pedir("/reservas")
    ]);
    setSalas(salasCargadas);
    setReservas(reservasCargadas);
    setFormulario((anterior) => ({
      ...anterior,
      salaId: anterior.salaId || String(salasCargadas[0]?.id || "")
    }));
  }

  useEffect(() => {
    cargarDatos().catch((errorCarga) => {
      if (errorCarga.estado !== 401) {
        setError(errorCarga.message);
      }
    });
  }, []);

  function cambiarCampo(evento) {
    setFormulario({
      ...formulario,
      [evento.target.name]: evento.target.value
    });
  }

  async function crearReserva(evento) {
    evento.preventDefault();
    setMensaje("");
    setError("");
    try {
      await pedir("/reservas", {
        method: "POST",
        body: JSON.stringify({
          ...formulario,
          salaId: Number(formulario.salaId)
        })
      });
      setMensaje("Reserva creada correctamente");
      setFormulario({
        salaId: String(salas[0]?.id || ""),
        fecha: "",
        horaInicio: "",
        horaFin: ""
      });
      await cargarDatos();
    } catch (errorReserva) {
      setError(errorReserva.message);
    }
  }

  return (
    <main className="contenedor">
      <header className="encabezado">
        <div>
          <h1>Reservas de biblioteca</h1>
          <p>Bienvenido, {usuario.nombre}</p>
        </div>
        <button className="boton-secundario" onClick={cerrarSesion}>
          Cerrar sesión
        </button>
      </header>

      <section className="tarjeta">
        <h2>Crear una reserva</h2>
        <form className="formulario-reserva" onSubmit={crearReserva}>
          <label>
            Sala
            <select name="salaId" value={formulario.salaId} onChange={cambiarCampo} required>
              <option value="">Selecciona una sala</option>
              {salas.map((sala) => (
                <option key={sala.id} value={sala.id}>{sala.nombre}</option>
              ))}
            </select>
          </label>
          <label>
            Fecha
            <input type="date" name="fecha" value={formulario.fecha} onChange={cambiarCampo} required />
          </label>
          <label>
            Hora de inicio
            <input type="time" name="horaInicio" value={formulario.horaInicio} onChange={cambiarCampo} required />
          </label>
          <label>
            Hora de fin
            <input type="time" name="horaFin" value={formulario.horaFin} onChange={cambiarCampo} required />
          </label>
          <button type="submit">Guardar reserva</button>
        </form>
        {mensaje && <p className="mensaje correcto">{mensaje}</p>}
        {error && <p className="mensaje error">{error}</p>}
      </section>

      <section className="tarjeta">
        <h2>Reservas existentes</h2>
        {reservas.length === 0 ? (
          <p>No hay reservas registradas.</p>
        ) : (
          <div className="tabla-contenedor">
            <table>
              <thead>
                <tr>
                  <th>Sala</th>
                  <th>Fecha</th>
                  <th>Horario</th>
                  <th>Usuario</th>
                </tr>
              </thead>
              <tbody>
                {reservas.map((reserva) => (
                  <tr key={reserva.id}>
                    <td>{reserva.Sala?.nombre}</td>
                    <td>{reserva.fecha}</td>
                    <td>{reserva.horaInicio} - {reserva.horaFin}</td>
                    <td>{reserva.Usuario?.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}

function Aplicacion() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    function volverAlInicio() {
      setUsuario(null);
    }

    window.addEventListener("sesion-expirada", volverAlInicio);
    pedir("/usuario-actual")
      .then(setUsuario)
      .catch(() => setUsuario(null));

    return () => window.removeEventListener("sesion-expirada", volverAlInicio);
  }, []);

  async function cerrarSesion() {
    await pedir("/cerrar-sesion", { method: "POST" });
    setUsuario(null);
  }

  return usuario ? (
    <Panel usuario={usuario} cerrarSesion={cerrarSesion} />
  ) : (
    <InicioSesion alIniciarSesion={setUsuario} />
  );
}

createRoot(document.getElementById("raiz")).render(
  <StrictMode>
    <Aplicacion />
  </StrictMode>
);
