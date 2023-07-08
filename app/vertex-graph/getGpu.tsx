export default function getGpu(setGpuDevice: Function) {
  if (!navigator.gpu) {
    setGpuDevice(null);
    return () => {
      return;
    };
  }

  const getGpuFail = () => {
    setGpuDevice(null);
    return null;
  };

  const gpuDevicePromise = navigator.gpu
    .requestAdapter()
    .then((value) => {
      if (!value) {
        return getGpuFail();
      }
      const gpuAdapter = value;
      return gpuAdapter.requestDevice();
    })
    .then((value) => {
      if (!value) {
        return getGpuFail();
      }
      const gpuDevice = value;
      setGpuDevice(gpuDevice);
      return gpuDevice;
    })
    .catch((reason) => {
      console.log("Couldn't create gpu device: " + reason);
      return getGpuFail();
    });

  return () => {
    const currentGpuDevice = gpuDevicePromise;
    const destroyGpuDevice = async () => {
      const gpuDevice = await currentGpuDevice;
      if (!gpuDevice) {
        return;
      }
      gpuDevice.destroy();
    };
    destroyGpuDevice();
    setGpuDevice(undefined); // assumes we are retrying
  };
}
