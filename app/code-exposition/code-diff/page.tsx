import Image from 'next/image';
import Link from 'next/link';
import githubDiff from './assets/github-diff.png';

const diff_match_patch = require('diff-match-patch');

function diff_lineMode(text1: String, text2: String): [number, string][] {
  var dmp = new diff_match_patch();
  var a = dmp.diff_linesToChars_(text1, text2);
  var lineText1 = a.chars1;
  var lineText2 = a.chars2;
  var lineArray = a.lineArray;
  var diffs = dmp.diff_main(lineText1, lineText2, false);
  dmp.diff_charsToLines_(diffs, lineArray);
  return diffs;
}

export default function Index() {
  const beforeCode = `<svg
  version='1.1'
  width='300'
  height='200'
  xmlns='http://www.w3.org/2000/svg'
>
  <rect width='100%' height='100%' fill='red' />

  <circle cx='150' cy='100' r='80' fill='green' />

  <text x='150' y='125' font-size='60' text-anchor='middle' fill='white'>
    SVG
  </text>
</svg>`;

  const afterCode = `<svg
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
</svg>`;
  console.log(diff_lineMode(beforeCode, afterCode));

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
        <li>
          Show code diffs as line diffs as opposed to character or word diffs
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
          Myer&apos;s original paper
        </Link>
        , but for our purposes we&apos;re simply going to use a library that
        implements the nitty-gritty of the diff algorithm. We&apos;ll be using
        Google&apos;s{' '}
        <Link href={'https://github.com/google/diff-match-patch'}>
          diff-match-patch
        </Link>{' '}
        javascript library for this.
      </p>
      <p>
        First, let&apos;s define the before and after codes. Since I initially
        started this effort to showcase the difference between certain SVG
        codes, I&apos;ll be using simple &quot;hello world&quot; SVGs:
      </p>
      <ol>
        <li>
          <strong>Before</strong>
          <code>
            <pre>{beforeCode}</pre>
          </code>
        </li>
        <li>
          <strong>After</strong>
          <code>
            <pre>{afterCode}</pre>
          </code>
        </li>
      </ol>
      <p>
        Can you spot the difference? It&apos;s in the text tag&apos;s attributes
        list for font-size and text-anchor. In case you&apos;re wondering, one
        works as a standalone SVG file and the other works for inline JSX
        elements. We&apos;ll assign the &quot;before code&quot; and the
        &quot;after code&quot; to two variables named <code>beforeCode</code>{' '}
        and <code>afterCode</code>, respectively, to help test our functions.
      </p>
      <p>
        Looking through diff-match-patch&apos;s documentation, I found this{' '}
        <Link
          href={
            'https://github.com/google/diff-match-patch/wiki/Line-or-Word-Diffs'
          }
        >
          convenient wiki article
        </Link>{' '}
        detailing a diff_lineMode function. Implementing this as a typescript
        function we get the following code:
      </p>
      <code>
        <pre>{`const diff_match_patch = require('diff-match-patch');

function diff_lineMode(text1: String, text2: String): any {
  var dmp = new diff_match_patch();
  var a = dmp.diff_linesToChars_(text1, text2);
  var lineText1 = a.chars1;
  var lineText2 = a.chars2;
  var lineArray = a.lineArray;
  var diffs = dmp.diff_main(lineText1, lineText2, false);
  dmp.diff_charsToLines_(diffs, lineArray);
  return diffs;
}`}</pre>
      </code>
      <p>
        I wasn&apos;t sure what the return type was going to be, so I simply
        left it as <code>any</code> for now. Let&apos;s see what it returns us
        when we call <code>diff_lineMode(beforeCode, afterCode)</code>:
      </p>
      <samp>
        <pre>
          {JSON.stringify(diff_lineMode(beforeCode, afterCode), null, 2)}
        </pre>
      </samp>
    </>
  );
}
