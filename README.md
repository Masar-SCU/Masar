# Masar Frontend

React 19 + TypeScript + Vite frontend for the Masar career guidance system.

## Tech Stack

* React
* TypeScript
* Vite
* React Router
* Tailwind CSS
* Axios
* Zustand
* Lucide React

## Development

From this directory:

```bash
npm install
npm run dev
```

The development server runs on the default Vite port.

## Validation

Run the following before opening a pull request:

```bash
npx tsc --noEmit
npm run build
```

## Routes

* `/login`
* `/dashboard`
* `/profile`
* `/gap-analysis`
* `/roadmap`
* `/mentor`

The current Slice 0 implementation provides the application shell, routing, navigation, responsive layout, and placeholder pages. Backend integration and feature-specific logic will be implemented in later slices.
