import Link from 'next/link';
import { FacebookIcon, InstagramIcon, RedditIcon, TikTokIcon } from '../../components/common/ShareIcons';
import { YouTubeLogo } from '../../components/common/PlatformLogos';
import styles from './redes.module.css';

const title = 'Todas las redes del club';
const description = 'Encuentra las cuentas oficiales de Musiclub: Instagram, Facebook, TikTok, Reddit y YouTube. Descubre también el proyecto personal de Eugenio en LinkedIn.';

export const metadata = {
  title,
  description,
  alternates: { canonical: 'https://www.musiclub.org/redes' },
  openGraph: {
    title: `${title} | Musiclub`, description, url: 'https://www.musiclub.org/redes',
    images: [{ url: '/musiclub_logo_corchea.png', alt: 'Musiclub' }],
  },
};

const networks = [
  { name: 'Instagram', handle: '@musicluborg', href: 'https://www.instagram.com/musicluborg/', Icon: InstagramIcon, color: '#f882b3', detail: 'Discos, hallazgos y vida del club' },
  { name: 'TikTok', handle: '@musicluborg', href: 'https://www.tiktok.com/@musicluborg', Icon: TikTokIcon, color: '#62e1df', detail: 'Un nuevo disco en tu siguiente scroll' },
  { name: 'YouTube', handle: '@musicluboficial', href: 'https://www.youtube.com/@musicluboficial', Icon: YouTubeLogo, color: '#ff8989', detail: 'Mira y descubre Musiclub' },
  { name: 'Facebook', handle: '@musicluborg', href: 'https://www.facebook.com/musicluborg/', Icon: FacebookIcon, color: '#94b9ff', detail: 'Comparte la conversación' },
  { name: 'Reddit', handle: 'u/musicluborg', href: 'https://www.reddit.com/user/musicluborg/', Icon: RedditIcon, color: '#ffae7f', detail: 'Recomendaciones y conversaciones con calma' },
];

function Arrow() {
  return <svg viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M6 18 18 6M6 6h12v12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

function LinkedInIcon() {
  return <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M5.37 24H.4V7.98h4.97V24ZM2.88 5.8a2.9 2.9 0 1 1 0-5.8 2.9 2.9 0 0 1 0 5.8ZM24 24h-4.96v-7.8c0-1.86-.04-4.25-2.59-4.25-2.59 0-2.99 2.02-2.99 4.12V24H8.5V7.98h4.77v2.19h.07c.66-1.26 2.29-2.59 4.7-2.59C23.07 7.58 24 10.9 24 15.2V24Z" /></svg>;
}

export default function SocialLinksPage() {
  return <div className={styles.page}>
    <div className={styles.records} aria-hidden="true">
      <img className={styles.recordOne} src="/genres/alternative-rock.svg" alt="" width="300" height="300" />
      <img className={styles.recordTwo} src="/genres/alternative-pop.svg" alt="" width="230" height="230" />
      <img className={styles.recordThree} src="/musiclub_logo_3.png" alt="" width="240" height="240" />
    </div>
    <main className={styles.main}>
      <header className={styles.header}>
        <Link href="/" className={styles.brand} aria-label="Ir a Musiclub">
          <img src="/musiclub_logo_corchea.png" alt="" width="62" height="68" />
          <span>musiclub<span className={styles.dot}>.</span></span>
        </Link>
        <p className={styles.eyebrow}>RESEÑAS, DISCOS Y GENTE CON BUENAS RECOMENDACIONES</p>
        <h1>El club también<br />suena por aquí<span className={styles.dot}>.</span></h1>
        <p className={styles.intro}>Encuentra tu siguiente disco. Comparte lo que escuchas.<br className={styles.desktopBreak} /> Súmate a la conversación donde más te guste.</p>
      </header>

      <Link href="/" className={styles.featured}>
        <img src="/musiclub_logo_3.png" alt="" width="64" height="64" />
        <span><strong>Entra a Musiclub</strong><small>Descubre, reseña y escucha en comunidad</small></span><Arrow />
      </Link>

      <nav aria-label="Cuentas oficiales de Musiclub" className={styles.networks}>
        {networks.map(({ name, handle, href, Icon, color, detail }) => <a key={name} href={href} target="_blank" rel="noopener noreferrer" className={styles.card} style={{ '--network-color': color }} aria-label={`${name}: ${handle} (se abre en otra pestaña)`}>
          <span className={styles.icon} aria-hidden="true"><Icon className={styles.iconSvg} /></span>
          <span className={styles.cardText}><span className={styles.cardTitle}>{name}<span>{handle}</span></span><small>{detail}</small></span><Arrow />
        </a>)}
      </nav>

      <a href="https://www.linkedin.com/in/eugenio-turcott/" target="_blank" rel="noopener noreferrer" className={`${styles.card} ${styles.personal}`} aria-label="LinkedIn de Eugenio Turcott, creador de Musiclub (se abre en otra pestaña)">
        <span className={styles.icon}><LinkedInIcon /></span>
        <span className={styles.cardText}><span className={styles.cardTitle}>Detrás de Musiclub</span><small>Eugenio Turcott · Proyecto personal en LinkedIn</small></span><Arrow />
      </a>
      <footer className={styles.footer}><a href="mailto:musiclub.org@gmail.com">¿Platicamos? musiclub.org@gmail.com</a><span>Hecho con música, para compartir música.</span><Link href="/privacy">Privacidad</Link></footer>
    </main>
  </div>;
}
