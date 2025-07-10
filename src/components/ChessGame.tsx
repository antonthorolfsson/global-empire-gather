import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useIsMobile } from '@/hooks/use-mobile';
import { Crown, Sword } from 'lucide-react';

interface ChessGameProps {
  warId: string;
  userPlayerSide: 'white' | 'black' | null;
  onGameEnd: (winnerId: string) => void;
}

interface ChessPiece {
  type: 'king' | 'queen' | 'rook' | 'bishop' | 'knight' | 'pawn';
  color: 'white' | 'black';
}

interface ChessSquare {
  piece: ChessPiece | null;
  isSelected: boolean;
  isPossibleMove: boolean;
}

interface ChessMove {
  id: string;
  move_number: number;
  player_color: 'white' | 'black';
  from_row: number;
  from_col: number;
  to_row: number;
  to_col: number;
  piece_type: string;
  captured_piece: string | null;
  board_state: ChessSquare[][];
}

interface Position {
  row: number;
  col: number;
}

const ChessGame: React.FC<ChessGameProps> = ({ warId, userPlayerSide, onGameEnd }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const isMobile = useIsMobile();
  const [board, setBoard] = useState<ChessSquare[][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [selectedSquare, setSelectedSquare] = useState<{row: number, col: number} | null>(null);
  const [gameStatus, setGameStatus] = useState<'playing' | 'checkmate' | 'stalemate' | 'draw' | 'timeout'>('playing');
  const [winner, setWinner] = useState<'white' | 'black' | null>(null);
  const [moveNumber, setMoveNumber] = useState(0);
  const [isMyTurn, setIsMyTurn] = useState(false);
  const [gameHistory, setGameHistory] = useState<string[]>([]);
  const [isInCheck, setIsInCheck] = useState<{ white: boolean; black: boolean }>({ white: false, black: false });
  
  // Chess clock state
  const [whiteTimeRemaining, setWhiteTimeRemaining] = useState(300); // 5 minutes in seconds
  const [blackTimeRemaining, setBlackTimeRemaining] = useState(300); // 5 minutes in seconds
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(null);
  const [chessGameId, setChessGameId] = useState<string | null>(null);

  useEffect(() => {
    console.log('ChessGame: Initializing for warId:', warId, 'userPlayerSide:', userPlayerSide);
    initializeBoard();
    loadGameState();
    initializeChessGame();
    
    const cleanup = setupRealtimeSubscription();
    return () => {
      cleanup();
      if (timerInterval) {
        clearInterval(timerInterval);
      }
    };
  }, [warId]);

  useEffect(() => {
    console.log('ChessGame: Turn changed - currentPlayer:', currentPlayer, 'userPlayerSide:', userPlayerSide);
    setIsMyTurn(currentPlayer === userPlayerSide);
  }, [currentPlayer, userPlayerSide]);

  // Timer effect
  useEffect(() => {
    if (gameStatus === 'playing' && (whiteTimeRemaining <= 0 || blackTimeRemaining <= 0)) {
      handleTimeout();
    }
  }, [whiteTimeRemaining, blackTimeRemaining, gameStatus]);
  
  // Timer and chess game initialization functions
  const initializeChessGame = async () => {
    try {
      console.log('ChessGame: Initializing chess game for warId:', warId);
      
      // Check if chess game already exists
      const { data: existingGame, error: fetchError } = await supabase
        .from('chess_games')
        .select('*')
        .eq('war_id', warId)
        .maybeSingle();

      if (fetchError) {
        console.error('ChessGame: Error fetching chess game:', fetchError);
        throw fetchError;
      }

      if (existingGame) {
        console.log('ChessGame: Found existing chess game:', existingGame);
        // Load existing game state
        setChessGameId(existingGame.id);
        setWhiteTimeRemaining(existingGame.white_time_remaining);
        setBlackTimeRemaining(existingGame.black_time_remaining);
        setCurrentPlayer(existingGame.current_player as 'white' | 'black');
        setGameStatus(existingGame.game_status as 'playing' | 'checkmate' | 'stalemate' | 'draw' | 'timeout');
        if (existingGame.winner) {
          setWinner(existingGame.winner as 'white' | 'black');
        }
      } else {
        console.log('ChessGame: Creating new chess game');
        // Create new chess game
        const { data: newGame, error: createError } = await supabase
          .from('chess_games')
          .insert({
            war_id: warId,
            white_time_remaining: 300,
            black_time_remaining: 300,
            current_player: 'white',
            game_status: 'playing'
          })
          .select()
          .single();

        if (createError) {
          console.error('ChessGame: Error creating chess game:', createError);
          throw createError;
        }
        
        console.log('ChessGame: Created new chess game:', newGame);
        setChessGameId(newGame.id);
      }
    } catch (error: any) {
      console.error('Error initializing chess game:', error);
    }
  };

  const startTimer = useCallback(() => {
    // Don't start timer until first move is made
    if (moveNumber === 0) return;
    
    // Start timer if game is playing (for any player)
    if (gameStatus === 'playing') {
      console.log('ChessGame: Starting timer for', currentPlayer);
      
      const newInterval = setInterval(() => {
        if (currentPlayer === 'white') {
          setWhiteTimeRemaining(prev => Math.max(0, prev - 1));
        } else {
          setBlackTimeRemaining(prev => Math.max(0, prev - 1));
        }
      }, 1000);

      setTimerInterval(newInterval);
    }
  }, [gameStatus, currentPlayer, moveNumber]);

  const stopTimer = useCallback(() => {
    console.log('ChessGame: Stopping timer');
    setTimerInterval(prev => {
      if (prev) {
        clearInterval(prev);
      }
      return null;
    });
  }, []);

  // Update database periodically (every 10 seconds) instead of on every tick
  useEffect(() => {
    if (gameStatus === 'playing' && isMyTurn && moveNumber > 0) {
      const updateInterval = setInterval(() => {
        if (chessGameId) {
          updateTimerInDatabase(whiteTimeRemaining, blackTimeRemaining);
        }
      }, 10000); // Update every 10 seconds

      return () => clearInterval(updateInterval);
    }
  }, [gameStatus, isMyTurn, moveNumber, chessGameId, whiteTimeRemaining, blackTimeRemaining]);

  const updateTimerInDatabase = async (whiteTime: number, blackTime: number) => {
    if (!chessGameId) return;

    try {
      await supabase
        .from('chess_games')
        .update({
          white_time_remaining: whiteTime,
          black_time_remaining: blackTime,
          current_player: currentPlayer
        })
        .eq('id', chessGameId);
    } catch (error: any) {
      console.error('Error updating timer:', error);
    }
  };

  const handleTimeout = async () => {
    if (gameStatus !== 'playing') return;

    const loser = whiteTimeRemaining <= 0 ? 'white' : 'black';
    const winner = loser === 'white' ? 'black' : 'white';

    try {
      // Update chess game status
      if (chessGameId) {
        await supabase
          .from('chess_games')
          .update({
            game_status: 'timeout',
            winner: winner
          })
          .eq('id', chessGameId);
      }

      // Save timeout move with valid coordinates and piece type
      await supabase
        .from('chess_moves')
        .insert({
          war_id: warId,
          move_number: moveNumber + 1,
          player_color: loser,
          from_row: 0,
          from_col: 0,
          to_row: 0,
          to_col: 0,
          piece_type: 'king', // Use valid piece type
          captured_piece: 'timeout', // This indicates it's a timeout
          board_state: JSON.parse(JSON.stringify(board))
        });

      setGameStatus('timeout');
      setWinner(winner);
      stopTimer();
      onGameEnd(winner);

      toast({
        title: "Time's Up!",
        description: `${loser.charAt(0).toUpperCase() + loser.slice(1)} ran out of time. ${winner.charAt(0).toUpperCase() + winner.slice(1)} wins!`,
      });
    } catch (error: any) {
      console.error('Error handling timeout:', error);
    }
  };

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Single timer control effect - manages timer based on game state and current player
  useEffect(() => {
    console.log('ChessGame: Timer control effect - gameStatus:', gameStatus, 'currentPlayer:', currentPlayer, 'moveNumber:', moveNumber);
    
    // Always stop any existing timer first
    stopTimer();
    
    // Only start timer if game is playing and after first move
    if (gameStatus === 'playing' && moveNumber > 0) {
      startTimer();
    }
  }, [gameStatus, currentPlayer, moveNumber, startTimer, stopTimer]);

  const setupRealtimeSubscription = () => {
    console.log('ChessGame: Setting up realtime subscription for warId:', warId);
    
    const channel = supabase
      .channel(`chess-${warId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chess_moves',
        filter: `war_id=eq.${warId}`
      }, (payload) => {
        console.log('ChessGame: New chess move received:', payload);
        const move = payload.new as any;
        applyMoveFromDatabase(move);
      })
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'chess_games',
        filter: `war_id=eq.${warId}`
      }, (payload) => {
        console.log('ChessGame: Chess game state updated:', payload);
        const gameData = payload.new as any;
        setWhiteTimeRemaining(gameData.white_time_remaining);
        setBlackTimeRemaining(gameData.black_time_remaining);
        setCurrentPlayer(gameData.current_player);
        setGameStatus(gameData.game_status);
        if (gameData.winner) {
          setWinner(gameData.winner);
        }
      })
      .subscribe((status) => {
        console.log('ChessGame: Subscription status:', status);
      });

    return () => {
      console.log('ChessGame: Cleaning up subscription');
      supabase.removeChannel(channel);
    };
  };

  const loadGameState = async () => {
    try {
      console.log('ChessGame: Loading game state for warId:', warId);
      const { data: moves, error } = await supabase
        .from('chess_moves')
        .select('*')
        .eq('war_id', warId)
        .order('move_number', { ascending: true });

      if (error) throw error;

      console.log('ChessGame: Loaded moves:', moves);
      
      if (moves && moves.length > 0) {
        // Apply all moves to reconstruct game state
        const latestMove = moves[moves.length - 1];
        console.log('ChessGame: Latest move:', latestMove);
        setBoard(JSON.parse(JSON.stringify(latestMove.board_state)) as ChessSquare[][]);
        setMoveNumber(latestMove.move_number);
        // Next player is opposite of who just moved
        const nextPlayer = latestMove.player_color === 'white' ? 'black' : 'white';
        console.log('ChessGame: Setting current player to:', nextPlayer);
        setCurrentPlayer(nextPlayer);
      } else {
        console.log('ChessGame: No moves found, game starts with white');
        // No moves yet, white starts
        setCurrentPlayer('white');
        setMoveNumber(0);
      }
    } catch (error: any) {
      console.error('ChessGame: Error loading game state:', error);
    }
  };

  const applyMoveFromDatabase = (move: any) => {
    console.log('ChessGame: Applying move from database:', move);
    console.log('ChessGame: Current board before update:', board.length, 'x', board[0]?.length);
    
    try {
      const newBoard = JSON.parse(JSON.stringify(move.board_state)) as ChessSquare[][];
      console.log('ChessGame: Parsed new board:', newBoard.length, 'x', newBoard[0]?.length);
      
      setBoard(newBoard);
      setMoveNumber(move.move_number);
      const nextPlayer = move.player_color === 'white' ? 'black' : 'white';
      console.log('ChessGame: Setting current player from', currentPlayer, 'to', nextPlayer);
      setCurrentPlayer(nextPlayer);
      
      // Update game history for repetition detection
      const boardHash = getBoardHash(newBoard);
      setGameHistory(prev => [...prev, boardHash]);
      
      // Check for game end conditions
      if (move.captured_piece === 'forfeit' || move.captured_piece === 'timeout' || move.captured_piece === 'king') {
        console.log('ChessGame: Game ended by forfeit/timeout or king capture, winner:', move.player_color);
        const gameEndStatus = move.captured_piece === 'timeout' ? 'timeout' : 'checkmate';
        setGameStatus(gameEndStatus);
        setWinner(move.player_color);
        onGameEnd(move.player_color);
      } else {
        // Check for natural game endings (checkmate, stalemate, draw)
        const gameResult = checkGameEnd(newBoard, nextPlayer);
        if (gameResult !== 'playing') {
          console.log('ChessGame: Game ended naturally:', gameResult);
          setGameStatus(gameResult);
          
          if (gameResult === 'checkmate') {
            setWinner(move.player_color); // Player who just moved wins
            onGameEnd(move.player_color);
          } else {
            setWinner(null); // Draw/stalemate
          }
          
          // Show appropriate message
          const messages = {
            checkmate: `Checkmate! ${move.player_color.charAt(0).toUpperCase() + move.player_color.slice(1)} wins!`,
            stalemate: "Stalemate! The game is a draw.",
            draw: "Draw by repetition!"
          };
          
          toast({
            title: "Game Over",
            description: messages[gameResult],
          });
        }
      }
      
      console.log('ChessGame: Move applied successfully');
    } catch (error) {
      console.error('ChessGame: Error applying move from database:', error);
    }
  };

  const initializeBoard = () => {
    const newBoard: ChessSquare[][] = Array(8).fill(null).map(() => 
      Array(8).fill(null).map(() => ({ piece: null, isSelected: false, isPossibleMove: false }))
    );

    // Initialize pieces
    const pieceOrder: ChessPiece['type'][] = ['rook', 'knight', 'bishop', 'queen', 'king', 'bishop', 'knight', 'rook'];
    
    // Black pieces (top)
    for (let col = 0; col < 8; col++) {
      newBoard[0][col].piece = { type: pieceOrder[col], color: 'black' };
      newBoard[1][col].piece = { type: 'pawn', color: 'black' };
    }
    
    // White pieces (bottom)
    for (let col = 0; col < 8; col++) {
      newBoard[7][col].piece = { type: pieceOrder[col], color: 'white' };
      newBoard[6][col].piece = { type: 'pawn', color: 'white' };
    }

    setBoard(newBoard);
  };

  const getPieceSymbol = (piece: ChessPiece | null): string => {
    if (!piece) return '';
    
    // Use the same outline symbols for both colors
    const symbols = {
      king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙'
    };
    
    return symbols[piece.type];
  };

  const getPieceClasses = (piece: ChessPiece | null): string => {
    if (!piece) return '';
    
    const baseClasses = "select-none pointer-events-none font-bold transition-all duration-200";
    const colorClasses = piece.color === 'white' 
      ? "text-white drop-shadow-[0_1px_1px_rgba(0,0,0,0.8)] stroke-black stroke-[0.5px]" 
      : "text-gray-900 drop-shadow-[0_1px_1px_rgba(255,255,255,0.3)]";
    
    return `${baseClasses} ${colorClasses}`;
  };

  // Chess logic functions
  const isPathClear = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
    
    if (steps <= 1) return true;
    
    const rowStep = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff);
    const colStep = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff);
    
    for (let i = 1; i < steps; i++) {
      const checkRow = fromRow + (rowStep * i);
      const checkCol = fromCol + (colStep * i);
      if (board[checkRow][checkCol].piece) return false;
    }
    
    return true;
  };

  const findKing = (color: 'white' | 'black', gameBoard: ChessSquare[][]): Position | null => {
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = gameBoard[row][col].piece;
        if (piece && piece.type === 'king' && piece.color === color) {
          return { row, col };
        }
      }
    }
    return null;
  };

  const isSquareAttacked = (row: number, col: number, byColor: 'white' | 'black', gameBoard: ChessSquare[][]): boolean => {
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const piece = gameBoard[r][c].piece;
        if (piece && piece.color === byColor) {
          if (canPieceAttackSquare(r, c, row, col, piece, gameBoard)) {
            return true;
          }
        }
      }
    }
    return false;
  };

  const canPieceAttackSquare = (fromRow: number, fromCol: number, toRow: number, toCol: number, piece: ChessPiece, gameBoard: ChessSquare[][]): boolean => {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    
    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1;
        return toRow === fromRow + direction && Math.abs(fromCol - toCol) === 1;
        
      case 'rook':
        return (fromRow === toRow || fromCol === toCol) && isPathClearForBoard(fromRow, fromCol, toRow, toCol, gameBoard);
        
      case 'bishop':
        return rowDiff === colDiff && isPathClearForBoard(fromRow, fromCol, toRow, toCol, gameBoard);
        
      case 'queen':
        return (fromRow === toRow || fromCol === toCol || rowDiff === colDiff) && 
               isPathClearForBoard(fromRow, fromCol, toRow, toCol, gameBoard);
        
      case 'king':
        return rowDiff <= 1 && colDiff <= 1;
        
      case 'knight':
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
        
      default:
        return false;
    }
  };

  const isPathClearForBoard = (fromRow: number, fromCol: number, toRow: number, toCol: number, gameBoard: ChessSquare[][]): boolean => {
    const rowDiff = toRow - fromRow;
    const colDiff = toCol - fromCol;
    const steps = Math.max(Math.abs(rowDiff), Math.abs(colDiff));
    
    if (steps <= 1) return true;
    
    const rowStep = rowDiff === 0 ? 0 : rowDiff / Math.abs(rowDiff);
    const colStep = colDiff === 0 ? 0 : colDiff / Math.abs(colDiff);
    
    for (let i = 1; i < steps; i++) {
      const checkRow = fromRow + (rowStep * i);
      const checkCol = fromCol + (colStep * i);
      if (gameBoard[checkRow][checkCol].piece) return false;
    }
    
    return true;
  };

  const isInCheckAfterMove = (fromRow: number, fromCol: number, toRow: number, toCol: number, color: 'white' | 'black', gameBoard: ChessSquare[][]): boolean => {
    // Create a temporary board to test the move
    const tempBoard = gameBoard.map(row => row.map(square => ({ ...square })));
    const piece = tempBoard[fromRow][fromCol].piece;
    
    if (!piece) return false;
    
    // Make the move on temp board
    tempBoard[toRow][toCol].piece = piece;
    tempBoard[fromRow][fromCol].piece = null;
    
    // Find king position after move
    const kingPos = findKing(color, tempBoard);
    if (!kingPos) return true; // King captured = check
    
    // Check if king is attacked
    const oppositeColor = color === 'white' ? 'black' : 'white';
    return isSquareAttacked(kingPos.row, kingPos.col, oppositeColor, tempBoard);
  };

  const getBoardHash = (gameBoard: ChessSquare[][]): string => {
    return JSON.stringify(gameBoard.map(row => 
      row.map(square => square.piece ? `${square.piece.color}${square.piece.type}` : null)
    ));
  };

  const isThreefoldRepetition = (gameBoard: ChessSquare[][]): boolean => {
    const currentHash = getBoardHash(gameBoard);
    const positions = [...gameHistory, currentHash];
    
    let count = 0;
    for (const position of positions) {
      if (position === currentHash) count++;
      if (count >= 3) return true;
    }
    
    return false;
  };

  const getAllLegalMoves = (color: 'white' | 'black', gameBoard: ChessSquare[][]): Position[] => {
    const legalMoves: Position[] = [];
    
    for (let fromRow = 0; fromRow < 8; fromRow++) {
      for (let fromCol = 0; fromCol < 8; fromCol++) {
        const piece = gameBoard[fromRow][fromCol].piece;
        if (piece && piece.color === color) {
          for (let toRow = 0; toRow < 8; toRow++) {
            for (let toCol = 0; toCol < 8; toCol++) {
              if (isValidMoveComplete(fromRow, fromCol, toRow, toCol, gameBoard)) {
                legalMoves.push({ row: toRow, col: toCol });
              }
            }
          }
        }
      }
    }
    
    return legalMoves;
  };

  const isValidMoveComplete = (fromRow: number, fromCol: number, toRow: number, toCol: number, gameBoard: ChessSquare[][]): boolean => {
    const piece = gameBoard[fromRow][fromCol].piece;
    if (!piece) return false;
    
    // Can't move to same square
    if (fromRow === toRow && fromCol === toCol) return false;
    
    // Can't capture own pieces
    const targetPiece = gameBoard[toRow][toCol].piece;
    if (targetPiece && targetPiece.color === piece.color) return false;
    
    // Check piece-specific movement rules
    if (!isValidPieceMove(fromRow, fromCol, toRow, toCol, piece, gameBoard)) return false;
    
    // Check if move leaves king in check
    if (isInCheckAfterMove(fromRow, fromCol, toRow, toCol, piece.color, gameBoard)) return false;
    
    return true;
  };

  const isValidPieceMove = (fromRow: number, fromCol: number, toRow: number, toCol: number, piece: ChessPiece, gameBoard: ChessSquare[][]): boolean => {
    const rowDiff = Math.abs(fromRow - toRow);
    const colDiff = Math.abs(fromCol - toCol);
    const targetPiece = gameBoard[toRow][toCol].piece;
    
    switch (piece.type) {
      case 'pawn':
        const direction = piece.color === 'white' ? -1 : 1;
        const startRow = piece.color === 'white' ? 6 : 1;
        
        // Forward move
        if (fromCol === toCol && !targetPiece) {
          if (toRow === fromRow + direction) return true;
          if (fromRow === startRow && toRow === fromRow + 2 * direction) return true;
        }
        // Capture
        if (Math.abs(fromCol - toCol) === 1 && toRow === fromRow + direction && targetPiece) {
          return true;
        }
        return false;
        
      case 'rook':
        return (fromRow === toRow || fromCol === toCol) && isPathClearForBoard(fromRow, fromCol, toRow, toCol, gameBoard);
        
      case 'bishop':
        return rowDiff === colDiff && isPathClearForBoard(fromRow, fromCol, toRow, toCol, gameBoard);
        
      case 'queen':
        return (fromRow === toRow || fromCol === toCol || rowDiff === colDiff) && 
               isPathClearForBoard(fromRow, fromCol, toRow, toCol, gameBoard);
        
      case 'king':
        return rowDiff <= 1 && colDiff <= 1;
        
      case 'knight':
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
        
      default:
        return false;
    }
  };

  const checkGameEnd = (gameBoard: ChessSquare[][], playerToMove: 'white' | 'black'): 'playing' | 'checkmate' | 'stalemate' | 'draw' => {
    const legalMoves = getAllLegalMoves(playerToMove, gameBoard);
    const kingPos = findKing(playerToMove, gameBoard);
    
    if (!kingPos) return 'checkmate'; // King captured
    
    const oppositeColor = playerToMove === 'white' ? 'black' : 'white';
    const inCheck = isSquareAttacked(kingPos.row, kingPos.col, oppositeColor, gameBoard);
    
    if (legalMoves.length === 0) {
      return inCheck ? 'checkmate' : 'stalemate';
    }
    
    if (isThreefoldRepetition(gameBoard)) {
      return 'draw';
    }
    
    return 'playing';
  };

  const makeMove = async (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    if (!isValidMoveComplete(fromRow, fromCol, toRow, toCol, board)) return false;
    if (!isMyTurn) {
      toast({
        title: "Not your turn",
        description: "Please wait for your opponent to move.",
        variant: "destructive",
      });
      return false;
    }

    const newBoard = board.map(row => row.map(square => ({ ...square, isSelected: false, isPossibleMove: false })));
    const movingPiece = newBoard[fromRow][fromCol].piece;
    const capturedPiece = newBoard[toRow][toCol].piece;
    
    if (!movingPiece) return false;

    newBoard[toRow][toCol].piece = movingPiece;
    newBoard[fromRow][fromCol].piece = null;
    
    // Check for game ending conditions
    const nextPlayer = currentPlayer === 'white' ? 'black' : 'white';
    const gameResult = checkGameEnd(newBoard, nextPlayer);
    
    // Update game history for repetition detection
    const boardHash = getBoardHash(newBoard);
    setGameHistory(prev => [...prev, boardHash]);
    
    // Save move to database
    try {
      console.log('ChessGame: Saving move to database:', {
        war_id: warId,
        move_number: moveNumber + 1,
        player_color: currentPlayer,
        from_row: fromRow,
        from_col: fromCol,
        to_row: toRow,
        to_col: toCol,
        piece_type: movingPiece.type,
        captured_piece: capturedPiece?.type || null
      });
      
      const { error } = await supabase
        .from('chess_moves')
        .insert({
          war_id: warId,
          move_number: moveNumber + 1,
          player_color: currentPlayer,
          from_row: fromRow,
          from_col: fromCol,
          to_row: toRow,
          to_col: toCol,
          piece_type: movingPiece.type,
          captured_piece: capturedPiece?.type || null,
          board_state: JSON.parse(JSON.stringify(newBoard))
        });

      if (error) throw error;

      console.log('ChessGame: Move saved successfully to database');
      
      // Update chess game state with new player turn
      if (chessGameId) {
        const { error: updateError } = await supabase
          .from('chess_games')
          .update({
            current_player: nextPlayer,
            white_time_remaining: whiteTimeRemaining,
            black_time_remaining: blackTimeRemaining
          })
          .eq('id', chessGameId);
          
        if (updateError) {
          console.error('Error updating chess game state:', updateError);
        }
      }
      
      // Handle game ending
      if (gameResult !== 'playing') {
        setGameStatus(gameResult);
        
        let winnerId: string | null = null;
        if (gameResult === 'checkmate') {
          winnerId = currentPlayer; // Current player wins by checkmate
          setWinner(currentPlayer);
        } else if (gameResult === 'stalemate' || gameResult === 'draw') {
          setWinner(null);
        }
        
        if (winnerId) {
          onGameEnd(winnerId);
        }
        
        // Show appropriate message
        const messages = {
          checkmate: `Checkmate! ${currentPlayer.charAt(0).toUpperCase() + currentPlayer.slice(1)} wins!`,
          stalemate: "Stalemate! The game is a draw.",
          draw: "Draw by repetition!"
        };
        
        toast({
          title: "Game Over",
          description: messages[gameResult],
        });
      }
      
      setSelectedSquare(null);
      
    } catch (error: any) {
      toast({
        title: "Error making move",
        description: error.message,
        variant: "destructive",
      });
      return false;
    }
    
    return true;
  };

  const handleSquareClick = (row: number, col: number) => {
    // Flip coordinates for black player
    const actualRow = userPlayerSide === 'black' ? 7 - row : row;
    const actualCol = userPlayerSide === 'black' ? 7 - col : col;
    
    console.log('ChessGame: Square clicked:', row, col, 'actual coordinates:', actualRow, actualCol, 'gameStatus:', gameStatus, 'isMyTurn:', isMyTurn, 'currentPlayer:', currentPlayer, 'userPlayerSide:', userPlayerSide);
    
    if (gameStatus !== 'playing') {
      console.log('ChessGame: Game not in playing status');
      return;
    }
    
    if (!isMyTurn) {
      console.log('ChessGame: Not user\'s turn');
      return;
    }

    const clickedSquare = board[actualRow][actualCol];
    console.log('ChessGame: Clicked square has piece:', clickedSquare.piece);
    
    if (selectedSquare) {
      // If clicking on own piece, select it instead of trying to move
      if (clickedSquare.piece && clickedSquare.piece.color === currentPlayer) {
        console.log('ChessGame: Selecting new piece');
        setSelectedSquare({ row: actualRow, col: actualCol });
        highlightPossibleMoves(actualRow, actualCol);
        return;
      }
      
      // Try to make a move (use actual coordinates)
      console.log('ChessGame: Trying to make move from', selectedSquare, 'to', {row: actualRow, col: actualCol});
      if (makeMove(selectedSquare.row, selectedSquare.col, actualRow, actualCol)) {
        return;
      }
      
      // If move failed and not clicking on own piece, clear selection
      console.log('ChessGame: Clearing selection');
      setSelectedSquare(null);
      clearHighlights();
    } else {
      // Select a piece
      if (clickedSquare.piece && clickedSquare.piece.color === currentPlayer) {
        console.log('ChessGame: Selecting piece');
        setSelectedSquare({ row: actualRow, col: actualCol });
        highlightPossibleMoves(actualRow, actualCol);
      } else {
        console.log('ChessGame: Cannot select this square - no piece or wrong color');
      }
    }
  };

  const highlightPossibleMoves = (row: number, col: number) => {
    const newBoard = board.map(boardRow => boardRow.map(square => ({ ...square, isSelected: false, isPossibleMove: false })));
    newBoard[row][col].isSelected = true;
    
    // Highlight possible moves
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (isValidMoveComplete(row, col, r, c, board)) {
          newBoard[r][c].isPossibleMove = true;
        }
      }
    }
    
    setBoard(newBoard);
  };

  const clearHighlights = () => {
    const newBoard = board.map(row => row.map(square => ({ ...square, isSelected: false, isPossibleMove: false })));
    setBoard(newBoard);
  };

  const forfeitGame = async () => {
    try {
      const winner = currentPlayer === 'white' ? 'black' : 'white';
      
      await supabase
        .from('chess_moves')
        .insert({
          war_id: warId,
          move_number: moveNumber + 1,
          player_color: currentPlayer,
          from_row: 0,
          from_col: 0,
          to_row: 0,
          to_col: 0,
          piece_type: 'king', // Use valid piece type
          captured_piece: 'forfeit', // This indicates it's a forfeit
          board_state: JSON.parse(JSON.stringify(board))
        });

      setGameStatus('checkmate');
      setWinner(winner);
      onGameEnd(winner);
      
      toast({
        title: "Game Forfeited",
        description: `You forfeited the game.`,
      });
    } catch (error: any) {
      toast({
        title: "Error forfeiting game",
        description: error.message,
        variant: "destructive",
      });
    }
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
            <p className="text-sm text-muted-foreground">
              {isMyTurn ? "Your turn!" : "Waiting for opponent..."}
            </p>
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
            {gameStatus === 'stalemate' && (
              <span className="flex items-center justify-center">
                Stalemate - Draw!
              </span>
            )}
            {gameStatus === 'draw' && (
              <span className="flex items-center justify-center">
                Draw by Repetition!
              </span>
            )}
            {gameStatus === 'timeout' && winner && (
              <span className="flex items-center justify-center gap-2">
                <Crown className="w-5 h-5" />
                {winner.charAt(0).toUpperCase() + winner.slice(1)} Wins by Timeout!
              </span>
            )}
          </div>
        )}
      </div>

      <div className="flex items-center justify-center gap-6">
        {/* Left timer - Black player */}
        <div className={`border-2 rounded-lg transition-colors ${isMobile ? 'p-2' : 'p-3'} ${
          currentPlayer === 'black' && gameStatus === 'playing' 
            ? 'border-primary bg-primary/10' : 'border-border bg-card'
        }`}>
          <div className="text-center">
            <div className={`font-medium text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {userPlayerSide === 'black' ? 'You' : 'Opponent'}
            </div>
            <div className={`font-medium text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
              (Black)
            </div>
            <div className={`font-mono font-bold ${isMobile ? 'text-lg' : 'text-xl'} ${
              blackTimeRemaining <= 30 ? 'text-destructive' : 'text-foreground'
            }`}>
              {formatTime(blackTimeRemaining)}
            </div>
          </div>
        </div>

        {/* Chess Board */}
        <div className={`grid grid-cols-8 gap-0 border-4 border-primary/20 shadow-lg rounded-lg overflow-hidden bg-card ${
          isMobile ? 'max-w-[320px] w-full' : 'w-[512px]'
        }`}>
          {(userPlayerSide === 'black' ? [...board].reverse() : board).map((row, displayRowIndex) => 
            (userPlayerSide === 'black' ? [...row].reverse() : row).map((square, displayColIndex) => {
              // Calculate actual indices for highlighting
              const actualRowIndex = userPlayerSide === 'black' ? 7 - displayRowIndex : displayRowIndex;
              const actualColIndex = userPlayerSide === 'black' ? 7 - displayColIndex : displayColIndex;
              const actualSquare = board[actualRowIndex][actualColIndex];
              
              const isLightSquare = (actualRowIndex + actualColIndex) % 2 === 0;
              
              return (
                <div
                  key={`${actualRowIndex}-${actualColIndex}`}
                  className={`
                    aspect-square flex items-center justify-center cursor-pointer relative
                    ${isMobile ? 'text-2xl sm:text-3xl' : 'text-4xl'}
                    ${isLightSquare 
                      ? 'bg-amber-50 dark:bg-amber-100/20' 
                      : 'bg-amber-800/40 dark:bg-amber-900/40'
                    }
                    ${actualSquare.isSelected ? 'bg-blue-400/60 dark:bg-blue-500/60 ring-2 ring-blue-500' : ''}
                    ${actualSquare.isPossibleMove ? 'bg-green-400/60 dark:bg-green-500/60 ring-2 ring-green-500' : ''}
                    ${!isMyTurn ? 'cursor-not-allowed opacity-75' : 'hover:bg-primary/10'}
                    transition-all duration-200
                  `}
                  onClick={() => handleSquareClick(displayRowIndex, displayColIndex)}
                >
                  {actualSquare.isPossibleMove && !actualSquare.piece && (
                    <div className={`bg-green-500/70 rounded-full ${isMobile ? 'w-2 h-2' : 'w-4 h-4'}`} />
                  )}
                  {actualSquare.isPossibleMove && actualSquare.piece && (
                    <div className="absolute inset-0 ring-4 ring-green-500/70 rounded-sm" />
                  )}
                  <span className={getPieceClasses(actualSquare.piece)}>
                    {getPieceSymbol(actualSquare.piece)}
                  </span>
                </div>
              );
            })
          )}
        </div>

        {/* Right timer - White player */}
        <div className={`border-2 rounded-lg transition-colors ${isMobile ? 'p-2' : 'p-3'} ${
          currentPlayer === 'white' && gameStatus === 'playing' 
            ? 'border-primary bg-primary/10' : 'border-border bg-card'
        }`}>
          <div className="text-center">
            <div className={`font-medium text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
              {userPlayerSide === 'white' ? 'You' : 'Opponent'}
            </div>
            <div className={`font-medium text-muted-foreground ${isMobile ? 'text-xs' : 'text-sm'}`}>
              (White)
            </div>
            <div className={`font-mono font-bold ${isMobile ? 'text-lg' : 'text-xl'} ${
              whiteTimeRemaining <= 30 ? 'text-destructive' : 'text-foreground'
            }`}>
              {formatTime(whiteTimeRemaining)}
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