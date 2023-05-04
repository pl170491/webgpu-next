// import Image from 'next/image';
// import { Inter } from 'next/font/google';

// const inter = Inter({ subsets: ['latin'] });

'use client';

import { useEffect, useRef } from 'react';

export default function Home() {
  const gpuRef = useRef(null);

  useEffect(() => {
    const gpuDevice = global.navigator.gpu;
  });
  return <h1>Hello!</h1>;
}
