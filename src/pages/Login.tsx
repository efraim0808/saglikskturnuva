import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../AppContext';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from '../components/ui/Card';
import { Trophy, Mail, Lock, UserPlus, LogIn, ShieldCheck, RefreshCw, KeyRound, ArrowLeft } from 'lucide-react';
import { validatePassword } from '../lib/utils';

type Step = 'form' | 'otp' | 'forgot';

function generateOtp(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function Login() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<Step>('form');
  const [otpCode, setOtpCode] = useState('');
  const [otpInput, setOtpInput] = useState('');
  const [otpError, setOtpError] = useState('');

  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState('');
  const [forgotError, setForgotError] = useState('');

  const { signIn, signUp, requestPasswordReset } = useApp();
  const navigate = useNavigate();

  async function handleFormSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (isSignUp) {
      const pwdError = validatePassword(password);
      if (pwdError) {
        setError(pwdError);
        setLoading(false);
        return;
      }
      const code = generateOtp();
      setOtpCode(code);
      setStep('otp');
      setLoading(false);
    } else {
      try {
        const { error } = await signIn(email, password);
        if (error) setError(error);
        else navigate('/');
      } catch {
        setError('Bağlantı hatası, lütfen tekrar deneyin.');
      } finally {
        setLoading(false);
      }
    }
  }

  async function handleOtpSubmit(e: React.FormEvent) {
    e.preventDefault();
    setOtpError('');
    if (otpInput.trim() !== otpCode) {
      setOtpError('Dogrulama kodu hatali. Lutfen tekrar deneyin.');
      return;
    }
    setLoading(true);
    try {
      const { error } = await signUp(email, password);
      if (error) {
        setStep('form');
        setError(error);
      } else {
        setStep('form');
        setIsSignUp(false);
        setError('Hesabiniz olusturuldu! Admin onayindan sonra giris yapabileceksiniz.');
        setEmail('');
        setPassword('');
        setOtpInput('');
        setOtpCode('');
      }
    } catch {
      setStep('form');
      setError('Bağlantı hatası, lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  }

  async function handleForgotSubmit(e: React.FormEvent) {
    e.preventDefault();
    setForgotError('');
    setForgotMessage('');
    if (!forgotEmail.trim()) {
      setForgotError('Lutfen e-posta adresinizi girin.');
      return;
    }
    setForgotLoading(true);
    try {
      await requestPasswordReset(forgotEmail.trim().toLowerCase());
      setForgotMessage(
        "Sifre sifirlama talebiniz Super Admin'e iletilmistir. Yeni sifreniz icin lutfen turnuva yonetimiyle iletisime gecin."
      );
    } catch {
      setForgotError('Bağlantı hatası, lütfen tekrar deneyin.');
    } finally {
      setForgotLoading(false);
    }
  }

  function switchMode() {
    setIsSignUp(!isSignUp);
    setError('');
    setStep('form');
    setOtpInput('');
    setOtpCode('');
    setOtpError('');
  }

  function goToForgot() {
    setStep('forgot');
    setForgotEmail(email);
    setForgotError('');
    setForgotMessage('');
  }

  function backToLogin() {
    setStep('form');
    setForgotEmail('');
    setForgotError('');
    setForgotMessage('');
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-emerald-600 rounded-xl flex items-center justify-center mb-4">
            {step === 'otp' ? (
              <ShieldCheck className="w-7 h-7 text-white" />
            ) : step === 'forgot' ? (
              <KeyRound className="w-7 h-7 text-white" />
            ) : (
              <Trophy className="w-7 h-7 text-white" />
            )}
          </div>
          <CardTitle>
            {step === 'otp'
              ? 'E-posta Dogrulama'
              : step === 'forgot'
              ? 'Sifremi Unuttum'
              : isSignUp
              ? 'Hesap Olustur'
              : 'Giris Yap'}
          </CardTitle>
          <p className="text-sm text-slate-500 mt-1">
            SaglikSK Turnuva Yonetim Platformu
          </p>
        </CardHeader>

        <CardContent>
          {step === 'otp' && (
            <>
              <div className="mb-5 p-4 bg-sky-50 border border-sky-200 rounded-xl text-sm text-sky-800">
                <p className="font-semibold mb-1">Dogrulama Kodu Gonderildi</p>
                <p>
                  <span className="font-mono font-bold">{email}</span> adresine 6 haneli bir dogrulama kodu gonderildi.
                </p>
                <p className="mt-2 text-xs font-semibold text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                  Simulasyon Modu: Kayit islemini tamamlamak icin lutfen asagidaki kutuya{' '}
                  <span className="font-mono tracking-widest">{otpCode}</span> yazin.
                </p>
              </div>
              <form onSubmit={handleOtpSubmit} className="space-y-4" autoComplete="off">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">6 Haneli Dogrulama Kodu</label>
                  <Input
                    type="text"
                    value={otpInput}
                    onChange={e => setOtpInput(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    placeholder="123456"
                    maxLength={6}
                    className="text-center text-2xl font-mono tracking-widest"
                    required
                    autoFocus
                    autoComplete="one-time-code"
                  />
                </div>
                {otpError && (
                  <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{otpError}</div>
                )}
                <Button type="submit" className="w-full" disabled={loading || otpInput.length !== 6}>
                  <ShieldCheck className="w-4 h-4 mr-2" />
                  {loading ? 'Dogrulanıyor...' : 'Dogrula ve Kayit Ol'}
                </Button>
                <button
                  type="button"
                  onClick={() => { setStep('form'); setOtpInput(''); setOtpError(''); }}
                  className="w-full text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1 mt-2"
                >
                  <RefreshCw className="w-3.5 h-3.5" /> Geri Don
                </button>
              </form>
            </>
          )}

          {step === 'forgot' && (
            <>
              {forgotMessage ? (
                <div className="space-y-4">
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-sm text-emerald-800">
                    <p className="font-semibold mb-1">Talebiniz Alindi</p>
                    <p>{forgotMessage}</p>
                  </div>
                  <button
                    onClick={backToLogin}
                    className="w-full text-sm text-emerald-600 hover:text-emerald-700 flex items-center justify-center gap-1.5 font-medium"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Giris ekranina don
                  </button>
                </div>
              ) : (
                <form onSubmit={handleForgotSubmit} className="space-y-4" autoComplete="off">
                  <p className="text-sm text-slate-500 mb-2">
                    Kayitli e-posta adresinizi girin. Sifre sifirlama talebiniz Super Admin'e iletilecektir.
                  </p>
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-slate-700">E-posta Adresiniz</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                      <Input
                        type="email"
                        value={forgotEmail}
                        onChange={e => setForgotEmail(e.target.value)}
                        className="pl-10"
                        placeholder="ornek@sagliksk.com"
                        required
                        autoComplete="off"
                      />
                    </div>
                  </div>
                  {forgotError && (
                    <div className="p-3 rounded-lg text-sm bg-red-50 text-red-700">{forgotError}</div>
                  )}
                  <Button type="submit" className="w-full" disabled={forgotLoading}>
                    <KeyRound className="w-4 h-4 mr-2" />
                    {forgotLoading ? 'Gonderiliyor...' : 'Talep Gonder'}
                  </Button>
                  <button
                    type="button"
                    onClick={backToLogin}
                    className="w-full text-sm text-slate-500 hover:text-slate-700 flex items-center justify-center gap-1.5 mt-1"
                  >
                    <ArrowLeft className="w-3.5 h-3.5" /> Giris ekranina don
                  </button>
                </form>
              )}
            </>
          )}

          {step === 'form' && (
            <>
              <form onSubmit={handleFormSubmit} className="space-y-4" autoComplete="off">
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">E-posta</label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      className="pl-10"
                      placeholder="ornek@sagliksk.com"
                      required
                      autoComplete="off"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium text-slate-700">Sifre</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 w-4 h-4 text-slate-400" />
                    <Input
                      type="password"
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      className="pl-10"
                      placeholder="••••••••"
                      required
                      minLength={6}
                      autoComplete={isSignUp ? 'new-password' : 'off'}
                    />
                  </div>
                  {!isSignUp && (
                    <div className="text-right">
                      <button
                        type="button"
                        onClick={goToForgot}
                        className="text-xs text-emerald-600 hover:text-emerald-700 font-medium"
                      >
                        Sifremi Unuttum
                      </button>
                    </div>
                  )}
                </div>
                {error && (
                  <div className={`p-3 rounded-lg text-sm ${
                    error.includes('olusturuldu') ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-700'
                  }`}>
                    {error}
                  </div>
                )}
                <Button type="submit" className="w-full" disabled={loading}>
                  {isSignUp ? (
                    <><UserPlus className="w-4 h-4 mr-2" /> Devam Et</>
                  ) : (
                    <><LogIn className="w-4 h-4 mr-2" /> Giris Yap</>
                  )}
                </Button>
              </form>
              <div className="mt-4 text-center">
                <button
                  onClick={switchMode}
                  className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
                >
                  {isSignUp ? 'Zaten hesabiniz var mi? Giris yapin' : 'Hesabiniz yok mu? Kaydolun'}
                </button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
