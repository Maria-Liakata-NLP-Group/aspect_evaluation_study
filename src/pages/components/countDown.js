import {useState, useEffect} from 'react';

const formatSecondsToMinutes = (seconds) => {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;

  // Pad the minutes and seconds with leading zeros if needed
  const formattedMinutes = String(minutes).padStart(2, "0");
  const formattedSeconds = String(remainingSeconds).padStart(2, "0");

  return `${formattedMinutes}:${formattedSeconds}`;
}

const CountDown = ({ duration, handleCountDownComplete, text }) => {
  const [seconds, setSeconds] = useState(duration);

  useEffect(() => {
    if (seconds <= 0) {
      handleCountDownComplete();
    }
    const interval = setInterval(() => {
      setSeconds(Math.max(seconds - 1, 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [seconds, handleCountDownComplete]);

  return (
    <h3 className="subtitle">
      {formatSecondsToMinutes(seconds)} {text}
    </h3>
  );
};

export default CountDown;