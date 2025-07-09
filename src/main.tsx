import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Add mobile console for debugging on mobile devices
if (window.location.search.includes('debug=true')) {
  import('eruda').then(eruda => eruda.default.init());
}

createRoot(document.getElementById("root")!).render(<App />);
