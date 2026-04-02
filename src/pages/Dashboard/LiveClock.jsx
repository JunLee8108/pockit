import { useState, useEffect } from "react";

const DAYS = ["일", "월", "화", "수", "목", "금", "토"];

const Digit = ({ char }) => (
  <span className="inline-flex items-center justify-center w-[22px] h-[28px] bg-light rounded-md text-[15px] font-semibold text-text font-mono">
    {char}
  </span>
);

const Colon = ({ blink }) => (
  <span
    className={`text-[15px] font-semibold font-mono mx-0.5 transition-opacity duration-300 ${
      blink ? "opacity-100 text-mint" : "opacity-30 text-sub"
    }`}
  >
    :
  </span>
);

const LiveClock = () => {
  const [now, setNow] = useState(new Date());
  const [blink, setBlink] = useState(true);

  useEffect(() => {
    const id = setInterval(() => {
      setNow(new Date());
      setBlink((b) => !b);
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const month = now.getMonth() + 1;
  const date = now.getDate();
  const day = DAYS[now.getDay()];

  const h = String(now.getHours()).padStart(2, "0");
  const m = String(now.getMinutes()).padStart(2, "0");
  const s = String(now.getSeconds()).padStart(2, "0");

  return (
    <div className="flex items-center gap-3">
      {/* Date */}
      <span className="text-[13px] text-sub hidden sm:inline">
        {month}월 {date}일 {day}요일
      </span>

      {/* Time */}
      <div className="flex items-center gap-[2px]">
        <Digit char={h[0]} />
        <Digit char={h[1]} />
        <Colon blink={blink} />
        <Digit char={m[0]} />
        <Digit char={m[1]} />
        <Colon blink={blink} />
        <Digit char={s[0]} />
        <Digit char={s[1]} />
      </div>
    </div>
  );
};

export default LiveClock;
