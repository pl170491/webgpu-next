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
          <Link href={relPath('undocumented')}>Raw App</Link>
        </li>
        <li>
          <Link href={relPath('literary')}>Literary App</Link>
        </li>
      </ul>
    </>
  );
}
