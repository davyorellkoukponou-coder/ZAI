import Link from 'next/link'
import { ArrowLeft, Shield, Heart, EyeOff, AlertTriangle } from 'lucide-react'

export default function RulesPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white selection:bg-violet-500/30">
      <div className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/" className="inline-flex items-center text-sm text-zinc-400 hover:text-white mb-8 transition">
          <ArrowLeft className="h-4 w-4 mr-2" /> Retour à l'accueil
        </Link>

        <h1 className="text-3xl sm:text-4xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-violet-400 to-fuchsia-400 mb-8">
          Règles & Sécurité sur Zai
        </h1>

        <div className="space-y-8 text-zinc-300">
          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Shield className="h-5 w-5 text-violet-400" /> 1. Le but de Zai
            </h2>
            <p>
              Zai a été créé pour permettre de partager des messages sincères, des compliments (Crush, Ami) ou des confidences de manière 100% anonyme. 
              L'anonymat est un super pouvoir qui doit être utilisé pour faire sourire, pas pour blesser.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <EyeOff className="h-5 w-5 text-violet-400" /> 2. 100% Anonyme, Vraiment
            </h2>
            <p>
              Lorsque tu envoies un message, ton identité (nom, pseudo, IP) n'est jamais révélée au destinataire. 
              Le destinataire ne verra que l'heure approximative d'envoi et ton tag d'humeur.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-red-400" /> 3. Tolérance Zéro (Shadowban)
            </h2>
            <p>
              Nous avons mis en place un système de <strong className="text-red-300">Shadowban</strong> redoutable contre le harcèlement.
            </p>
            <ul className="list-disc pl-5 space-y-2 text-zinc-400">
              <li>Si un destinataire signale tes messages 3 fois, ton appareil est bloqué.</li>
              <li>Le piège ? L'application te dira toujours "Message envoyé", mais tes messages n'arriveront plus jamais dans la boîte de réception de la personne. Tu parleras dans le vide.</li>
              <li>Le racisme, les menaces et le cyberharcèlement n'ont pas leur place ici.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-xl font-bold text-white flex items-center gap-2">
              <Heart className="h-5 w-5 text-fuchsia-400" /> 4. Mode Duo & Secrets
            </h2>
            <p>
              Tu peux t'associer avec un(e) partenaire depuis ton Dashboard. Si tu atteins l'objectif quotidien de 25 messages reçus, tu débloques la capacité d'espionner aléatoirement 3 messages de sa boîte de réception !
              (Les messages volés restent anonymes).
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/10 text-center">
          <p className="text-sm text-zinc-500 mb-4">Prêt(e) à jouer le jeu ?</p>
          <Link href="/register" className="inline-block px-6 py-3 rounded-xl bg-violet-600 hover:bg-violet-500 text-white font-semibold transition">
            Créer mon lien Zai
          </Link>
        </div>
      </div>
    </main>
  )
}
