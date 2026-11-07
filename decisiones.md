# Decisiones

## a) Problema y modelos

La aplicación permite que un usuario inicie sesión y reserve una sala de la biblioteca en una fecha y horario.

Se planearon como tres tablas:

- Usuario: nombre, correo y contraseña.
- Sala: nombre de la sala.
- Reserva: sala, usuario, fecha, hora de inicio y hora de fin.

Escogi SQLite porque es una base de datos sencilla para este proyecto y tambien porque no veo necesario usar docker para un proyecto tan simple, aparte de que no lo tengo actualizado. Ya el Sequelize se encarga de crear las tablas y relacionarlas.

Todo el proyecto, incluyendo los textos de la aplicación, los nombres visibles, las rutas y la documentación, se mantendrá en español. Las librerías conservan sus nombres originales porque así se instalan y funcionan correctamente.

El archivo `backend/database.sqlite` es la base de datos del proyecto. Guarda los usuarios, las salas y las reservas creadas. No es un archivo de texto para abrir directamente en VS Code; se consulta cuando el servidor está funcionando o mediante una herramienta para bases de datos SQLite, que puede ser como una extension de visual code.

Las rutas principales también quedaron en español: inicio de sesión, cerrar sesión, usuario actual, salas y reservas.

## b) Trabajo delegado a la IA

Se delegó a la IA la creación inicial del backend, las rutas de inicio de sesión, salas y reservas, la sesión mediante cookie y la validación de horarios.

Lo hice así para avanzar de mas rápido con la parte repetitiva del servidor y dejar una base sencilla para probar desde la parte visual.

## c) Corrección realizada

La validación de horarios se hizo comparando la hora de inicio de una reserva con la hora de fin de otra, y al revés. Así se detectan los solapamientos, que eso del solapamiento seria cuando no coinciden las fechas en terminos de tiempo, pero por ejemplo si se permiten reservas consecutivas, por ejemplo, una de 10:00 a 11:00 y otra de 11:00 a 12:00.

También deje la sesión con renovación por actividad y un límite de 30 minutos, para que el tiempo se cuente desde la última petición del usuario, aparte porque tambien lo pedia en el examen.

## d) Pruebas realizadas

Probé el backend sin utilizar todavía la parte visual con react.

1. Instalé las dependencias con `npm install`.
2. Inicié el servidor con `npm start`.
3. Inicié sesión con el usuario de prueba:
   - Correo: `demo@biblioteca.com`
   - Contraseña: `123456`
   - Resultado: respuesta `200`.
4. Consulté el listado de salas.
   - Resultado: respuesta `200` y aparecieron las tres salas.
5. Creé una reserva para la Sala 1.
   - Resultado: respuesta `201`.
6. Intenté crear otra reserva en el mismo horario y en la misma sala.
   - Resultado: respuesta `409`, por lo que el sistema rechazó el horario solapado.
7. Consulté las reservas creadas.
   - Resultado: respuesta `200`.
8. Intenté consultar las salas sin iniciar sesión.
   - Resultado: respuesta `401`, por lo que se confirmó que la sesión es necesaria.
9. Cerré la sesión.
   - Resultado: respuesta `200`.

Con esas pruebas confirmé que el backend funciona sin depender todavía del frontend.
