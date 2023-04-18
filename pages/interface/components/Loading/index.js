import { AiOutlineLoading } from 'react-icons/ai';

export default function Loadind() {
  return (
    <>
      <div className="spinner-icon">
        <AiOutlineLoading />
      </div>
      <style jsx global>{`
        .spinner-icon {
          width: 20px;
          height: 20px;
          box-sizing: border-box;
          color: #fff;
          border: solid 2px transparent;
          border-radius: 50%;
          -webkit-animation: nprogresss-spinner 400ms linear infinite;
          animation: nprogress-spinner 400ms linear infinite;
        }
        @-webkit-keyframes nprogress-spinner {
          0% {
            -webkit-transform: rotate(0deg);
          }
          100% {
            -webkit-transform: rotate(360deg);
          }
        }
        @keyframes nprogress-spinner {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
