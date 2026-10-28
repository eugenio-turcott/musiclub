import Link from 'next/link';
import { AppHeader } from './AppHeader';
import { Footer } from './Footer';
import styles from './InformationPage.module.css';

export function InformationPage({ title, intro, children }) {
  return <div className="min-h-screen cyber-grid p-3 sm:p-6"><div className="mx-auto max-w-7xl">
    <AppHeader showTitle={false}/>
    <main className={styles.main}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Dentro del club</p>
        <h1>{title}</h1><p className={styles.intro}>{intro}</p>
      </header>
      <nav aria-label="Información de Musiclub" className={styles.navigation}>
        <Link href="/sobre-musiclub">Sobre Musiclub</Link><Link href="/contacto">Contacto</Link><Link href="/guias">Guías de escucha</Link><Link href="/faq">Preguntas frecuentes</Link>
      </nav>
      <div className={styles.content}>{children}</div>
    </main>
    <Footer />
  </div></div>;
}
