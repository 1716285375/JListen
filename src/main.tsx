import { SakugaEffects } from './components/ui/SakugaEffects';
import React from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider } from '@tanstack/react-router';
import { router } from './app/router';
import './styles/globals.css';
import './styles/sakuga.css';
ReactDOM.createRoot(document.getElementById('root')!).render(<React.StrictMode><SakugaEffects/><RouterProvider router={router}/></React.StrictMode>);
