import './globals.css'
import { Toaster } from '@/components/ui/sonner'

export const metadata = {
  title: 'Zai · Messages anonymes',
  description: 'Dis ce que tu penses. Sans te dévoiler. Reçois des messages anonymes de tes amis, crush et rivaux.',
  openGraph: {
    title: 'Zai · Messages anonymes',
    description: 'Dis ce que tu penses. Sans te dévoiler.',
    type: 'website',
  },
  manifest: '/manifest.json',
  themeColor: '#0a0a0a',
}

export default function RootLayout({ children }) {
  return (
    <html lang="fr" className="dark">
      <head>
        <script dangerouslySetInnerHTML={{__html:'window.addEventListener("error",function(e){if(e.error instanceof DOMException&&e.error.name==="DataCloneError"&&e.message&&e.message.includes("PerformanceServerTiming")){e.stopImmediatePropagation();e.preventDefault()}},true);'}} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700;800&display=swap" rel="stylesheet" />
      </head>
      <body className="bg-[#0a0a0a] text-white antialiased" style={{ fontFamily: 'Geist, ui-sans-serif, system-ui, sans-serif' }}>
        {children}
        <Toaster theme="dark" position="top-center" richColors />
      </body>
    </html>
  )
}
