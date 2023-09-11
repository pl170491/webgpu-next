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

  const re = new RegExp('\r?\n');
  const diffLines = diff_lineMode(beforeCode, afterCode).map((diffChunk) => {
    return [diffChunk[0], diffChunk[1].split(re)];
  });

  console.log(diffLines);

  return <></>;
}
