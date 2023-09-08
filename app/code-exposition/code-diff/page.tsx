import Image from 'next/image';
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
        to maintain the following elements.
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
    </>
  );
}
