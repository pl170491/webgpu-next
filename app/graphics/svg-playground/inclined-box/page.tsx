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
      <p>
        I think first we should simply try to make a normal, upright, cartesian
        2D axis plot. We&apos;re going to start off{' '}
        <Link
          href={
            'https://developer.mozilla.org/en-US/docs/Web/SVG/Tutorial/Getting_Started#a_simple_example'
          }
        >
          MDN&apos;s simple example
        </Link>{' '}
        and alter it for our needs.
      </p>

      <code>
        <pre>
          {`<svg
  version='1.1'
  width='300'
  height='200'
  xmlns='http://www.w3.org/2000/svg'
>
  <rect width='100%' height='100%' fill='red' />

  <circle cx='150' cy='100' r='80' fill='green' />

  <text
    x='150'
    y='125'
    font-size='60'
    text-anchor='middle'
    fill='white'
  >
    SVG
  </text>
</svg>`}
        </pre>
      </code>

      <svg
        version='1.1'
        width='300'
        height='200'
        xmlns='http://www.w3.org/2000/svg'
      >
        <rect width='100%' height='100%' fill='red' />

        <circle cx='150' cy='100' r='80' fill='green' />

        <text x='150' y='125' fontSize='60' textAnchor='middle' fill='white'>
          SVG
        </text>
      </svg>

      <p>
        I&apos;m doing this directly in React is inline tags, and apparently it
        doesn&apos;t like the <q>font-size</q> and <q>text-anchor</q>{' '}
        attributes. Let&apos;s fix that.
      </p>

      <code>
        <pre>
          {`
  <text
    x='150'
    y='125'
    fontSize='60'
    textAnchor='middle'
    fill='white'
  >
`}
        </pre>
      </code>
    </>
  );
}
