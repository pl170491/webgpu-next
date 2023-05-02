// import Image from 'next/image';
// import { Inter } from 'next/font/google';

// const inter = Inter({ subsets: ['latin'] });

function Main({ hello }: { hello: boolean }) {
  if (hello) {
    return <main>Hello, world!</main>;
  } else {
    return <main>Goodbye, world!</main>;
  }
}

export default function Home() {
  return <Main hello={false} />;
}
