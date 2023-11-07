import styles from './page.module.css';

export default function Home() {
  return (
    <div className={`pageContainer ${styles.homePage}`}>
      <h1>Detecção facial</h1>
      <p>Detectando aluno...</p>
      <div className={styles.videoContainer}>
        <video id="video" autoPlay muted></video>
        <canvas></canvas>
      </div>
    </div>
  );
}
