import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth, PLAN_LIMITS } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BookOpen, ArrowLeft, CreditCard, Zap, LogOut, User, BarChart2, Loader2, CheckCircle } from 'lucide-react';

export default function Account() {
  const { user, subscription, signOut, refreshSubscription } = useAuth();
  const [searchParams] = useSearchParams();
  const [portalLoading, setPortalLoading] = useState(false);
  const [checkoutLoading, setCheckoutLoading] = useState<string | null>(null);
  const [monthlyUsage, setMonthlyUsage] = useState(0);

  const plan = subscription?.plan || 'free';
  const limits = PLAN_LIMITS[plan];

  useEffect(() => {
    // Show success toast if redirected from Stripe checkout
    if (searchParams.get('checkout') === 'success') {
      toast.success('Abonnement activé avec succès !');
      refreshSubscription();
    }
  }, [searchParams]);

  useEffect(() => {
    if (!user) return;
    // Usage tracking not yet implemented - placeholder
    setMonthlyUsage(0);
  }, [user]);

  async function handlePortal() {
    setPortalLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('customer-portal', {
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error('Impossible d\'ouvrir le portail de facturation');
      }
    } catch {
      toast.error('Erreur lors de l\'accès au portail');
    } finally {
      setPortalLoading(false);
    }
  }

  async function handleUpgrade(targetPlan: string) {
    setCheckoutLoading(targetPlan);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await supabase.functions.invoke('create-checkout', {
        body: { plan: targetPlan },
        headers: { Authorization: `Bearer ${session?.access_token}` },
      });
      if (res.data?.url) {
        window.location.href = res.data.url;
      } else {
        toast.error('Impossible de créer la session de paiement');
      }
    } catch {
      toast.error('Erreur lors de la redirection vers Stripe');
    } finally {
      setCheckoutLoading(null);
    }
  }

  const UPGRADE_PLANS = [
    { key: 'starter', name: 'Starter', price: '29€/mois', brochures: 20, highlight: false },
    { key: 'pro', name: 'Pro', price: '79€/mois', brochures: 100, highlight: true },
    { key: 'agency', name: 'Agency', price: '199€/mois', brochures: '∞', highlight: false },
  ];

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Navbar */}
      <nav className="border-b border-white/10 sticky top-0 z-50 bg-slate-950/80 backdrop-blur-md">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-bold text-lg">
            <BookOpen className="w-6 h-6 text-blue-400" />
            BookletBot
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/app">
              <Button variant="ghost" size="sm" className="text-slate-300 hover:text-white gap-1">
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Retour à l'app</span>
              </Button>
            </Link>
            <Button variant="ghost" size="sm" onClick={signOut} className="text-slate-400 hover:text-white gap-1">
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:inline">Déconnexion</span>
            </Button>
          </div>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-12 space-y-8">
        {/* Profile */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600/20 rounded-full flex items-center justify-center">
              <User className="w-6 h-6 text-blue-400" />
            </div>
            <div>
              <h2 className="font-semibold text-lg">{user?.email}</h2>
              <p className="text-slate-400 text-sm">Compte créé le {user?.created_at ? new Date(user.created_at).toLocaleDateString('fr-FR') : '—'}</p>
            </div>
          </div>
        </div>

        {/* Current Plan */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-6">
            <CreditCard className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-lg">Votre abonnement</h3>
          </div>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-2xl font-bold capitalize">{limits.label}</span>
                {subscription?.status === 'active' && (
                  <span className="bg-green-500/20 text-green-400 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle className="w-3 h-3" /> Actif
                  </span>
                )}
              </div>
              {subscription?.current_period_end && (
                <p className="text-slate-400 text-sm">
                  Renouvellement le {new Date(subscription.current_period_end).toLocaleDateString('fr-FR')}
                  {subscription.cancel_at_period_end && ' (résiliation programmée)'}
                </p>
              )}
            </div>
            {plan !== 'free' && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePortal}
                disabled={portalLoading}
                className="border-white/20 text-white hover:bg-white/10"
              >
                {portalLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Gérer la facturation'}
              </Button>
            )}
          </div>
        </div>

        {/* Usage */}
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <BarChart2 className="w-5 h-5 text-blue-400" />
            <h3 className="font-semibold text-lg">Utilisation ce mois-ci</h3>
          </div>
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-400">Brochures générées</span>
              <span className="font-medium">
                {monthlyUsage} / {limits.brochures === 9999 ? '∞' : limits.brochures}
              </span>
            </div>
            {limits.brochures !== 9999 && (
              <div className="w-full bg-white/10 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${Math.min(100, (monthlyUsage / limits.brochures) * 100)}%` }}
                />
              </div>
            )}
          </div>
        </div>

        {/* Upgrade */}
        {plan !== 'agency' && (
          <div className="bg-gradient-to-br from-blue-900/30 to-purple-900/20 border border-blue-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-yellow-400" />
              <h3 className="font-semibold text-lg">Passer à un plan supérieur</h3>
            </div>
            <p className="text-slate-400 text-sm mb-6">Plus de brochures, plus de templates, plus de puissance.</p>
            <div className="grid sm:grid-cols-3 gap-4">
              {UPGRADE_PLANS.filter(p => {
                const order = ['free', 'starter', 'pro', 'agency'];
                return order.indexOf(p.key) > order.indexOf(plan);
              }).map((p) => (
                <div
                  key={p.key}
                  className={`rounded-xl p-4 border text-center ${
                    p.highlight
                      ? 'bg-blue-600/20 border-blue-500/50'
                      : 'bg-white/5 border-white/10'
                  }`}
                >
                  <div className="font-bold mb-1">{p.name}</div>
                  <div className="text-blue-300 text-sm mb-1">{p.price}</div>
                  <div className="text-slate-400 text-xs mb-3">{p.brochures} brochures/mois</div>
                  <Button
                    size="sm"
                    onClick={() => handleUpgrade(p.key)}
                    disabled={checkoutLoading === p.key}
                    className={`w-full text-xs ${p.highlight ? 'bg-blue-600 hover:bg-blue-500' : 'bg-white/10 hover:bg-white/20 border border-white/20'}`}
                  >
                    {checkoutLoading === p.key ? <Loader2 className="w-3 h-3 animate-spin" /> : `Passer à ${p.name}`}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
