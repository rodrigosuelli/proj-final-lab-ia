import styles from './page.module.css';

export default function Home() {
  return (
    <div className={`pageContainer ${styles.homePage}`}>
      <h1>Ola</h1>
      <p>Ola mundo</p>
    </div>
  );
}
