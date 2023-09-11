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

// [[beforeText's index, afterText's index], line]
type DiffLine = [[number, number], string];

function diff_lineMode(text1: string, text2: string): [number, string][] {
  var dmp = new diff_match_patch();
  var a = dmp.diff_linesToChars_(text1, text2);
  var lineText1 = a.chars1;
  var lineText2 = a.chars2;
  var lineArray = a.lineArray;
  var diffs = dmp.diff_main(lineText1, lineText2, false);
  dmp.diff_charsToLines_(diffs, lineArray);
  console.log(diffs);
  return diffs;
}

function diffChunks(text1: string, text2: string): DiffChunk[] {
  // Split chunk's string into an array of lines
  // with before and after indices set to dummy values
  const reLastEOL = /(\r\n|\n)$/;
  const reNotLastEOL = /(?:\r\n|\n)/; // match on CRLF or LF, except if followed by end of string
  // const re = /(?:\r\n|\n)/;
  let diffChunks: DiffChunk[] = diff_lineMode(text1, text2).map((diffChunk) => {
    const type: DiffType = diffChunk[0];
    const indexedLines: DiffLine[] = diffChunk[1]
      .replace(reLastEOL, '')
      .split(reNotLastEOL)
      .map((line, index) => [[index, index], line]);

    return { type: type, lines: indexedLines };
  });

  // Enumerate the lines with their respective line numbers
  // for the before and the after texts, dependent on the chunk's type
  let lineNumbers = [0, 0]; // [before, after]
  for (let chunk of diffChunks) {
    chunk.lines = chunk.lines.map((line) => {
      const beforeLineNumber = line[0][0];
      const afterLineNumber = line[0][1];

      switch (chunk.type) {
        case DiffType.Deletion: {
          return [[lineNumbers[0] + beforeLineNumber, NaN], line[1]];
          break;
        }
        case DiffType.Equality: {
          return [
            [
              lineNumbers[0] + beforeLineNumber,
              lineNumbers[1] + afterLineNumber,
            ],
            line[1],
          ];
          break;
        }
        case DiffType.Insertion: {
          return [[NaN, lineNumbers[1] + afterLineNumber], line[1]];
          break;
        }
      }
    });

    // Update the starting point of the next chunk's line numbers
    switch (chunk.type) {
      case DiffType.Deletion: {
        lineNumbers[0] = lineNumbers[0] + chunk.lines.length;
        break;
      }
      case DiffType.Equality: {
        lineNumbers[0] = lineNumbers[0] + chunk.lines.length;
        lineNumbers[1] = lineNumbers[1] + chunk.lines.length;
        break;
      }
      case DiffType.Insertion: {
        lineNumbers[1] = lineNumbers[1] + chunk.lines.length;
        break;
      }
    }
  }

  return diffChunks;
}

function codeDiff(text1: string, text2: string): JSX.Element {
  return <></>;
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

  console.log(JSON.stringify(diffChunks(beforeCode, afterCode), null, '  '));

  return <></>;
}
