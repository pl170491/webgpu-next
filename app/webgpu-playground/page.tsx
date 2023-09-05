'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Index() {
  const basePath = usePathname();
  const relPath = (path: string) => basePath + '/' + path;

  return (
    <>
      <ul>
        <li>
          <Link href={relPath('sdf-graph')}>SDF Graph</Link>
        </li>
        <li>
          <Link href={relPath('vertex-line')}>Vertex Line</Link>
        </li>
        <li>
          <Link href={relPath('inclined-box')}>Inclined Box</Link>
        </li>
        <li>
          <Link href={relPath('line-graph')}>Line Graph</Link>
        </li>
        <li>
          <Link href={relPath('use-integrate')}>useIntegrate()</Link>
        </li>
        <li>
          <Link href={relPath('detect-gestures')}>Detect Gestures</Link>
        </li>
        <li>
          <Link href={relPath('non-aligned-bounding-rectangle')}>
            Non-Aligned Bounding Rectangle
          </Link>
        </li>
      </ul>
    </>
  );
}
