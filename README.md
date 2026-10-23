# Experimentos de IA · Enrique Paiva

Blog de experimentos con modelos de lenguaje, con demos interactivas. Think Paraguayo 🇵🇾.

Sitio estático para GitHub Pages: sin compilación, sin dependencias.

## Estructura

```
index.html              portada: búsqueda, temas, lista/tablero, "Ver más"
posts.json              lista de posts publicados (alimenta portada, buscador y temas)
posts/<id>/index.html   un post por carpeta, con pestañas (#articulo, #experimento, …)
posts/plantilla/        post de referencia del formato (no figura en posts.json)
assets/site.css         estilos y colores (tokens en :root, tema claro y oscuro)
assets/site.js          panel lateral, barra superior, tema, portada, pestañas, miniaturas
404.html                página de error
```

## Datos del perfil

Nombre, organización, presentación, foto y redes se editan una sola vez en el objeto `SITE`, al principio de `assets/site.js`. Para la foto: subir `assets/foto.jpg` (cuadrada) y poner `photo: "assets/foto.jpg"`.

## Agregar un post

1. Copiar `posts/plantilla/` a `posts/<id>/` (id corto, en minúsculas, sin espacios ni tildes).
2. Editar el contenido. Quitar `<meta name="robots" content="noindex">`.
3. Agregar la entrada **al principio** de `posts.json`:

```json
{
  "id": "mi-post",
  "title": "Título del post",
  "sum": "Resumen de 2 o 3 frases para la tarjeta.",
  "date": "23 oct 2026",
  "read": "6 min",
  "tags": ["agentes", "evaluación"],
  "art": "nodes"
}
```

`art` elige la miniatura: `bars`, `curve`, `dots`, `stack`, `grid` o `nodes`.

## Publicar en GitHub Pages

Settings → Pages → Source: *Deploy from a branch* → Branch `main`, carpeta `/ (root)`.

Con este repositorio (`EnPaiva93/thinkpy.github.io`) el sitio queda en
`https://enpaiva93.github.io/thinkpy.github.io/`. Para que quede en `https://thinkpy.github.io`,
el repositorio tiene que estar en una organización de GitHub llamada `thinkpy`.

## Probar en la computadora

```
python3 -m http.server 8000
```

y abrir `http://localhost:8000`. Abrir `index.html` con doble clic no funciona porque el navegador bloquea la lectura de `posts.json`.
