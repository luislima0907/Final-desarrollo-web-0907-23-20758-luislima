# Prompts utilizados

1. Haz primero solamente el backend, usando SQLite por ser la opción más sencilla ya que no quiero usar docker porque no lo he actualizado.

2. Incluye inicio de sesión, listado de salas, creación de reservas y evita reservas con horarios solapados ya que se esta manejando la fecha junto con la hora, entonces al final, pueden haber problemas con esas validaciones.

3. Tambien Configura la sesión para que expire después de 30 minutos de inactividad y prepara respuestas 401 para que al momento de hacer el frontend con react pueda volver al inicio de sesión.

4. Mantén el código simple, sin carpetas o arquitecturas innecesarias, sin comentarios descriptivos, tampoco quiero emojis ya que pues no se ven bien al final.

5. Mantén todo el proyecto en español, no uses nombres de entidades ni textos visibles en inglés, y explica en los informes para qué sirve el archivo `database.sqlite` y por qué no se abre como un archivo de texto en VS Code ya que si se podria, pero habria que instalar una extension extra en visual code.

6. Implementa ahora el frontend con React básico, manteniendo todo en español, sin diseños complejos ni carpetas innecesarias. Incluye inicio de sesión sesion que valide el usuario hecho por defecto, y revisa que se vean bien las salas, formulario de reserva, reservas existentes y regreso al inicio con el boton de cerrar sesion. Pon mensajes de error comprensibles y no un 500 asi nomas.
