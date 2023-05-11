// import Image from 'next/image';
// import { Inter } from 'next/font/google';

// const inter = Inter({ subsets: ['latin'] });

"use client";

import { useEffect, useRef } from "react";
import shaderWgsl from "./shaders/shader.wgsl";

export default function Home() {
  const gpuRef = useRef<GPUDevice | null>(null);

  useEffect(() => {
    console.log(shaderWgsl);
    const gpuInit = async () => {
      if (!navigator.gpu) {
        gpuRef.current = null;
        return;
      }

      const gpuAdapter = await navigator.gpu.requestAdapter();
      if (!gpuAdapter) {
        gpuRef.current = null;
        return;
      }

      const gpuDevice = await gpuAdapter.requestDevice();
      gpuRef.current = null;
    };
    gpuInit();
  }, []);

  async function handleClick() {
    console.log(gpuRef);
  }

  return <button onClick={handleClick}>Click me</button>;
}
