'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Index() {
  const basePath = usePathname();
  const relPath = (path: string) => basePath + '/' + path;

  return (
    <>
      <p>
        I&apos;ve recently taken an interest in trying to describe, in an
        expository way, some numerical analysis code that would be useful for
        physics applications. Here is an index of my efforts trying to write
        python code to solve the various examples and exercises found in John R.
        Taylor&apos;s <cite>Classical Mechanics</cite>.
      </p>
      <ul>
        <li>
          Chapter 1, Newton&apos;s Laws of Motion
          <ul>
            <li>
              <Link href={relPath('classical-mechanics/example-1-1')}>
                Example 1.1
              </Link>
            </li>
          </ul>
        </li>
      </ul>
    </>
  );
}
