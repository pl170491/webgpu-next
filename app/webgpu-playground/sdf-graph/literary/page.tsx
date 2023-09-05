'use client';

import { useMemo } from 'react';
import { mdnGpu, shaders } from './lib/mdn_webgpu_boilerplate';

export default function Index() {
  const mdnGpuSourceString = useMemo(() => mdnGpu.toString(), []);

  return (
    <>
      <p>
        This is the start of a lengthy process of converting my toy WebGPU apps
        into a <a href='/literary-development'>literary style</a>.
        Unfortunately, I didn&apos;t keep a very well documented catalog of the
        interesting errors I encountered along the way of creating this toy app,
        but I will do my best to explain why things are the way they are. Along
        the way, perhaps some new tools to help further literary efforts more
        streamlined will be contrived.
      </p>
      <p>
        First, some background. I had been reading{' '}
        <cite>
          <a href='https://thebookofshaders.com/'>The Book of Shaders</a>
        </cite>{' '}
        and a variety of Inigo Quilez&apos;s{' '}
        <a href='https://iquilezles.org/articles/'>articles</a>, which both
        discuessed signed distance functions as interesting ways to implement 2D
        graphics shaders. Also, I&apos;d recently acquiesced to using React as
        opposed to implementing my own half-baked component library using{' '}
        <a href='https://developer.mozilla.org/en-US/docs/Web/API/Web_components'>
          HTML Web Components
        </a>
        , which is why you see an interesting mix of the two (i.e. React and
        WebGPU) in these toy apps. It was a way, so I thought and still do, to
        hone my skills at both libraries.
      </p>
      <p>
        As such, I thought it would be interesting to make a graphical plot of
        some single-variable function using signed distance functions, and I was
        pleasantly surprised to find that a WebGL implementation had been
        created in <cite>The Book of Shaders</cite>,{' '}
        <a href='https://thebookofshaders.com/05/'>Chapter 5</a>. I consulted
        <a href='https://developer.mozilla.org/en-US/docs/Web/API/WebGPU_API'>
          MDN&apos;s introduction to WebGPU
        </a>{' '}
        to acquire the necessary boilerplate code, and went to work copying,
        pasting, and converting to Typescript:
      </p>
      <br />
      <code>
        <pre>{mdnGpuSourceString}</pre>
      </code>
    </>
  );
}
