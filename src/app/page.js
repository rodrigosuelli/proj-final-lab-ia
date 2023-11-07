import styles from './page.module.css';

export default function Home() {
  return (
    <div className={`pageContainer ${styles.homePage}`}>
      <h1>Detecção facial</h1>
      <p>Detectando aluno...</p>
      <video id="video" width="720" height="560" autoPlay muted></video>
    </div>
  );
}
