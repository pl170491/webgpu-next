'use client';

import { useState, useCallback, useEffect } from 'react';
import { getGpu } from './gpuUtils';
import { PerspectiveCanvas } from './perspectiveCanvas';
import { GlobalCanvas } from './globalCanvas';

function GpuDeviceFail() {
  return (
    <p>
      Couldn&apos;t create a WebGPU device. If refreshing the page does not
      work, then please use a browser that supports WebGPU.
    </p>
  );
}

function GpuDevicePending() {
  return <></>;
}

export default function Index() {
  // Undefined means that it is in the process of getting a GPU.
  // Null means that it failed to get a GPU
  const [gpuDevice, setGpuDevice] = useState<GPUDevice | null | undefined>(
    undefined
  );

  // Get GPU Device
  const getGpuCallback = useCallback(() => {
    return getGpu(setGpuDevice);
  }, []);
  useEffect(() => {
    return getGpuCallback();
  }, [getGpuCallback]);

  if (gpuDevice === undefined) return <GpuDevicePending></GpuDevicePending>;
  else if (gpuDevice === null) return <GpuDeviceFail></GpuDeviceFail>;
  else
    return (
      <>
        <PerspectiveCanvas gpuDevice={gpuDevice}></PerspectiveCanvas>
        <GlobalCanvas gpuDevice={gpuDevice}></GlobalCanvas>
      </>
    );
}
