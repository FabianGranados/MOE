# Videos

Carpeta para guardar los archivos de video del proyecto.

## Uso

Coloca aquí los archivos de video (`.mp4`, `.webm`, `.mov`, etc.). Al estar dentro de `public/`, Vite los sirve como assets estáticos.

Referencia en el código con ruta absoluta desde la raíz del sitio:

```jsx
<video src="/videos/mi-video.mp4" controls />
```

## Formatos recomendados

- `.mp4` (H.264) — compatibilidad máxima
- `.webm` (VP9/AV1) — mejor compresión para la web

## Notas

- Los archivos grandes no deberían commitearse al repo. Considera usar Git LFS o almacenamiento externo (Supabase Storage, S3, etc.) para videos pesados.
