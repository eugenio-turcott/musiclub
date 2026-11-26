import {MusiclubVinyl} from './MusiclubVinyl';
import styles from './SectionHeader.module.css';
export function SectionHeader({title,description,stats=[],children}){
 return <section className={styles.header} data-section-header><div className={styles.identity}><MusiclubVinyl alt=""/><div><h1>{title}</h1><p>{description}</p></div></div><div className={styles.summary}><dl>{stats.map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>{children&&<div className={styles.action}>{children}</div>}</div></section>;
}
