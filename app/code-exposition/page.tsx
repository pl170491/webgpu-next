import Link from 'next/link';

export default function Index() {
  return (
    <>
      <p>
        Here is located the various tools and helper functions I&apos;ll be
        developing to help in my effort to beautify and streamline code
        exposition. It is somewhat meta to try to explain code-exposition code
        without having the proper code-exposition tools, so the articles may
        seem janky.
      </p>
      <ul>
        <li>
          <Link href={'code-exposition/code-diff'}>Code Diff</Link>
        </li>
      </ul>
    </>
  );
}
