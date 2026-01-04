import Image from "next/image";

import Star2 from "@/assets/images/pattern-star-2.svg";

type Props = { isNewRecord?: boolean; isInvalid?: boolean };

export const ResultHeader = ({
  isNewRecord = false,
  isInvalid = false,
}: Props) => {
  return (
    <header className="relative flex items-center justify-center">
      {isNewRecord ? (
        <NewRecordIcon />
      ) : (
        <div className="grid place-items-center">
          <Image
            src={Star2}
            alt="Star Pattern"
            className="absolute left-0 -z-10 max-md:size-5 xl:top-full"
          />
          <CompletedIcon isInvalid={isInvalid} />
        </div>
      )}
    </header>
  );
};

const CompletedIcon = ({ isInvalid }: { isInvalid: boolean }) => {
  return (
    <div className="relative flex items-center justify-center">
      <div
        className={`animate-ring-pulse absolute size-24 rounded-full md:size-28 ${isInvalid ? "bg-red/10" : "bg-green/10"}`}
        style={{ animationDelay: "0.1s" }}
      />
      <div
        className={`animate-ring-pulse absolute size-19 rounded-full md:size-20 ${isInvalid ? "bg-red/20" : "bg-green/20"}`}
        style={{ animationDelay: "0.3s" }}
      />

      <div
        className={`relative z-10 flex size-14 items-center justify-center rounded-full ${isInvalid ? "bg-red" : "bg-green"}`}
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="40"
          height="40"
          fill="none"
          viewBox="0 0 64 64"
        >
          {isInvalid ? (
            <>
              <path
                stroke="#121212"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="100"
                strokeDashoffset="100"
                className="animate-check-draw"
                d="M18 18l28 28"
              />
              <path
                stroke="#121212"
                strokeWidth="7"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeDasharray="100"
                strokeDashoffset="100"
                className="animate-check-draw"
                style={{ animationDelay: "0.6s" }}
                d="M46 18L18 46"
              />
            </>
          ) : (
            <path
              stroke="#121212"
              strokeWidth="7"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeDasharray="100"
              strokeDashoffset="100"
              className="animate-check-draw"
              d="M16 34l10 10 22-22"
            />
          )}
        </svg>
      </div>
    </div>
  );
};

const NewRecordIcon = () => {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="80"
      height="80"
      fill="none"
      viewBox="0 0 80 80"
    >
      <path
        stroke="#f4dc73"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        clipRule="evenodd"
        d="M29.579 58.003c2.938 2.744 11.607-1.77 19.365-10.08 7.755-8.309 11.663-17.267 8.725-20.01s-11.611 1.77-19.366 10.08c-7.758 8.309-11.663 17.267-8.724 20.01"
      />
      <path
        stroke="#f4dc73"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10.696 22.917h.078m8.927 34.19h.078M58.176 28.568l11.712 36.778c.545 1.719-1.019 3.367-2.767 2.91l-36.444-9.591"
      />
      <path
        stroke="#f4dc73"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M51.21 64.064c2.414-1.739 4.924-3.99 7.337-6.561 2.54-2.738 4.664-5.537 6.273-8.141M21.49 46.937S15.32 46.46 10 52.207"
      />
      <path
        stroke="#f4dc73"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M31.908 19.9a3.952 3.952 0 1 1-7.904.004 3.952 3.952 0 0 1 7.904-.003"
      />
      <path
        stroke="#f4dc73"
        strokeWidth="5"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M42.438 42.269s-10.82-11.163-27.392-6.444M46.17 11.667s-6.266 8.578.674 18.892"
      />
    </svg>
  );
};
