'use client';

import * as faceapi from 'face-api.js';
import { useEffect, useRef, useState } from 'react';

import Image from 'next/image';

import pessoasCadastradas from './pessoasCadastradas.json';
import styles from './page.module.css';

function loadLabeledImages() {
  return Promise.all(
    pessoasCadastradas.map(async (pessoa) => {
      const descriptions = [];

      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(
          `/labeled_images/${pessoa.label}/${i}.jpg`
        );

        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        descriptions.push(detections.descriptor);
      }

      return new faceapi.LabeledFaceDescriptors(pessoa.label, descriptions);
    })
  );
}

export default function Home() {
  const [alunosDetectados, setAlunosDetectados] = useState([]);

  const videoContainer = useRef(null);
  const video = useRef(null);
  const canvas = useRef(null);

  async function handleVideoPlaying() {
    const displaySize = {
      width: video.current.width,
      height: video.current.height,
    };
    faceapi.matchDimensions(canvas.current, displaySize);

    const labeledFaceDescriptors = await loadLabeledImages();
    const faceMatcher = new faceapi.FaceMatcher(labeledFaceDescriptors, 0.6);

    setInterval(async () => {
      const detections = await faceapi
        .detectAllFaces(video.current, new faceapi.TinyFaceDetectorOptions())
        .withFaceLandmarks()
        .withFaceDescriptors()
        .withFaceExpressions();
      const resizedDetections = faceapi.resizeResults(detections, displaySize);

      const results = resizedDetections.map((d) =>
        faceMatcher.findBestMatch(d.descriptor)
      );

      canvas.current
        .getContext('2d', { willReadFrequently: true })
        .clearRect(0, 0, canvas.current.width, canvas.current.height);

      const finalDetections = results.flatMap((result, i) => {
        const { box } = resizedDetections[i].detection;
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: result.toString(),
        });
        drawBox.draw(canvas.current);

        if (result.label === 'unknown') {
          return [];
        }

        const data = pessoasCadastradas.find(
          (pessoa) => pessoa.label === result.label
        );

        return {
          ...result,
          id: data.id,
          nome: data.nome,
          imgFolderName: data.imgFolderName,
          unidade: data.unidade,
          curso: data.curso,
          turno: data.turno,
          periodo: data.periodo,
          descricao: data.descricao,
        };
      });

      setAlunosDetectados(finalDetections);

      // faceapi.draw.drawDetections(canvas, resizedDetections);
      faceapi.draw.drawFaceLandmarks(canvas.current, resizedDetections);
      faceapi.draw.drawFaceExpressions(canvas.current, resizedDetections);
    }, 100);
  }

  async function startVideo() {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: false,
      });

      video.current.srcObject = stream;
      video.current.play();
    } catch (error) {
      // eslint-disable-next-line no-console
      console.error(`An error occurred: ${error}`);
    }
  }

  useEffect(() => {
    async function loadModelsAndPlayVideo() {
      await Promise.all([
        faceapi.nets.faceRecognitionNet.loadFromUri('/models'),
        faceapi.nets.faceLandmark68Net.loadFromUri('/models'),
        faceapi.nets.ssdMobilenetv1.loadFromUri('/models'),
        faceapi.nets.tinyFaceDetector.loadFromUri('/models'),
        faceapi.nets.faceExpressionNet.loadFromUri('/models'),
      ]);

      await startVideo();
    }

    loadModelsAndPlayVideo();
  }, []);

  return (
    <div className={styles.homePage}>
      <div className={styles.leftContent}>
        <div className={styles.leftContentWrapper}>
          <h1>Detecção facial</h1>
          <h2>Detectando aluno:</h2>
          <div ref={videoContainer} className={styles.videoContainer}>
            <video
              width={720}
              height={560}
              ref={video}
              id="video"
              muted
              onPlaying={handleVideoPlaying}
            />
            <canvas width={720} height={560} ref={canvas} />
          </div>
        </div>
      </div>

      <div className={styles.rightContent}>
        <div className={styles.rightContentWrapper}>
          <h2 className={styles.rightTitle}>Detectando agora:</h2>
          {alunosDetectados.length ? (
            alunosDetectados.map((aluno) => (
              <div key={aluno.id} className={styles.profile}>
                <div className={styles.profileWrapper}>
                  <Image
                    width={105}
                    height={105}
                    src={`/labeled_images/${aluno.imgFolderName}/profilePic.png`}
                    alt="rosto do aluno"
                  />
                  <div className={styles.profileInfo}>
                    <p className={styles.profileName}>{aluno.nome}</p>
                    <p>
                      {aluno.periodo}° Período - {aluno.curso} {aluno.turno}
                    </p>
                    <p>{aluno.unidade}</p>
                  </div>
                </div>
                <div className={styles.profileDesc}>{aluno.descricao}</div>
              </div>
            ))
          ) : (
            <p className={styles.zeroAlunos}>
              Ainda não foi detectado nenhum aluno...
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
