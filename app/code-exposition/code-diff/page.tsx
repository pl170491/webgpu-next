import Image from 'next/image';
import Link from 'next/link';
import githubDiff from './assets/github-diff.png';

export default function Index() {
  return (
    <>
      <h1>Code Diff React Component</h1>
      <p>
        First thing&apos;s first - state the intent. I want to have a Github
        style code diff box that is able to show the reader what the difference
        between two blocks of code might be (Figure 1). I&apos;m not going to
        focus on highlighting the code text red or green for now, but I do wish
        to maintain the following elements. We&apos;re going to show code diffs
        as line diffs as opposed to character or word diffs.
      </p>
      <ul>
        <li>Show line numbers on the lift of what has changed</li>
        <li>
          Show the lines which have changed in a unified way (i.e. top to
          bottom)
        </li>
        <li>
          Prefix the lines with &apos;+&apos; or &apos;-&apos; accordingly
        </li>
      </ul>
      <figure>
        <Image src={githubDiff} alt='Image of how code diffs look in Github' />
        <figcaption>Figure 1.&emsp;Example of a Github code diff</figcaption>
      </figure>
      <p>
        For background, there is a{' '}
        <Link href='https://medium.com/@gabrielschade/how-git-diff-works-a-sample-with-f-af3e3737963'>
          cool article
        </Link>{' '}
        which gives an introduction to the topic, and for a thorough explanation
        you can consult{' '}
        <Link href={'https://neil.fraser.name/writing/diff/myers.pdf'}>
          Myer&apos;s original article
        </Link>
        , but for our purposes we&apos;re simply going to use a library to
        accomplish the nitty-gritty of implementing the diff algorithm.
        We&apos;ll be using Google&apos;s{' '}
        <Link href={'https://github.com/google/diff-match-patch'}>
          diff-match-patch
        </Link>{' '}
        javascript library for this.
      </p>
    </>
  );
}
