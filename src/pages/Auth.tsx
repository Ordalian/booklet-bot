import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { BookOpen, Loader2 } from 'lucide-react';

export default function Auth() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);

    try {
      if (mode === 'signin') {
        const { error } = await signIn(email, password);
        if (error) throw error;
        toast.success('Connexion réussie !');
        navigate('/app');
      } else {
        if (password.length < 6) {
          throw new Error('Le mot de passe doit contenir au moins 6 caractères');
        }
        const { error } = await signUp(email, password, fullName);
        if (error) throw error;
        toast.success('Compte créé ! Vérifiez votre email pour confirmer.');
      }
    } catch (err: any) {
      toast.error(err.message || 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 text-white hover:opacity-80 transition-opacity">
            <BookOpen className="w-8 h-8 text-blue-400" />
            <span className="text-2xl font-bold">BookletBot</span>
          </Link>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 border border-white/20 shadow-2xl">
          <h1 className="text-2xl font-bold text-white mb-2 text-center">
            {mode === 'signin' ? 'Connexion' : 'Créer un compte'}
          </h1>
          <p className="text-slate-400 text-center mb-6 text-sm">
            {mode === 'signin'
              ? 'Accédez à votre espace BookletBot'
              : 'Commencez gratuitement, sans carte bancaire'}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div>
                <Label htmlFor="fullName" className="text-slate-300 text-sm">Nom complet</Label>
                <Input
                  id="fullName"
                  type="text"
                  placeholder="Jean Dupont"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-blue-400"
                />
              </div>
            )}
            <div>
              <Label htmlFor="email" className="text-slate-300 text-sm">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="vous@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>
            <div>
              <Label htmlFor="password" className="text-slate-300 text-sm">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className="mt-1 bg-white/10 border-white/20 text-white placeholder:text-slate-500 focus:border-blue-400"
              />
            </div>

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-2.5 rounded-lg transition-colors mt-2"
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Chargement...</>
              ) : mode === 'signin' ? 'Se connecter' : 'Créer mon compte'}
            </Button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-slate-400 text-sm">
              {mode === 'signin' ? "Pas encore de compte ?" : "Déjà un compte ?"}
              {' '}
              <button
                onClick={() => setMode(mode === 'signin' ? 'signup' : 'signin')}
                className="text-blue-400 hover:text-blue-300 font-medium transition-colors"
              >
                {mode === 'signin' ? 'Créer un compte' : 'Se connecter'}
              </button>
            </p>
          </div>
        </div>

        <p className="text-center text-slate-500 text-xs mt-6">
          En vous inscrivant, vous acceptez nos{' '}
          <a href="#" className="text-slate-400 hover:text-white">conditions d'utilisation</a>
        </p>
      </div>
    </div>
  );
}
