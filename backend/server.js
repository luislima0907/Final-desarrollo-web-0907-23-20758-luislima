const path = require("path");
const bcrypt = require("bcryptjs");
const express = require("express");
const cors = require("cors");
const session = require("express-session");
const { Sequelize, DataTypes, Op } = require("sequelize");

const app = express();
const puerto = process.env.PORT || 3000;
const baseDatos = new Sequelize({
  dialect: "sqlite",
  storage: path.join(__dirname, "database.sqlite"),
  logging: false
});

const Usuario = baseDatos.define("Usuario", {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  },
  correo: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true
  },
  contrasena: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: "usuarios",
  timestamps: false
});

const Sala = baseDatos.define("Sala", {
  nombre: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: "salas",
  timestamps: false
});

const Reserva = baseDatos.define("Reserva", {
  fecha: {
    type: DataTypes.DATEONLY,
    allowNull: false
  },
  horaInicio: {
    type: DataTypes.STRING,
    allowNull: false
  },
  horaFin: {
    type: DataTypes.STRING,
    allowNull: false
  }
}, {
  tableName: "reservas",
  timestamps: false
});

Usuario.hasMany(Reserva, { foreignKey: "usuarioId" });
Reserva.belongsTo(Usuario, { foreignKey: "usuarioId" });
Sala.hasMany(Reserva, { foreignKey: "salaId" });
Reserva.belongsTo(Sala, { foreignKey: "salaId" });

app.use(cors({
  origin: "http://localhost:5173",
  credentials: true
}));
app.use(express.json());
app.use(session({
  secret: process.env.SESSION_SECRET || "clave-local-biblioteca",
  resave: false,
  saveUninitialized: false,
  rolling: true,
  cookie: {
    maxAge: 30 * 60 * 1000,
    httpOnly: true,
    sameSite: "lax"
  }
}));

function comprobarSesion(req, res, next) {
  if (!req.session.usuarioId) {
    return res.status(401).json({ error: "Debes iniciar sesión" });
  }
  next();
}

function horaValida(value) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(value);
}

app.post("/api/inicio-sesion", async (req, res) => {
  try {
    const { correo, contrasena } = req.body;
    if (!correo || !contrasena) {
      return res.status(400).json({ error: "Correo y contraseña son obligatorios" });
    }

    const usuario = await Usuario.findOne({ where: { correo } });
    if (!usuario || !(await bcrypt.compare(contrasena, usuario.contrasena))) {
      return res.status(401).json({ error: "Datos de acceso incorrectos" });
    }

    req.session.usuarioId = usuario.id;
    res.json({ id: usuario.id, nombre: usuario.nombre, correo: usuario.correo });
  } catch (error) {
    res.status(500).json({ error: "No se pudo iniciar sesión" });
  }
});

app.post("/api/cerrar-sesion", (req, res) => {
  req.session.destroy((error) => {
    if (error) {
      return res.status(500).json({ error: "No se pudo cerrar sesión" });
    }
    res.clearCookie("connect.sid");
    res.json({ message: "Sesión cerrada" });
  });
});

app.get("/api/usuario-actual", comprobarSesion, async (req, res) => {
  const usuario = await Usuario.findByPk(req.session.usuarioId, {
    attributes: ["id", "nombre", "correo"]
  });
  if (!usuario) {
    return res.status(401).json({ error: "Sesión no válida" });
  }
  res.json(usuario);
});

app.get("/api/salas", comprobarSesion, async (req, res) => {
  const salas = await Sala.findAll({ order: [["id", "ASC"]] });
  res.json(salas);
});

app.get("/api/reservas", comprobarSesion, async (req, res) => {
  const reservas = await Reserva.findAll({
    include: [
      { model: Sala, attributes: ["id", "nombre"] },
      { model: Usuario, attributes: ["id", "nombre", "correo"] }
    ],
    order: [["fecha", "ASC"], ["horaInicio", "ASC"]]
  });
  res.json(reservas);
});

app.post("/api/reservas", comprobarSesion, async (req, res) => {
  try {
    const { salaId, fecha, horaInicio, horaFin } = req.body;
    if (!salaId || !fecha || !horaInicio || !horaFin) {
      return res.status(400).json({ error: "Todos los campos son obligatorios" });
    }
    if (!horaValida(horaInicio) || !horaValida(horaFin) || horaInicio >= horaFin) {
      return res.status(400).json({ error: "El horario no es válido" });
    }

    const sala = await Sala.findByPk(salaId);
    if (!sala) {
      return res.status(404).json({ error: "La sala no existe" });
    }

    const reservaSolapada = await Reserva.findOne({
      where: {
        salaId,
        fecha,
        [Op.and]: [
          { horaInicio: { [Op.lt]: horaFin } },
          { horaFin: { [Op.gt]: horaInicio } }
        ]
      }
    });
    if (reservaSolapada) {
      return res.status(409).json({ error: "La sala ya está reservada en ese horario" });
    }

    const reserva = await Reserva.create({
      salaId,
      usuarioId: req.session.usuarioId,
      fecha,
      horaInicio,
      horaFin
    });
    res.status(201).json(reserva);
  } catch (error) {
    res.status(500).json({ error: "No se pudo crear la reserva" });
  }
});

async function iniciarServidor() {
  await baseDatos.sync();
  if (await Usuario.count() === 0) {
    await Usuario.create({
      nombre: "Usuario demo",
      correo: "demo@biblioteca.com",
      contrasena: await bcrypt.hash("123456", 10)
    });
  }
  if (await Sala.count() === 0) {
    await Sala.bulkCreate([
      { nombre: "Sala 1" },
      { nombre: "Sala 2" },
      { nombre: "Sala 3" }
    ]);
  }
  app.listen(puerto, () => {
    console.log(`Servidor activo en http://localhost:${puerto}`);
  });
}

iniciarServidor().catch((error) => {
  console.error(error);
  process.exit(1);
});
