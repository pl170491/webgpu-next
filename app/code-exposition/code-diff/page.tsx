import Image from 'next/image';
import Link from 'next/link';
import githubDiff from './assets/github-diff.png';

const diff_match_patch = require('diff-match-patch');

interface DiffChunk {
  type: DiffType;
  lines: DiffLine[];
}

enum DiffType {
  Deletion = -1,
  Equality = 0,
  Insertion = 1,
}

type DiffLine = [number, string];

function diff_lineMode(text1: string, text2: string): [number, string][] {
  var dmp = new diff_match_patch();
  var a = dmp.diff_linesToChars_(text1, text2);
  var lineText1 = a.chars1;
  var lineText2 = a.chars2;
  var lineArray = a.lineArray;
  var diffs = dmp.diff_main(lineText1, lineText2, false);
  dmp.diff_charsToLines_(diffs, lineArray);
  return diffs;
}

function diffChunks(text1: string, text2: string) {
  const re = new RegExp('\r?\n');
  const diffChunks = diff_lineMode(text1, text2).map((diffChunk) => {
    return [diffChunk[0], diffChunk[1].split(re)];
  });

  console.log(diffChunks);
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

  diffChunks(beforeCode, afterCode);

  return <></>;
}
