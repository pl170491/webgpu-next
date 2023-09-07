import Link from 'next/link';

export default function Index() {
  return (
    <>
      <p>
        The intent is to create a graphic similar in spirit to Figure 1.9 of{' '}
        <cite>Classical Mechanics</cite> by John R. Taylor. Something similar
        can be viewed{' '}
        <Link href={'https://physicstasks.eu/509/a-box-on-an-inclined-plane'}>
          here
        </Link>
        , except mirrored. My first attempt will be to manually use SVG tags
        embedded in HTML to accomplish my goal. Hopefully we can get a feel for
        the API and develop some helper functions along the way.
      </p>
      <p></p>
    </>
  );
}
