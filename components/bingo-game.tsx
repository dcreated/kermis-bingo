"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import confetti from "canvas-confetti";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const BINGO_ITEMS = [
  ["Legging zonder rokje", "Vrouw met mannenstem (rookstem)", "Kleuter (m) met oorbel", "Crocs", "Pens onder shirt uit", "Ruzie", "Gouden ketting met naam"],
  ["Afval op de grond gooien", "Nektasje", "Matchende kleding", "'Hun' als onderwerp", "Krijsend kind", "Mobiel aan broekriem", "Zonnebank-bruin/oranje"],
  ["Tattoo in gezicht", "Hond met kleding", "Dronken", "Naam van 4 of meer lettergrepen", "Samenstelling met \"kanker\"", "String boven broek", "Tiet-tattoo"],
  ["Jongensnaam eindigend op een O", "Go Ahead Eagles-shirt", "Aandacht vragen met \"(H)ÉÉ\"", "Alleen het bovenlijf getraind (topheavy)", "Kermisjingle meezingen", "Te kort broekje voor zulke billen", "Meisjesnaam eindigend op een A"],
  ["Te dik persoon met snack", "Spugen op de grond", "Bierbuik in te strak hemdje", "Roken met kind op arm", "Tijger of panter-print", "Metallic-kleurige hond (pitbull)", "Voetbal-tenue"],
  ["Halve liter (eigen drank)", "Befhondje (< cavia)", "Haar-extensions", "Heuptasje", "Te strakke kleding (huidplooien over kleding)", "Obesitas-familie", "Aarsgewei"],
  ["Op de scooter", "Geen beha, wel nodig", "Pornohakken", "Naam van kind skeffen", "Naamtattoo", "Te oud kind in buggy", "Hond die gedragen wordt"],
  ["Matje", "Zwanger en rokend", "Bling-bling-kleding", "\"boksauto's\"", "Scootmobiel", "Buitenlands accent bij autochtoon", "Vlassig snorretje"],
  ["Tienermoeder", "Sokken in slippers", "Pens-piercing", "Cellulitis", "Trainingspak", "Te grote ronde oorbellen", "Minderjarig en rokend"],
];

const ROWS = 9;
const COLS = 7;

function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

type GameState = "start" | "playing" | "completed" | "ended";

interface CompletedLine {
  type: "row" | "col" | "diag";
  index: number;
  time: number;
}

export function BingoGame() {
  const [gameState, setGameState] = useState<GameState>("start");
  const [username, setUsername] = useState("");
  const [usernameInput, setUsernameInput] = useState("");
  const [checkedCells, setCheckedCells] = useState<boolean[][]>(
    Array(ROWS).fill(null).map(() => Array(COLS).fill(false))
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [completedLines, setCompletedLines] = useState<CompletedLine[]>([]);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [animatingLines, setAnimatingLines] = useState<Set<string>>(new Set());
  const [showFullCardAnimation, setShowFullCardAnimation] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const checkedCount = checkedCells.flat().filter(Boolean).length;
  const totalCells = ROWS * COLS;
  const remainingCount = totalCells - checkedCount;

  // Timer logic
  useEffect(() => {
    if (gameState === "playing") {
      timerRef.current = setInterval(() => {
        setElapsedTime((prev) => prev + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [gameState]);

  const triggerConfetti = useCallback(() => {
    confetti({
      particleCount: 100,
      spread: 70,
      origin: { y: 0.6 },
      colors: ["#22c55e", "#f59e0b", "#ec4899", "#3b82f6"],
    });
  }, []);

  const triggerFullCardConfetti = useCallback(() => {
    const duration = 3000;
    const animationEnd = Date.now() + duration;
    const defaults = { startVelocity: 30, spread: 360, ticks: 60, zIndex: 100 };

    const randomInRange = (min: number, max: number) => Math.random() * (max - min) + min;

    const interval = setInterval(() => {
      const timeLeft = animationEnd - Date.now();
      if (timeLeft <= 0) {
        clearInterval(interval);
        return;
      }
      const particleCount = 50 * (timeLeft / duration);
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.1, 0.3), y: Math.random() - 0.2 },
        colors: ["#22c55e", "#f59e0b", "#ec4899", "#3b82f6", "#8b5cf6"],
      });
      confetti({
        ...defaults,
        particleCount,
        origin: { x: randomInRange(0.7, 0.9), y: Math.random() - 0.2 },
        colors: ["#22c55e", "#f59e0b", "#ec4899", "#3b82f6", "#8b5cf6"],
      });
    }, 250);
  }, []);

  const checkForCompletedLines = useCallback(
    (cells: boolean[][], currentTime: number) => {
      const newCompletedLines: CompletedLine[] = [];
      const newAnimatingLines = new Set<string>();

      // Check rows
      for (let row = 0; row < ROWS; row++) {
        if (cells[row].every(Boolean)) {
          const lineKey = `row-${row}`;
          if (!completedLines.some((l) => l.type === "row" && l.index === row)) {
            newCompletedLines.push({ type: "row", index: row, time: currentTime });
            newAnimatingLines.add(lineKey);
          }
        }
      }

      // Check columns
      for (let col = 0; col < COLS; col++) {
        if (cells.every((row) => row[col])) {
          const lineKey = `col-${col}`;
          if (!completedLines.some((l) => l.type === "col" && l.index === col)) {
            newCompletedLines.push({ type: "col", index: col, time: currentTime });
            newAnimatingLines.add(lineKey);
          }
        }
      }

      // Check main diagonal (only if square or partial)
      const minDim = Math.min(ROWS, COLS);
      let mainDiagComplete = true;
      for (let i = 0; i < minDim; i++) {
        if (!cells[i][i]) {
          mainDiagComplete = false;
          break;
        }
      }
      if (mainDiagComplete && !completedLines.some((l) => l.type === "diag" && l.index === 0)) {
        newCompletedLines.push({ type: "diag", index: 0, time: currentTime });
        newAnimatingLines.add("diag-0");
      }

      // Check anti-diagonal
      let antiDiagComplete = true;
      for (let i = 0; i < minDim; i++) {
        if (!cells[i][COLS - 1 - i]) {
          antiDiagComplete = false;
          break;
        }
      }
      if (antiDiagComplete && !completedLines.some((l) => l.type === "diag" && l.index === 1)) {
        newCompletedLines.push({ type: "diag", index: 1, time: currentTime });
        newAnimatingLines.add("diag-1");
      }

      if (newCompletedLines.length > 0) {
        setCompletedLines((prev) => [...prev, ...newCompletedLines]);
        setAnimatingLines(newAnimatingLines);
        triggerConfetti();
        setTimeout(() => setAnimatingLines(new Set()), 2000);
      }

      // Check if full card is complete
      const allChecked = cells.flat().every(Boolean);
      if (allChecked) {
        setShowFullCardAnimation(true);
        setGameState("completed");
        triggerFullCardConfetti();
      }
    },
    [completedLines, triggerConfetti, triggerFullCardConfetti]
  );

  const toggleCell = (row: number, col: number) => {
    if (gameState !== "playing") return;

    const newCells = checkedCells.map((r, ri) =>
      r.map((c, ci) => (ri === row && ci === col ? !c : c))
    );
    setCheckedCells(newCells);
    checkForCompletedLines(newCells, elapsedTime);
  };

  const startGame = () => {
    if (usernameInput.trim()) {
      setUsername(usernameInput.trim());
      setGameState("playing");
    }
  };

  const resetGame = () => {
    setCheckedCells(Array(ROWS).fill(null).map(() => Array(COLS).fill(false)));
    setElapsedTime(0);
    setCompletedLines([]);
    setAnimatingLines(new Set());
    setShowFullCardAnimation(false);
    setShowResetConfirm(false);
    setGameState("start");
    setUsernameInput("");
    setUsername("");
  };

  const endGame = () => {
    setShowEndConfirm(false);
    setGameState("ended");
  };

  const isLineAnimating = (row: number, col: number): boolean => {
    if (animatingLines.has(`row-${row}`)) return true;
    if (animatingLines.has(`col-${col}`)) return true;
    const minDim = Math.min(ROWS, COLS);
    if (animatingLines.has("diag-0") && row === col && row < minDim) return true;
    if (animatingLines.has("diag-1") && col === COLS - 1 - row && row < minDim) return true;
    return false;
  };

  // Start screen
  if (gameState === "start") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur rounded-3xl p-8 shadow-2xl max-w-md w-full text-center">
          <div className="text-6xl mb-4">🎡🎢🎪</div>
          <h1 className="text-3xl font-bold text-orange-600 mb-2">Deventer Kermis</h1>
          <h2 className="text-2xl font-bold text-amber-600 mb-6">BINGO!</h2>
          <p className="text-gray-600 mb-6">
            Spot typische kermisgangers en vink ze af op je bingokaart!
          </p>
          <div className="space-y-4">
            <div className="text-left">
              <Label htmlFor="username" className="text-gray-700">
                Jouw naam
              </Label>
              <Input
                id="username"
                value={usernameInput}
                onChange={(e) => setUsernameInput(e.target.value)}
                placeholder="Voer je naam in..."
                className="mt-1 text-base"
                onKeyDown={(e) => e.key === "Enter" && startGame()}
              />
            </div>
            <Button
              onClick={startGame}
              disabled={!usernameInput.trim()}
              className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 text-base sm:py-6 sm:text-lg"
            >
              Start het spel! 🎯
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // Completed or Ended screen
  if (gameState === "completed" || gameState === "ended") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 flex items-center justify-center p-4">
        <div className="bg-white/95 backdrop-blur rounded-3xl p-8 shadow-2xl max-w-md w-full text-center">
          {gameState === "completed" ? (
            <>
              <div className="text-6xl mb-4">🎉🏆🎊</div>
              <h1 className="text-3xl font-bold text-green-600 mb-2">BINGO!</h1>
              <h2 className="text-xl text-gray-700 mb-6">
                Gefeliciteerd, <span className="font-bold text-orange-600">{username}</span>!
              </h2>
              <p className="text-gray-600 mb-4">Je hebt de hele kaart vol!</p>
            </>
          ) : (
            <>
              <div className="text-6xl mb-4">🎡</div>
              <h1 className="text-3xl font-bold text-orange-600 mb-2">Spel Beëindigd</h1>
              <h2 className="text-xl text-gray-700 mb-6">
                Bedankt voor het spelen, <span className="font-bold text-orange-600">{username}</span>!
              </h2>
            </>
          )}
          <div className="bg-gray-100 rounded-xl p-4 mb-6 space-y-2">
            <p className="text-lg">
              <span className="text-gray-600">Gespeelde tijd:</span>{" "}
              <span className="font-bold text-orange-600">{formatTime(elapsedTime)}</span>
            </p>
            <p className="text-lg">
              <span className="text-gray-600">Afgevinkt:</span>{" "}
              <span className="font-bold text-green-600">{checkedCount} / {totalCells}</span>
            </p>
            {completedLines.length > 0 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <p className="text-sm text-gray-500 mb-2">Voltooide rijen:</p>
                {completedLines.map((line, i) => (
                  <p key={i} className="text-sm">
                    {line.type === "row" && `Rij ${line.index + 1}`}
                    {line.type === "col" && `Kolom ${line.index + 1}`}
                    {line.type === "diag" && (line.index === 0 ? "Hoofddiagonaal" : "Anti-diagonaal")}
                    {" "}<span className="text-orange-600">@ {formatTime(line.time)}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
          <Button
            onClick={resetGame}
            className="w-full bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white font-bold py-4 text-base sm:py-6 sm:text-lg"
          >
            Opnieuw spelen 🔄
          </Button>
        </div>
      </div>
    );
  }

  // Playing screen
  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-400 via-orange-500 to-red-500 p-2 sm:p-4">
      {/* Header */}
      <div className="bg-white/90 backdrop-blur rounded-2xl p-3 sm:p-4 mb-3 shadow-lg">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-orange-600">🎡 Deventer Kermis Bingo</h1>
            <p className="text-sm text-gray-600">Speler: <span className="font-semibold">{username}</span></p>
          </div>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">Tijd</p>
              <p className="text-lg sm:text-xl font-mono font-bold text-orange-600">{formatTime(elapsedTime)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Score</p>
              <p className="text-lg sm:text-xl font-bold">
                <span className="text-green-600">{checkedCount}</span>
                <span className="text-gray-400">/</span>
                <span className="text-gray-600">{totalCells}</span>
              </p>
            </div>
          </div>
        </div>
        <div className="mt-2 flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowEndConfirm(true)}
            className="flex-1 text-xs sm:text-sm text-orange-600 border-orange-300 hover:bg-orange-50 px-2 py-1 h-auto"
          >
            Beëindig spel
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowResetConfirm(true)}
            className="flex-1 text-xs sm:text-sm text-red-600 border-red-300 hover:bg-red-50 px-2 py-1 h-auto"
          >
            Reset 🔄
          </Button>
        </div>
      </div>

      {/* Completed lines info */}
      {completedLines.length > 0 && (
        <div className="bg-green-100/90 backdrop-blur rounded-xl p-3 mb-3 shadow-lg">
          <p className="text-sm font-semibold text-green-700 mb-1">✅ Voltooide rijen:</p>
          <div className="flex flex-wrap gap-2">
            {completedLines.map((line, i) => (
              <span
                key={i}
                className="bg-green-200 text-green-800 text-xs px-2 py-1 rounded-full"
              >
                {line.type === "row" && `Rij ${line.index + 1}`}
                {line.type === "col" && `Kolom ${line.index + 1}`}
                {line.type === "diag" && (line.index === 0 ? "Diagonaal ↘" : "Diagonaal ↙")}
                {" "}@ {formatTime(line.time)}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Bingo Card */}
      <div className="bg-white/90 backdrop-blur rounded-2xl p-2 sm:p-3 shadow-lg overflow-x-auto">
        <div className="grid gap-1 sm:gap-1.5" style={{ gridTemplateColumns: `repeat(${COLS}, minmax(0, 1fr))` }}>
          {BINGO_ITEMS.map((row, rowIndex) =>
            row.map((item, colIndex) => {
              const isChecked = checkedCells[rowIndex][colIndex];
              const isAnimating = isLineAnimating(rowIndex, colIndex);
              return (
                <button
                  key={`${rowIndex}-${colIndex}`}
                  onClick={() => toggleCell(rowIndex, colIndex)}
                  className={`
                    relative aspect-square p-1 sm:p-2 rounded-lg text-[9px] sm:text-xs font-medium
                    transition-all duration-300 ease-out
                    flex items-center justify-center text-center
                    min-h-[60px] sm:min-h-[80px]
                    border-2
                    ${
                      isChecked
                        ? "bg-green-500 text-white border-green-600 shadow-[0_0_15px_rgba(34,197,94,0.6)]"
                        : "bg-white text-gray-700 border-gray-200 hover:border-orange-300 hover:bg-orange-50"
                    }
                    ${isAnimating ? "animate-pulse scale-105 shadow-[0_0_25px_rgba(34,197,94,0.8)]" : ""}
                    active:scale-95
                  `}
                >
                  <span className="leading-tight">{item}</span>
                  {isChecked && (
                    <span className="absolute top-0.5 right-0.5 text-base sm:text-lg">✓</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Stats bar */}
      <div className="mt-3 bg-white/90 backdrop-blur rounded-xl p-3 shadow-lg">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-600">
            Nog <span className="font-bold text-orange-600">{remainingCount}</span> te gaan
          </span>
          <div className="flex-1 mx-4 bg-gray-200 rounded-full h-3 overflow-hidden">
            <div
              className="bg-gradient-to-r from-green-400 to-green-600 h-full transition-all duration-500 ease-out"
              style={{ width: `${(checkedCount / totalCells) * 100}%` }}
            />
          </div>
          <span className="text-gray-600">
            <span className="font-bold text-green-600">{Math.round((checkedCount / totalCells) * 100)}%</span>
          </span>
        </div>
      </div>

      {/* Reset Confirmation Dialog */}
      <Dialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spel resetten?</DialogTitle>
            <DialogDescription>
              Weet je zeker dat je opnieuw wilt beginnen? Al je voortgang gaat verloren!
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowResetConfirm(false)}>
              Annuleren
            </Button>
            <Button variant="destructive" onClick={resetGame}>
              Ja, reset
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* End Game Confirmation Dialog */}
      <Dialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Spel beëindigen?</DialogTitle>
            <DialogDescription>
              Wil je het spel nu beëindigen? Je ziet dan je resultaten en kunt een nieuw spel starten.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setShowEndConfirm(false)}>
              Verder spelen
            </Button>
            <Button onClick={endGame} className="bg-orange-500 hover:bg-orange-600">
              Beëindig spel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
