import { Mail, MessageCircle, Phone } from 'lucide-react';

function limpiarTel(tel) {
  return (tel || '').replace(/[^\d+]/g, '');
}

function whatsappNumber(tel) {
  const n = limpiarTel(tel);
  if (!n) return null;
  // si empieza con + lo usamos completo. si empieza con 3 (cel CO), le ponemos 57.
  if (n.startsWith('+')) return n.slice(1);
  if (n.length === 10 && n.startsWith('3')) return '57' + n;
  return n;
}

export function ContactActions({ telefono, email, cliente, size = 'md', stopPropagation = true }) {
  const tel = limpiarTel(telefono);
  const wa = whatsappNumber(telefono);
  const pad = size === 'sm' ? 'p-1.5' : 'p-2';
  const iconSize = size === 'sm' ? 'w-3.5 h-3.5' : 'w-4 h-4';

  const handle = (e, action) => {
    if (stopPropagation) e.stopPropagation();
    action();
  };

  const msgWa = cliente ? `Hola ${cliente}, te escribo de Decolounge.` : 'Hola, te escribo de Decolounge.';

  return (
    <div className="flex items-center gap-1">
      {wa && (
        <button
          title={`WhatsApp: ${telefono}`}
          onClick={(e) => handle(e, () => window.open(`https://wa.me/${wa}?text=${encodeURIComponent(msgWa)}`, '_blank'))}
          className={`${pad} rounded-full bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/30 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-500/20 transition active:scale-90`}
        >
          <MessageCircle className={iconSize} />
        </button>
      )}
      {tel && (
        <a
          href={`tel:${tel}`}
          title={`Llamar: ${telefono}`}
          onClick={(e) => stopPropagation && e.stopPropagation()}
          className={`${pad} rounded-full bg-sky-50 dark:bg-sky-500/10 border border-sky-200 dark:border-sky-500/30 text-sky-700 dark:text-sky-400 hover:bg-sky-100 dark:hover:bg-sky-500/20 transition active:scale-90`}
        >
          <Phone className={iconSize} />
        </a>
      )}
      {email && (
        <a
          href={`mailto:${email}`}
          title={`Email: ${email}`}
          onClick={(e) => stopPropagation && e.stopPropagation()}
          className={`${pad} rounded-full bg-violet-50 dark:bg-violet-500/10 border border-violet-200 dark:border-violet-500/30 text-violet-700 dark:text-violet-400 hover:bg-violet-100 dark:hover:bg-violet-500/20 transition active:scale-90`}
        >
          <Mail className={iconSize} />
        </a>
      )}
    </div>
  );
}
