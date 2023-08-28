import { useRef, useState } from "preact/hooks";
const numbers = new Array(36).fill(0).map((_, i) => `${i + 1}`);
const slots = ["0", "00", ...numbers];

const shuffle = (arr: string[]) => {
  const shuffled = arr.slice();
  for (let i = shuffled.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    const temp = shuffled[i];
    shuffled[i] = shuffled[j];
    shuffled[j] = temp;
  }
  return shuffled;
};

const baseBets = [
  "even",
  "odd",
  "red",
  "black",
  "1 to 18",
  "19 to 36",
  "1st 12",
  "2nd 12",
  "3rd 12",
];

const generateBets = () => [...baseBets, ...slots];

const multipliers: Record<number, number> = {
  1: 35,
  2: 17,
  3: 11,
  4: 8,
  5: 6,
  6: 5,
};

type CurrentBet = {
  bets: Record<string, number>;
  value: number;
};

export function App() {
  const boardRef = useRef<string[]>(shuffle(slots));
  const board = boardRef.current;
  const betsRef = useRef<string[]>(generateBets());
  const bets = betsRef.current;
  const [currentBet, setCurrentBet] = useState<CurrentBet>({
    bets: {},
    value: 0,
  });
  const [wallet, setWallet] = useState(2000);
  const [boardState, setBoardState] = useState("READY");
  const [selectedSlot, setSelectedSlot] = useState("");
  const [message, setMessage] = useState("");

  const getColors = (slot: string) => {
    const isGreen = slot === "0" || slot === "00";
    const isRed = !isGreen && Number(slot) % 2 !== 0;
    const isBlack = !isGreen && !isRed;
    return { isRed, isBlack };
  };

  const incrementBetValue = (index: number) => {
    const bet = bets[index];
    setCurrentBet((prev) => {
      const newBets = { ...prev };
      if (newBets.bets[bet]) {
        newBets.bets[bet] += 10;
      } else {
        newBets.bets[bet] = 10;
      }
      newBets.value += 10;
      return newBets;
    });
    setWallet((prev) => prev - 10);
  };

  const decrementBetValue = (index: number) => {
    const bet = bets[index];
    setCurrentBet((prev) => {
      const newBets = { ...prev };
      if (newBets.bets[bet] > 0) {
        newBets.bets[bet] -= 10;
      }

      newBets.value -= 10;
      return newBets;
    });
    setWallet((prev) => prev + 10);
  };

  const calculateWin = (slot: string) => {
    let score = wallet;
    const numberedBets = Object.keys(currentBet.bets).filter(
      (k) => k !== "0" && k !== "00" && !isNaN(Number(k))
    );
    if (multipliers[numberedBets.length]) {
      if (numberedBets.includes(slot)) {
        const value = currentBet.bets[slot];
        score += value * multipliers[numberedBets.length];
      }
    }
    for (const bet in currentBet.bets) {
      const value = currentBet.bets[bet];
      const { isRed, isBlack } = getColors(slot);

      let numSlot = Number(slot);
      if (slot === "0" || slot === "00") {
        numSlot = NaN;
      }

      if (bet === "1st 12" && numSlot >= 1 && numSlot <= 12) {
        score += value * 2;
      }
      if (bet === "2nd 12" && numSlot >= 13 && numSlot <= 24) {
        score += value * 2;
      }
      if (bet === "3rd 12" && numSlot >= 25 && numSlot <= 36) {
        score += value * 2;
      }
      if ((bet === "red" && isRed) || (bet === "black" && isBlack)) {
        score += value;
      }
      if (
        (bet === "even" && numSlot % 2 === 0) ||
        (bet === "odd" && numSlot % 2 !== 0)
      ) {
        score += value;
      }

      if (bet === "1 to 18" && numSlot >= 1 && numSlot <= 18) {
        score += value;
      }
      if (bet === "19 to 36" && numSlot >= 19 && numSlot <= 36) {
        score += value;
      }
    }
    if (score > wallet) {
      setMessage(`Congrats. You won ${score - wallet}`);
    } else if (score === wallet) {
      setMessage("Sorry. No wins this time");
    }
    setWallet(score);
  };

  const spin = () => {
    if (currentBet.value === 0) {
      setMessage("Please place a bet before spinning");
      return;
    }
    setMessage("");
    setSelectedSlot("");
    setBoardState("SPINNING");
    const randomSlot = board[Math.floor(Math.random() * board.length)];
    setTimeout(() => {
      setSelectedSlot(randomSlot);
      calculateWin(randomSlot);
      setBoardState("WIN");
    }, 2000);
    setTimeout(() => {
      setBoardState("READY");
      setSelectedSlot("");
    }, 5000);
  };

  return (
    <div className="flex flex-col w-full bg-green-700 min-h-screen">
      <header>
        <h1 className="text-6xl text-center p-4 text-white font-bold">
          One More Roulette
        </h1>
      </header>
      <main className="flex flex-col w-full min-h-screen">
        <div className="flex flex-row p-4 font-bold text-4xl text-white gap-2 items-center justify-center">
          <p>Wallet: {wallet}</p>
          <p>Current bet: {currentBet.value}</p>
        </div>
        <button
          className="p-4 text-white bg-blue-400 rounded-lg w-1/2 self-center my-4 font-bold text-2xl"
          disabled={boardState === "SPINNING"}
          onClick={() => spin()}
        >
          Spin
        </button>

        <div className="flex items-center justify-center my-4 p-2">
          <div
            className="grid grid-rows-6 w-1/2 p-2"
            style={{ gridTemplateColumns: "repeat(6, 1fr)" }}
          >
            {board.map((slot, i) => {
              const { isRed, isBlack } = getColors(slot);
              const random = Math.random();
              return (
                <p
                  key={`slot-${i}`}
                  className={`${isRed ? "bg-red-500" : ""} ${
                    isBlack ? "bg-black" : ""
                  } ${selectedSlot === slot ? "animate-ping" : ""} ${
                    random < 0.6 && boardState === "SPINNING"
                      ? "animate-pulse"
                      : ""
                  } text-white p-4 border-2 border-white text-xl font-bold text-center`}
                >
                  {slot}
                </p>
              );
            })}
          </div>

          <div className="grid grid-cols-8 gap-2 my-4 p-4">
            {bets.map((bet, i) => {
              const value = currentBet?.bets?.[bet] || 0;
              return (
                <div
                  className="flex flex-col p-2 text-white text-center"
                  key={`bet-${i}`}
                >
                  <button
                    className="border-2 border-white p-2"
                    onClick={() => incrementBetValue(i)}
                    disabled={boardState === "SPINNING"}
                  >
                    {bet}
                  </button>
                  {value > 0 && (
                    <button
                      onClick={() => decrementBetValue(i)}
                      disabled={boardState === "SPINNING"}
                      className="my-2 bg-blue-300 text-white rounded-lg text-center"
                    >
                      {value}
                    </button>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        {boardState !== "READY" && message.length > 0 && (
          <p className="ml-auto mr-auto text-center p-2 animate-bounce duration-750 text-4xl text-white font-bold">
            {message}
          </p>
        )}
      </main>
    </div>
  );
}
