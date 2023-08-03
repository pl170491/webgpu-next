'use client';

import { useState, useCallback, useEffect } from 'react';
import { useGpuDevice } from './gpuUtils';
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
  const gpuDevice = useGpuDevice();

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
