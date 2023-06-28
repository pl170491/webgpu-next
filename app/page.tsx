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
          <Link href='/vertex-graph'>Vertex Graph</Link>
        </li>
      </ul>
    </>
  );
}
