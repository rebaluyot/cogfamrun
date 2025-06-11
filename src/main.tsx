import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

// Import the theme watcher to help with theme changes
import './lib/theme-watcher';

createRoot(document.getElementById("root")!).render(<App />);
