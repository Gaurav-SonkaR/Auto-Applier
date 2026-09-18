import React from 'react'
import ReactDOM from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import App from './App'
import './index.css'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      // Data is fetched once and never re-fetched on its own — no timers, no
      // refetch-on-window-focus, no refetch-on-reconnect. Every page that
      // shows server data has its own RefreshButton (components/common) for
      // "get me the latest" and every mutation invalidates what it changed;
      // that is the only thing that updates data here.
      staleTime: Infinity,
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
    },
  },
})

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>,
)
