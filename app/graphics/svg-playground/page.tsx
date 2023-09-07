import Link from 'next/link';

export default function Index() {
  return (
    <>
      <p>
        Here you will find my attempts at making SVG graphics through code.
        Hopefully I&apos;ll be able to keep to a friendly exposition style as
        opposed to just dumping code.
      </p>
      <ul>
        <li>
          <Link href={'/graphics/svg-playground/inclined-box'}>
            Inclined Box
          </Link>
        </li>
      </ul>
    </>
  );
}
