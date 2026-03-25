import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  BookOpen, Zap, Globe, Download, LayoutTemplate, Star,
  Check, ArrowRight, ChevronRight, Sparkles, Shield, Users
} from 'lucide-react';

const FEATURES = [
  {
    icon: <Sparkles className="w-6 h-6 text-blue-400" />,
    title: 'Génération IA',
    desc: 'Créez des brochures professionnelles en quelques secondes grâce à l\'IA. Alimentée par Google Gemini.',
  },
  {
    icon: <Globe className="w-6 h-6 text-green-400" />,
    title: 'Scraping automatique',
    desc: 'Importez des événements directement depuis n\'importe quel site web. Plus besoin de saisie manuelle.',
  },
  {
    icon: <LayoutTemplate className="w-6 h-6 text-purple-400" />,
    title: 'Templates personnalisés',
    desc: 'Créez et réutilisez vos propres modèles avec votre charte graphique.',
  },
  {
    icon: <Download className="w-6 h-6 text-orange-400" />,
    title: 'Export PDF',
    desc: 'Exportez en PDF haute qualité au format A4, prêt pour l\'impression.',
  },
  {
    icon: <Shield className="w-6 h-6 text-red-400" />,
    title: 'Données sécurisées',
    desc: 'Vos templates et contenus sont stockés de façon sécurisée et privée.',
  },
  {
    icon: <Users className="w-6 h-6 text-yellow-400" />,
    title: 'Multi-utilisateurs',
    desc: 'Plan Agency pour gérer plusieurs clients et territoires depuis un seul compte.',
  },
];

const PLANS = [
  {
    name: 'Gratuit',
    price: '0€',
    period: '/mois',
    description: 'Parfait pour découvrir la plateforme',
    plan: 'free',
    features: [
      '3 brochures par mois',
      '1 template',
      'Export PDF',
      'Scraping web basique',
    ],
    cta: 'Commencer gratuitement',
    highlight: false,
  },
  {
    name: 'Starter',
    price: '29€',
    period: '/mois',
    description: 'Pour les offices de tourisme et communes',
    plan: 'starter',
    features: [
      '20 brochures par mois',
      '5 templates',
      'Export PDF haute qualité',
      'Scraping web avancé',
      'Support par email',
    ],
    cta: 'Commencer',
    highlight: false,
  },
  {
    name: 'Pro',
    price: '79€',
    period: '/mois',
    description: 'Pour les équipes et agences actives',
    plan: 'pro',
    features: [
      '100 brochures par mois',
      '20 templates',
      'Export PDF premium',
      'Scraping + enrichissement IA',
      'Templates partagés',
      'Support prioritaire',
    ],
    cta: 'Passer à Pro',
    highlight: true,
    badge: 'Populaire',
  },
  {
    name: 'Agency',
    price: '199€',
    period: '/mois',
    description: 'Pour les agences et grands territoires',
    plan: 'agency',
    features: [
      'Brochures illimitées',
      'Templates illimités',
      'Accès API',
      'Clients multiples',
      'Onboarding dédié',
      'SLA & support 24/7',
    ],
    cta: 'Nous contacter',
    highlight: false,
  },
];

export default function Landing() {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <BookOpen className="w-6 h-6 text-blue-400" />
            BookletBot
          </Link>
          <div className="flex items-center gap-3">
            <a href="#pricing" className="text-slate-400 hover:text-white text-sm transition-colors hidden sm:block">
              Tarifs
            </a>
            {user ? (
              <Link to="/app">
                <Button size="sm" className="bg-blue-600 hover:bg-blue-500">
                  Accéder à l'app <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
            ) : (
              <>
                <Link to="/auth">
                  <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white">
                    Connexion
                  </Button>
                </Link>
                <Link to="/auth">
                  <Button size="sm" className="bg-blue-600 hover:bg-blue-500">
                    Essai gratuit
                  </Button>
                </Link>
              </>
            )}
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-slate-950 to-purple-900/20 pointer-events-none" />
        <div className="relative max-w-6xl mx-auto px-4 py-24 text-center">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/30 rounded-full px-4 py-1.5 text-sm text-blue-300 mb-8">
            <Zap className="w-4 h-4" />
            Propulsé par Google Gemini 2.5
          </div>
          <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight mb-6 bg-gradient-to-r from-white via-blue-100 to-blue-300 bg-clip-text text-transparent">
            Créez des brochures<br />touristiques en secondes
          </h1>
          <p className="text-xl text-slate-400 max-w-2xl mx-auto mb-10">
            BookletBot génère automatiquement des guides d'animations professionnels à partir de vos sites d'événements, grâce à l'intelligence artificielle.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link to={user ? '/app' : '/auth'}>
              <Button size="lg" className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-8 py-3 text-base rounded-xl w-full sm:w-auto">
                Commencer gratuitement
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <a href="#features">
              <Button size="lg" variant="outline" className="border-white/20 text-white hover:bg-white/10 font-semibold px-8 py-3 text-base rounded-xl w-full sm:w-auto">
                Voir les fonctionnalités
              </Button>
            </a>
          </div>
          <p className="text-slate-500 text-sm mt-6">Sans carte bancaire · 3 brochures offertes</p>
        </div>
      </section>

      {/* Social proof */}
      <section className="border-y border-white/5 bg-white/2 py-8">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <p className="text-slate-500 text-sm mb-4">Utilisé par des offices de tourisme et collectivités</p>
          <div className="flex flex-wrap justify-center gap-8 text-slate-400">
            {['Offices de tourisme', 'Mairies', 'Agglos', 'Agences événementielles', 'Régies culturelles'].map(name => (
              <span key={name} className="font-medium text-sm">{name}</span>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tout ce dont vous avez besoin</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              De la collecte des événements à l'export PDF, BookletBot automatise toute la chaîne de création de vos brochures.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES.map((f) => (
              <div key={f.title} className="bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/8 transition-colors">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
                <p className="text-slate-400 text-sm leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-gradient-to-b from-slate-950 to-slate-900">
        <div className="max-w-4xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Comment ça marche ?</h2>
            <p className="text-slate-400">En 3 étapes simples, votre guide est prêt</p>
          </div>
          <div className="space-y-8">
            {[
              { n: '01', title: 'Choisissez vos sources', desc: 'Collez des URLs de sites d\'événements ou téléchargez vos fichiers. BookletBot scrape automatiquement le contenu.' },
              { n: '02', title: 'L\'IA génère votre brochure', desc: 'Google Gemini analyse les données et génère un guide au format A4 avec mise en page professionnelle, organisé par catégories.' },
              { n: '03', title: 'Exportez et partagez', desc: 'Téléchargez votre brochure en PDF haute qualité, prête pour l\'impression ou la diffusion numérique.' },
            ].map((step) => (
              <div key={step.n} className="flex gap-6 items-start">
                <div className="w-12 h-12 bg-blue-600/20 border border-blue-500/30 rounded-xl flex items-center justify-center font-bold text-blue-400 flex-shrink-0 text-sm">
                  {step.n}
                </div>
                <div>
                  <h3 className="font-semibold text-lg mb-1">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="py-24">
        <div className="max-w-6xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">Tarifs transparents</h2>
            <p className="text-slate-400 max-w-xl mx-auto">
              Commencez gratuitement. Évoluez selon vos besoins. Résiliez à tout moment.
            </p>
          </div>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {PLANS.map((plan) => (
              <div
                key={plan.name}
                className={`relative rounded-2xl p-6 border flex flex-col ${
                  plan.highlight
                    ? 'bg-blue-600/10 border-blue-500/50 ring-1 ring-blue-500/30'
                    : 'bg-white/5 border-white/10'
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-500 text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
                    <Star className="w-3 h-3" /> {plan.badge}
                  </div>
                )}
                <div className="mb-6">
                  <h3 className="font-bold text-lg mb-1">{plan.name}</h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-3xl font-extrabold">{plan.price}</span>
                    <span className="text-slate-400 text-sm">{plan.period}</span>
                  </div>
                  <p className="text-slate-400 text-xs">{plan.description}</p>
                </div>
                <ul className="space-y-2.5 mb-8 flex-1">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                      <Check className="w-4 h-4 text-green-400 flex-shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>
                <Link to={user ? '/app' : '/auth'}>
                  <Button
                    className={`w-full ${
                      plan.highlight
                        ? 'bg-blue-600 hover:bg-blue-500 text-white'
                        : 'bg-white/10 hover:bg-white/20 text-white border border-white/20'
                    }`}
                  >
                    {plan.cta} <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </Link>
              </div>
            ))}
          </div>
          <p className="text-center text-slate-500 text-sm mt-8">
            Tous les plans incluent la TVA · Paiement sécurisé par Stripe
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 bg-gradient-to-b from-slate-900 to-slate-950">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <h2 className="text-3xl sm:text-4xl font-bold mb-4">
            Prêt à automatiser vos brochures ?
          </h2>
          <p className="text-slate-400 mb-8">
            Rejoignez des centaines d'offices de tourisme et collectivités qui utilisent BookletBot.
          </p>
          <Link to={user ? '/app' : '/auth'}>
            <Button size="lg" className="bg-blue-600 hover:bg-blue-500 font-semibold px-10 py-3 text-base rounded-xl">
              Démarrer gratuitement
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <BookOpen className="w-4 h-4" />
            <span>BookletBot © 2025</span>
          </div>
          <div className="flex gap-6 text-slate-500 text-sm">
            <a href="#" className="hover:text-white transition-colors">Confidentialité</a>
            <a href="#" className="hover:text-white transition-colors">CGU</a>
            <a href="#" className="hover:text-white transition-colors">Contact</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
