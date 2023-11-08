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

      results.forEach((result, i) => {
        const { box } = resizedDetections[i].detection;
        const drawBox = new faceapi.draw.DrawBox(box, {
          label: result.toString(),
        });
        drawBox.draw(canvas.current);
      });

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
    <div className={`pageContainer ${styles.homePage}`}>
      <h1>Detecção facial</h1>
      <p>Detectando aluno...</p>
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
  );
}
