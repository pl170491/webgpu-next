'use client';

import Link from 'next/link';

export default function App() {
  return (
    <>
      <ul>
        <li>
          <Link href='/sdf-graph'>SDF Graph</Link>
        </li>
        <li>
          <Link href='/vertex-line'>Vertex Line</Link>
        </li>
        <li>
          <Link href='/inclined-box'>Inclined Box</Link>
        </li>
        <li>
          <Link href='/line-graph'>Line Graph</Link>
        </li>
        <li>
          <Link href='/detect-gestures'>Detect Gestures</Link>
        </li>
        <li>
          <Link href='/use-integrate'>useIntegrate()</Link>
        </li>
        <li>
          <Link href='/integrate-gestures'>Remember Gestures</Link>
        </li>
      </ul>
    </>
  );
}
