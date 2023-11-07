'use client';

import * as faceapi from 'face-api.js';
import { useEffect, useRef } from 'react';
import styles from './page.module.css';

function loadLabeledImages() {
  const labels = [
    'Black Widow',
    'Captain America',
    'Captain Marvel',
    'Hawkeye',
    'Jim Rhodes',
    'Thor',
    'Tony Stark',
    'Rodrigo',
    'Lucas',
  ];

  return Promise.all(
    labels.map(async (label) => {
      const descriptions = [];

      for (let i = 1; i <= 2; i++) {
        const img = await faceapi.fetchImage(
          `/labeled_images/${label}/${i}.jpg`
        );

        const detections = await faceapi
          .detectSingleFace(img)
          .withFaceLandmarks()
          .withFaceDescriptor();

        descriptions.push(detections.descriptor);
      }

      return new faceapi.LabeledFaceDescriptors(label, descriptions);
    })
  );
}

export default function Home() {
  const video = useRef(null);

  function handleVideoPlaying() {}

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
    <div className={`pageContainer ${styles.homePage}`}>
      <h1>Detecção facial</h1>
      <p>Detectando aluno...</p>
      <div className={styles.videoContainer}>
        <video
          ref={video}
          id="video"
          muted
          onPlaying={handleVideoPlaying}
        ></video>
      </div>
    </div>
  );
}
