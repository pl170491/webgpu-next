// import Image from 'next/image';
// import { Inter } from 'next/font/google';

// const inter = Inter({ subsets: ['latin'] });

"use client";

import { useEffect, useRef } from "react";

export default function Home() {
  const gpuRef = useRef<Promise<GPUDevice | null> | null>(null);

  useEffect(() => {
    const gpuInit = () => {
      if (!navigator.gpu) {
        gpuRef.current = null;
        return;
      }

      const gpuDevicePromise = navigator.gpu
        .requestAdapter()
        .then((adapter) => {
          if (!adapter) return null;
          else return adapter.requestDevice();
        })
        .catch((reason) => {
          console.log(reason);
          return null;
        });
      gpuRef.current = gpuDevicePromise;

      return async () => {
        if (!gpuRef.current) return;

        const gpuDevice = await gpuRef.current;
        if (!gpuDevice) return;

        gpuDevice.destroy();
      };
    };
    gpuInit();
  }, []);

  return <h1>Hello!</h1>;
}
