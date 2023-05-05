// import React from 'react';
// import logo from './logo.svg';
import { useCallback, useEffect, useRef } from 'react';
import './App.css';

const App = () => {
  const handleGpuInit = useCallback(() => {
    console.log("Calling handleGpuInit");
    console.log("Hey");
  }, []);

  const canvas = useRef<HTMLCanvasElement>(null);

  handleGpuInit();

  return (
    <canvas ref={canvas} width='800' height= '600'></canvas>
  );
}

export default App;
