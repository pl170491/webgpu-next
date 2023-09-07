'use client';

import Link from 'next/link';

export default function Index() {
  return (
    <>
      <h1>Alareti</h1>
      <h2>Introduction</h2>
      <p>
        Welcome to Alareti, home to the proving ground of my various
        experimental projects and half-baked ideas. It is an informal place, as
        evidenced by my first person sentences, and one can expect most content
        found here to have a sort of <i>stream of consciousness</i> spirit
        attached to it. It is not (yet) a very beautiful place, but hopefully
        with time a garden of sorts will spring up from what soil I lay down,
        and it will be agreeable to those who chance to come. In the meantime, I
        encourage you to explore whatever may strike your interest which resides
        here, and to please excuse whatever messiness you may encounter.
      </p>
      <p>On graphics, both of SVG and WebGPU.</p>
      <p>On the Exposition of Code.</p>
      <p>On numerical analysis as applied to physics.</p>
      <h2>Table of Contents</h2>
      <ul>
        <li>
          <Link href='graphics/webgpu-playground'>WebGPU Playground</Link>
        </li>
        <li>
          <Link href='graphics/svg-playground'>SVG Playground</Link>
        </li>
        <li>
          <Link href='numerical-analysis'>Numerical Analysis</Link>
        </li>
      </ul>
    </>
  );
}
