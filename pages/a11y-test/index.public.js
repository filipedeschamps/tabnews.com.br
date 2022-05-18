import Image from 'next/image'
import { DefaultLayout } from 'pages/interface/index.js';

export default function Register() {
  return (
    <DefaultLayout containerWidth="small">
      <div>
        <Image src="/favicon.png" />
        {/* eslint-disable-next-line @next/next/no-img-element*/}
        <img src="/favicon.png" alt="picture" />

        <div>
          <button tabIndex="2">um</button>
          <button tabIndex="1">dois</button>
        </div>
      </div>
    </DefaultLayout>
  );
}
