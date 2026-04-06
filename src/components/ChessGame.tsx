import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Chess, type Move as ChessJsMove, type Square } from 'chess.js';
import { Chessground } from '@lichess-org/chessground';
import type { Api as ChessgroundApi } from '@lichess-org/chessground/api';
import type { Config as ChessgroundConfig } from '@lichess-org/chessground/config';
import type { Color as ChessgroundColor, Dests, Key } from '@lichess-org/chessground/types';
import '@lichess-org/chessground/assets/chessground.base.css';
import '@lichess-org/chessground/assets/chessground.brown.css';
import '@lichess-org/chessground/assets/chessground.cburnett.css';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { useRateLimit } from '@/hooks/useRateLimit';
import { Crown, Sword } from 'lucide-react';

interface ChessGameProps {
  warId: string;
  userPlayerSide: 'white' | 'black' | null;
  onGameEnd: (winnerId: string) => void;
}

type PlayerColor = 'white' | 'black';
type GameStatus = 'playing' | 'checkmate' | 'stalemate' | 'draw' | 'timeout';

interface PersistedBoardState {
  fen: string;
  lastMove?: [Square, Square] | null;
  pgn?: string;
}

interface LegacyChessPiece {
  type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
  color: PlayerColor;
}

interface LegacyChessSquare {
  piece: LegacyChessPiece | null;
}

interface ChessMoveRow {
  id: string;
  move_number: number;
  player_color: PlayerColor;
  from_row: number;
  from_col: number;
  to_row: number;
  to_col: number;
  piece_type: string;
  captured_piece: string | null;
  board_state: unknown;
  special_move?: string | null;
}

const INITIAL_FEN = new Chess().fen();
const PIECE_TYPE_BY_SYMBOL: Record<string, string> = {
  p: 'pawn',
  n: 'knight',
  b: 'bishop',
  r: 'rook',
  q: 'queen',
  k: 'king',
};
const FILES = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] as const;

const toPlayerColor = (turn: 'w' | 'b'): PlayerColor => (turn === 'w' ? 'white' : 'black');

const toChessgroundColor = (color: PlayerColor | null | undefined): ChessgroundColor | undefined => {
  if (color === 'white' || color === 'black') {
    return color;
  }

  return undefined;
};

const squareToCoords = (square: Square) => {
  return {
    row: 8 - Number.parseInt(square[1], 10),
    col: square.charCodeAt(0) - 97,
  };
};

const coordsToSquare = (row: number, col: number): Square => `${FILES[col]}${8 - row}` as Square;

const normalizeStoredFen = (fen: string) => {
  const trimmedFen = fen.trim();
  return trimmedFen.includes(' ') ? trimmedFen : `${trimmedFen} w - - 0 1`;
};

const isPersistedBoardState = (value: unknown): value is PersistedBoardState => {
  return typeof value === 'object' && value !== null && 'fen' in value && typeof (value as PersistedBoardState).fen === 'string';
};

const isLegacyBoardState = (value: unknown): value is LegacyChessSquare[][] => Array.isArray(value) && value.every(row => Array.isArray(row));

const legacyBoardToFen = (legacyBoard: LegacyChessSquare[][]) => {
  const rows = legacyBoard.map(row => {
    let fenRow = '';
    let emptyCount = 0;

    row.forEach(square => {
      const piece = square?.piece;

      if (!piece) {
        emptyCount += 1;
        return;
      }

      if (emptyCount > 0) {
        fenRow += String(emptyCount);
        emptyCount = 0;
      }

      const symbol = piece.type === 'knight' ? 'n' : piece.type[0];
      fenRow += piece.color === 'white' ? symbol.toUpperCase() : symbol;
    });

    if (emptyCount > 0) {
      fenRow += String(emptyCount);
    }

    return fenRow || '8';
  });

  return `${rows.join('/')} w - - 0 1`;
};

const readBoardState = (boardState: unknown): PersistedBoardState => {
  if (isPersistedBoardState(boardState)) {
    return {
      ...boardState,
      fen: normalizeStoredFen(boardState.fen),
    };
  }

  if (isLegacyBoardState(boardState)) {
    return {
      fen: legacyBoardToFen(boardState),
      lastMove: null,
    };
  }

  return {
    fen: INITIAL_FEN,
    lastMove: null,
  };
};

const getGameStatusFromChess = (game: Chess): GameStatus => {
  if (game.isCheckmate()) {
    return 'checkmate';
  }

  if (game.isStalemate()) {
    return 'stalemate';
  }

  if (game.isDraw()) {
    return 'draw';
  }

  return 'playing';
};

const getResultMessage = (status: Exclude<GameStatus, 'playing'>, winner: PlayerColor | null) => {
  if (status === 'checkmate' && winner) {
    return `Checkmate! ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`;
  }

  if (status === 'timeout' && winner) {
    return `${winner.charAt(0).toUpperCase() + winner.slice(1)} wins on time!`;
  }

  if (status === 'stalemate') {
    return 'Stalemate! The game is a draw.';
  }

  return 'The game ended in a draw.';
};

const ChessGame: React.FC<ChessGameProps> = ({ warId, userPlayerSide, onGameEnd }) => {
  const { toast } = useToast();
  const isMobile = useIsMobile();
  const { checkRateLimit } = useRateLimit();

  const boardElementRef = useRef<HTMLDivElement>(null);
  const chessgroundRef = useRef<ChessgroundApi | null>(null);
  const chessRef = useRef(new Chess());
  const moveNumberRef = useRef(0);
  const timerIntervalRef = useRef<ReturnType<typeof window.setInterval> | null>(null);

  const [fen, setFen] = useState(INITIAL_FEN);
  const [currentPlayer, setCurrentPlayer] = useState<PlayerColor>('white');
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [winner, setWinner] = useState<PlayerColor | null>(null);
  const [moveNumber, setMoveNumber] = useState(0);
  const [lastMove, setLastMove] = useState<[Square, Square] | null>(null);
  const [whiteTimeRemaining, setWhiteTimeRemaining] = useState(300);
  const [blackTimeRemaining, setBlackTimeRemaining] = useState(300);
  const [chessGameId, setChessGameId] = useState<string | null>(null);

  const isMyTurn = userPlayerSide !== null && currentPlayer === userPlayerSide && gameStatus === 'playing';

  useEffect(() => {
    moveNumberRef.current = moveNumber;
  }, [moveNumber]);

  const stopTimer = useCallback(() => {
    if (timerIntervalRef.current !== null) {
      window.clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  }, []);

  const buildBoardState = useCallback((game: Chess, move: [Square, Square] | null): PersistedBoardState => {
    return {
      fen: game.fen(),
      lastMove: move,
      pgn: game.pgn(),
    };
  }, []);

  const buildMoveDests = useCallback((game: Chess): Dests => {
    const destinations: Dests = new Map();

    game.moves({ verbose: true }).forEach(move => {
      const origin = move.from as Key;
      const destination = move.to as Key;
      const currentDestinations = destinations.get(origin) ?? [];
      currentDestinations.push(destination);
      destinations.set(origin, currentDestinations);
    });

    return destinations;
  }, []);

  const syncBoardUi = useCallback(() => {
    if (!chessgroundRef.current) {
      return;
    }

    const config: ChessgroundConfig = {
      fen,
      orientation: toChessgroundColor(userPlayerSide) ?? 'white',
      turnColor: toChessgroundColor(currentPlayer) ?? 'white',
      coordinates: true,
      movable: {
        color: isMyTurn ? currentPlayer : undefined,
        dests: buildMoveDests(chessRef.current),
        rookCastle: true,
      },
      premovable: {
        enabled: false,
      },
      animation: {
        enabled: true,
        duration: 180,
      },
      draggable: {
        enabled: gameStatus === 'playing',
      },
      selectable: {
        enabled: gameStatus === 'playing',
      },
      lastMove: lastMove ? [lastMove[0] as Key, lastMove[1] as Key] : undefined,
      check: chessRef.current.inCheck() ? currentPlayer : false,
      drawable: {
        enabled: false,
        visible: false,
      },
    };

    chessgroundRef.current.set(config);
  }, [buildMoveDests, currentPlayer, fen, gameStatus, isMyTurn, lastMove, userPlayerSide]);

  const applyChessPosition = useCallback((game: Chess, nextMoveNumber: number, nextLastMove: [Square, Square] | null) => {
    chessRef.current = game;
    moveNumberRef.current = nextMoveNumber;
    setFen(game.fen());
    setMoveNumber(nextMoveNumber);
    setCurrentPlayer(toPlayerColor(game.turn()));
    setLastMove(nextLastMove);
  }, []);

  const setGameResult = useCallback((status: GameStatus, nextWinner: PlayerColor | null, shouldNotify = false) => {
    setGameStatus(status);
    setWinner(nextWinner);

    if (status !== 'playing') {
      stopTimer();
    }

    if (shouldNotify && status !== 'playing') {
      toast({
        title: status === 'timeout' ? "Time's Up!" : 'Game Over',
        description: getResultMessage(status, nextWinner),
      });
    }
  }, [stopTimer, toast]);

  const updateTimerInDatabase = useCallback(async (whiteTime: number, blackTime: number) => {
    if (!chessGameId) {
      return;
    }

    await supabase
      .from('chess_games')
      .update({
        white_time_remaining: whiteTime,
        black_time_remaining: blackTime,
        current_player: currentPlayer,
      })
      .eq('id', chessGameId);
  }, [chessGameId, currentPlayer]);

  const handleTimeout = useCallback(async () => {
    if (gameStatus !== 'playing' || !chessGameId) {
      return;
    }

    const timedOutPlayer = whiteTimeRemaining <= 0 ? 'white' : 'black';
    const timeoutWinner = timedOutPlayer === 'white' ? 'black' : 'white';
    const persistedState = buildBoardState(chessRef.current, lastMove);

    try {
      await supabase
        .from('chess_games')
        .update({
          game_status: 'timeout',
          winner: timeoutWinner,
          white_time_remaining: Math.max(whiteTimeRemaining, 0),
          black_time_remaining: Math.max(blackTimeRemaining, 0),
        })
        .eq('id', chessGameId);

      await supabase
        .from('chess_moves')
        .insert({
          war_id: warId,
          move_number: moveNumberRef.current + 1,
          player_color: timedOutPlayer,
          from_row: 0,
          from_col: 0,
          to_row: 0,
          to_col: 0,
          piece_type: 'king',
          captured_piece: 'timeout',
          board_state: persistedState,
          special_move: null,
        });

      moveNumberRef.current += 1;
      setMoveNumber(moveNumberRef.current);
      setGameResult('timeout', timeoutWinner, true);
      onGameEnd(timeoutWinner);
    } catch (error: any) {
      toast({
        title: 'Error handling timeout',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [blackTimeRemaining, buildBoardState, chessGameId, gameStatus, lastMove, onGameEnd, setGameResult, toast, warId, whiteTimeRemaining]);

  const applyMoveFromDatabase = useCallback((move: ChessMoveRow) => {
    if (move.move_number <= moveNumberRef.current) {
      return;
    }

    const persistedState = readBoardState(move.board_state);
    const nextGame = new Chess(normalizeStoredFen(persistedState.fen));
    const moveSquares: [Square, Square] | null = persistedState.lastMove ?? [coordsToSquare(move.from_row, move.from_col), coordsToSquare(move.to_row, move.to_col)];

    applyChessPosition(nextGame, move.move_number, moveSquares);

    if (move.captured_piece === 'timeout') {
      setGameResult('timeout', move.player_color === 'white' ? 'black' : 'white');
      return;
    }

    if (move.captured_piece === 'forfeit') {
      setGameResult('checkmate', move.player_color === 'white' ? 'black' : 'white');
      return;
    }

    const derivedStatus = getGameStatusFromChess(nextGame);
    setGameResult(derivedStatus, derivedStatus === 'checkmate' ? move.player_color : null);
  }, [applyChessPosition, setGameResult]);

  const loadGameState = useCallback(async () => {
    const { data, error } = await supabase
      .from('chess_moves')
      .select('*')
      .eq('war_id', warId)
      .order('move_number', { ascending: true });

    if (error) {
      throw error;
    }

    if (!data || data.length === 0) {
      const freshGame = new Chess();
      applyChessPosition(freshGame, 0, null);
      setGameStatus('playing');
      setWinner(null);
      return;
    }

    applyMoveFromDatabase(data[data.length - 1] as ChessMoveRow);
  }, [applyChessPosition, applyMoveFromDatabase, warId]);

  const initializeChessGame = useCallback(async () => {
    const { data: existingGame, error: fetchError } = await supabase
      .from('chess_games')
      .select('*')
      .eq('war_id', warId)
      .maybeSingle();

    if (fetchError) {
      throw fetchError;
    }

    if (existingGame) {
      setChessGameId(existingGame.id);
      setWhiteTimeRemaining(existingGame.white_time_remaining);
      setBlackTimeRemaining(existingGame.black_time_remaining);
      setCurrentPlayer(existingGame.current_player as PlayerColor);
      setGameStatus(existingGame.game_status as GameStatus);
      setWinner(existingGame.winner as PlayerColor | null);
      return;
    }

    const { data: createdGame, error: createError } = await supabase
      .from('chess_games')
      .insert({
        war_id: warId,
        white_time_remaining: 300,
        black_time_remaining: 300,
        current_player: 'white',
        game_status: 'playing',
      })
      .select()
      .single();

    if (createError) {
      throw createError;
    }

    setChessGameId(createdGame.id);
  }, [warId]);

  const submitMove = useCallback(async (from: Key, to: Key) => {
    if (!isMyTurn || gameStatus !== 'playing') {
      syncBoardUi();
      return;
    }

    const allowed = await checkRateLimit('chess_move');
    if (!allowed) {
      syncBoardUi();
      return;
    }

    const workingGame = new Chess(chessRef.current.fen());
    const candidateMoves = workingGame.moves({ verbose: true, square: from as Square });
    const moveCandidate = candidateMoves.find(candidate => candidate.to === to) ?? null;

    if (!moveCandidate) {
      syncBoardUi();
      return;
    }

    try {
      const executedMove = workingGame.move({
        from,
        to,
        promotion: moveCandidate.promotion ?? 'q',
      }) as ChessJsMove;
      const nextStatus = getGameStatusFromChess(workingGame);
      const winningColor = nextStatus === 'checkmate' ? currentPlayer : null;
      const persistedState = buildBoardState(workingGame, [from as Square, to as Square]);
      const fromCoords = squareToCoords(from as Square);
      const toCoords = squareToCoords(to as Square);
      const nextMoveNumber = moveNumberRef.current + 1;

      const moveInsert = {
        war_id: warId,
        move_number: nextMoveNumber,
        player_color: currentPlayer,
        from_row: fromCoords.row,
        from_col: fromCoords.col,
        to_row: toCoords.row,
        to_col: toCoords.col,
        piece_type: PIECE_TYPE_BY_SYMBOL[executedMove.piece],
        captured_piece: executedMove.captured ? PIECE_TYPE_BY_SYMBOL[executedMove.captured] : null,
        board_state: persistedState,
        special_move: executedMove.isKingsideCastle()
          ? 'castle_kingside'
          : executedMove.isQueensideCastle()
            ? 'castle_queenside'
            : executedMove.isEnPassant()
              ? 'en_passant'
              : null,
      };

      const { error: insertError } = await supabase.from('chess_moves').insert(moveInsert);
      if (insertError) {
        throw insertError;
      }

      applyChessPosition(workingGame, nextMoveNumber, [from as Square, to as Square]);
      setGameResult(nextStatus, winningColor, nextStatus !== 'playing');

      if (chessGameId) {
        const { error: updateError } = await supabase
          .from('chess_games')
          .update({
            current_player: toPlayerColor(workingGame.turn()),
            game_status: nextStatus,
            winner: winningColor,
            white_time_remaining: whiteTimeRemaining,
            black_time_remaining: blackTimeRemaining,
          })
          .eq('id', chessGameId);

        if (updateError) {
          throw updateError;
        }
      }

      if (winningColor) {
        onGameEnd(winningColor);
      }
    } catch (error: any) {
      toast({
        title: 'Error making move',
        description: error.message,
        variant: 'destructive',
      });
      syncBoardUi();
    }
  }, [applyChessPosition, blackTimeRemaining, buildBoardState, checkRateLimit, chessGameId, currentPlayer, gameStatus, isMyTurn, onGameEnd, setGameResult, syncBoardUi, toast, warId, whiteTimeRemaining]);

  const forfeitGame = useCallback(async () => {
    const losingColor = currentPlayer;
    const winningColor = losingColor === 'white' ? 'black' : 'white';
    const persistedState = buildBoardState(chessRef.current, lastMove);

    try {
      const nextMoveNumber = moveNumberRef.current + 1;

      await supabase.from('chess_moves').insert({
        war_id: warId,
        move_number: nextMoveNumber,
        player_color: losingColor,
        from_row: 0,
        from_col: 0,
        to_row: 0,
        to_col: 0,
        piece_type: 'king',
        captured_piece: 'forfeit',
        board_state: persistedState,
        special_move: null,
      });

      if (chessGameId) {
        await supabase
          .from('chess_games')
          .update({
            game_status: 'checkmate',
            winner: winningColor,
          })
          .eq('id', chessGameId);
      }

      moveNumberRef.current = nextMoveNumber;
      setMoveNumber(nextMoveNumber);
      setGameResult('checkmate', winningColor, true);
      onGameEnd(winningColor);
    } catch (error: any) {
      toast({
        title: 'Error forfeiting game',
        description: error.message,
        variant: 'destructive',
      });
    }
  }, [buildBoardState, chessGameId, currentPlayer, lastMove, onGameEnd, setGameResult, toast, warId]);

  useEffect(() => {
    let isMounted = true;

    const initialize = async () => {
      try {
        await Promise.all([initializeChessGame(), loadGameState()]);
      } catch (error: any) {
        if (!isMounted) {
          return;
        }

        toast({
          title: 'Error loading chess game',
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    initialize();

    const channel = supabase
      .channel(`chess-${warId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chess_moves',
        filter: `war_id=eq.${warId}`,
      }, payload => {
        if (isMounted) {
          applyMoveFromDatabase(payload.new as ChessMoveRow);
        }
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chess_games',
        filter: `war_id=eq.${warId}`,
      }, payload => {
        if (!isMounted) {
          return;
        }

        const updatedGame = payload.new as {
          white_time_remaining: number;
          black_time_remaining: number;
          current_player: PlayerColor;
          game_status: GameStatus;
          winner: PlayerColor | null;
        };

        setWhiteTimeRemaining(updatedGame.white_time_remaining);
        setBlackTimeRemaining(updatedGame.black_time_remaining);
        setCurrentPlayer(updatedGame.current_player);
        setGameStatus(updatedGame.game_status);
        setWinner(updatedGame.winner);
      })
      .subscribe();

    return () => {
      isMounted = false;
      stopTimer();
      supabase.removeChannel(channel);
    };
  }, [applyMoveFromDatabase, initializeChessGame, loadGameState, stopTimer, toast, warId]);

  useEffect(() => {
    if (gameStatus !== 'playing' || moveNumber === 0) {
      stopTimer();
      return;
    }

    stopTimer();
    timerIntervalRef.current = window.setInterval(() => {
      if (currentPlayer === 'white') {
        setWhiteTimeRemaining(previous => Math.max(0, previous - 1));
      } else {
        setBlackTimeRemaining(previous => Math.max(0, previous - 1));
      }
    }, 1000);

    return () => {
      stopTimer();
    };
  }, [currentPlayer, gameStatus, moveNumber, stopTimer]);

  useEffect(() => {
    if (gameStatus === 'playing' && (whiteTimeRemaining <= 0 || blackTimeRemaining <= 0)) {
      void handleTimeout();
    }
  }, [blackTimeRemaining, gameStatus, handleTimeout, whiteTimeRemaining]);

  useEffect(() => {
    if (gameStatus !== 'playing' || !isMyTurn || moveNumber === 0) {
      return;
    }

    const intervalId = window.setInterval(() => {
      void updateTimerInDatabase(whiteTimeRemaining, blackTimeRemaining);
    }, 10000);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [blackTimeRemaining, gameStatus, isMyTurn, moveNumber, updateTimerInDatabase, whiteTimeRemaining]);

  useEffect(() => {
    if (!boardElementRef.current || chessgroundRef.current) {
      return;
    }

    chessgroundRef.current = Chessground(boardElementRef.current, {
      fen,
      orientation: toChessgroundColor(userPlayerSide) ?? 'white',
      turnColor: toChessgroundColor(currentPlayer) ?? 'white',
      coordinates: true,
      movable: {
        color: isMyTurn ? currentPlayer : undefined,
        dests: buildMoveDests(chessRef.current),
        events: {
          after: (from, to) => {
            void submitMove(from, to);
          },
        },
      },
      premovable: {
        enabled: false,
      },
      drawable: {
        enabled: false,
        visible: false,
      },
    });

    return () => {
      chessgroundRef.current?.destroy();
      chessgroundRef.current = null;
    };
  }, [buildMoveDests, currentPlayer, fen, isMyTurn, submitMove, userPlayerSide]);

  useEffect(() => {
    syncBoardUi();
  }, [syncBoardUi]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col items-center space-y-6 ${isMobile ? 'p-2 sm:p-4' : 'p-6'}`}>
      <div className="text-center">
        <h2 className={`font-bold mb-2 flex items-center justify-center gap-2 ${isMobile ? 'text-lg' : 'text-2xl'}`}>
          <Sword className={isMobile ? 'w-4 h-4' : 'w-6 h-6'} />
          Chess Battle
        </h2>
        {gameStatus === 'playing' ? (
          <div>
            <p className="text-lg">
              Current Turn: <span className="font-semibold capitalize">{currentPlayer}</span>
            </p>
            <p className="text-sm text-muted-foreground">{isMyTurn ? 'Your turn!' : 'Waiting for opponent...'}</p>
            {userPlayerSide && (
              <p className="text-sm text-muted-foreground">
                You are playing as <span className="font-medium capitalize">{userPlayerSide}</span>
              </p>
            )}
          </div>
        ) : (
          <div className="text-lg font-semibold">
            {gameStatus === 'checkmate' && winner && (
              <span className="flex items-center justify-center gap-2">
                <Crown className="w-5 h-5" />
                {winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!
              </span>
            )}
            {gameStatus === 'stalemate' && <span className="flex items-center justify-center">Stalemate - Draw!</span>}
            {gameStatus === 'draw' && <span className="flex items-center justify-center">Draw!</span>}
            {gameStatus === 'timeout' && winner && (
              <span className="flex items-center justify-center gap-2">
                <Crown className="w-5 h-5" />
                {winner.charAt(0).toUpperCase() + winner.slice(1)} Wins by Timeout!
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex flex-col items-center space-y-4">
        <div className={`border-2 rounded-lg transition-colors ${isMobile ? 'p-3 min-w-[200px]' : 'p-4 min-w-[240px]'} ${
          (userPlayerSide === 'white' ? currentPlayer === 'black' : currentPlayer === 'white') && gameStatus === 'playing'
            ? 'border-primary bg-primary/10'
            : 'border-border bg-card'
        }`}>
          <div className="text-center">
            <div className={`font-medium text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>Opponent</div>
            <div className={`font-medium text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
              ({userPlayerSide === 'white' ? 'Black' : 'White'})
            </div>
            <div className={`font-mono font-bold ${isMobile ? 'text-2xl' : 'text-3xl'} ${
              (userPlayerSide === 'white' ? blackTimeRemaining : whiteTimeRemaining) <= 30 ? 'text-destructive' : 'text-foreground'
            }`}>
              {formatTime(userPlayerSide === 'white' ? blackTimeRemaining : whiteTimeRemaining)}
            </div>
          </div>
        </div>

        <div className={`rounded-lg overflow-hidden border-4 border-primary/20 shadow-lg ${isMobile ? 'w-[90vw] max-w-[360px]' : 'w-[480px] max-w-[480px]'}`}>
          <div ref={boardElementRef} className="aspect-square w-full" style={{ backgroundColor: '#f0d9b5' }} />
        </div>

        <div className={`border-2 rounded-lg transition-colors ${isMobile ? 'p-3 min-w-[200px]' : 'p-4 min-w-[240px]'} ${
          (userPlayerSide === 'white' ? currentPlayer === 'white' : currentPlayer === 'black') && gameStatus === 'playing'
            ? 'border-primary bg-primary/10'
            : 'border-border bg-card'
        }`}>
          <div className="text-center">
            <div className={`font-medium text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>You</div>
            <div className={`font-medium text-muted-foreground ${isMobile ? 'text-sm' : 'text-base'}`}>
              ({userPlayerSide === 'white' ? 'White' : 'Black'})
            </div>
            <div className={`font-mono font-bold ${isMobile ? 'text-2xl' : 'text-3xl'} ${
              (userPlayerSide === 'white' ? whiteTimeRemaining : blackTimeRemaining) <= 30 ? 'text-destructive' : 'text-foreground'
            }`}>
              {formatTime(userPlayerSide === 'white' ? whiteTimeRemaining : blackTimeRemaining)}
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        {gameStatus === 'playing' && isMyTurn && (
          <Button onClick={forfeitGame} variant="destructive">
            Forfeit Game
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChessGame;