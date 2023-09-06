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
      <p>
        One interest of mine is exploring the various aspects of WebGPU which,
        as the <cite>W3C</cite> puts it,{' '}
        <q cite='https://www.w3.org/TR/webgpu/#intro'>
          is an API that exposes the capabilities of GPU hardware for the Web.
        </q>
        So far, the focus has been exclusively set upon the graphical aspect of
        this GPU library, but in the future I&apos;d like to explore its
        potential for computational science through the use of compute shaders.
        The various toy programs I&apos;ve created for messing around with
        WebGPU can be found in a section of the site entitled{' '}
        <q>
          <Link href='webgpu-playground'>WebGPU Playground</Link>
        </q>
        .
      </p>
      <p>On the Exposition of Code.</p>
      <h2>Table of Contents</h2>
      <ul>
        <li>
          <Link href='webgpu-playground'>WebGPU Playground</Link>
        </li>
      </ul>
    </>
  );
}
