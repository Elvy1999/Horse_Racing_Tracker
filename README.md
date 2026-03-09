# DECOO Reclamo Payment Calculator

Aplicacion web en React + TypeScript + Vite para calcular pagos de carreras de reclamo.

## Lo que hace

- Calcula el pago por carrera usando las tablas fijas de `3 anos o menos` y `4 anos o mas`
- Distribuye el premio entre `Entrenador`, `Groom`, `Jockey` y `Ganancia`
- Permite acumular varias carreras en una sesion
- Guarda historial local del navegador para carreras individuales y sesiones guardadas

## Comandos

```bash
npm install
npm run dev
npm run test
npm run lint
npm run build
```

## Reglas implementadas

- Categorias: `100`, `200`, `300`, `400`, `500`, `600`
- Menos de `3` caballos: no permitido
- Posiciones fuera de la tabla de pago: regresan `0`
- Distribucion del premio:
  - Entrenador: `15%`
  - Groom: `10%`
  - Jockey: `10%`
  - Ganancia: `65%`

## Historial

La aplicacion guarda el historial en `localStorage`, asi que los datos viven en el navegador actual.
