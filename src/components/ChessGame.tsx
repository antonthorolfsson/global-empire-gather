import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
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

const ChessGame: React.FC<ChessGameProps> = ({ warId, userPlayerSide, onGameEnd }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [board, setBoard] = useState<ChessSquare[][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [selectedSquare, setSelectedSquare] = useState<{row: number, col: number} | null>(null);
  const [gameStatus, setGameStatus] = useState<'playing' | 'checkmate' | 'draw'>('playing');
  const [winner, setWinner] = useState<'white' | 'black' | null>(null);
  const [moveNumber, setMoveNumber] = useState(0);
  const [isMyTurn, setIsMyTurn] = useState(false);

  useEffect(() => {
    console.log('ChessGame: Initializing for warId:', warId, 'userPlayerSide:', userPlayerSide);
    initializeBoard();
    loadGameState();
    setupRealtimeSubscription();
  }, [warId]);

  useEffect(() => {
    console.log('ChessGame: Turn changed - currentPlayer:', currentPlayer, 'userPlayerSide:', userPlayerSide);
    setIsMyTurn(currentPlayer === userPlayerSide);
  }, [currentPlayer, userPlayerSide]);

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel(`chess-${warId}`)
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chess_moves',
        filter: `war_id=eq.${warId}`
      }, (payload) => {
        console.log('New chess move:', payload);
        const move = payload.new as ChessMove;
        applyMoveFromDatabase(move);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  };

  const loadGameState = async () => {
    try {
      const { data: moves, error } = await supabase
        .from('chess_moves')
        .select('*')
        .eq('war_id', warId)
        .order('move_number', { ascending: true });

      if (error) throw error;

      if (moves && moves.length > 0) {
        // Apply all moves to reconstruct game state
        const latestMove = moves[moves.length - 1];
        setBoard(JSON.parse(JSON.stringify(latestMove.board_state)) as ChessSquare[][]);
        setMoveNumber(latestMove.move_number);
        setCurrentPlayer(latestMove.player_color === 'white' ? 'black' : 'white');
      }
    } catch (error: any) {
      console.error('Error loading game state:', error);
    }
  };

  const applyMoveFromDatabase = (move: ChessMove) => {
    setBoard(JSON.parse(JSON.stringify(move.board_state)) as ChessSquare[][]);
    setMoveNumber(move.move_number);
    setCurrentPlayer(move.player_color === 'white' ? 'black' : 'white');
    
    // Check for game end
    if (move.captured_piece === 'king') {
      setGameStatus('checkmate');
      setWinner(move.player_color);
      onGameEnd(move.player_color);
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
    
    const symbols = {
      white: { king: '♔', queen: '♕', rook: '♖', bishop: '♗', knight: '♘', pawn: '♙' },
      black: { king: '♚', queen: '♛', rook: '♜', bishop: '♝', knight: '♞', pawn: '♟' }
    };
    
    return symbols[piece.color][piece.type];
  };

  const isValidMove = (fromRow: number, fromCol: number, toRow: number, toCol: number): boolean => {
    const piece = board[fromRow][fromCol].piece;
    if (!piece || piece.color !== currentPlayer) return false;
    
    // Basic validation - just check if target square is empty or has enemy piece
    const targetPiece = board[toRow][toCol].piece;
    if (targetPiece && targetPiece.color === piece.color) return false;
    
    // Simplified move validation for demo
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
        return fromRow === toRow || fromCol === toCol;
        
      case 'bishop':
        return Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol);
        
      case 'queen':
        return fromRow === toRow || fromCol === toCol || Math.abs(fromRow - toRow) === Math.abs(fromCol - toCol);
        
      case 'king':
        return Math.abs(fromRow - toRow) <= 1 && Math.abs(fromCol - toCol) <= 1;
        
      case 'knight':
        const rowDiff = Math.abs(fromRow - toRow);
        const colDiff = Math.abs(fromCol - toCol);
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
        
      default:
        return false;
    }
  };

  const makeMove = async (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    if (!isValidMove(fromRow, fromCol, toRow, toCol)) return false;
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
    
    // Save move to database
    try {
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

      // Local update will be handled by the realtime subscription
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
    console.log('ChessGame: Square clicked:', row, col, 'gameStatus:', gameStatus, 'isMyTurn:', isMyTurn, 'currentPlayer:', currentPlayer, 'userPlayerSide:', userPlayerSide);
    
    if (gameStatus !== 'playing') {
      console.log('ChessGame: Game not in playing status');
      return;
    }
    
    if (!isMyTurn) {
      console.log('ChessGame: Not user\'s turn');
      return;
    }

    const clickedSquare = board[row][col];
    console.log('ChessGame: Clicked square has piece:', clickedSquare.piece);
    
    if (selectedSquare) {
      console.log('ChessGame: Trying to make move from', selectedSquare, 'to', {row, col});
      // Try to make a move
      if (makeMove(selectedSquare.row, selectedSquare.col, row, col)) {
        return;
      }
      // If move failed, check if clicking on own piece
      if (clickedSquare.piece && clickedSquare.piece.color === currentPlayer) {
        console.log('ChessGame: Selecting new piece');
        setSelectedSquare({ row, col });
        highlightPossibleMoves(row, col);
      } else {
        console.log('ChessGame: Clearing selection');
        setSelectedSquare(null);
        clearHighlights();
      }
    } else {
      // Select a piece
      if (clickedSquare.piece && clickedSquare.piece.color === currentPlayer) {
        console.log('ChessGame: Selecting piece');
        setSelectedSquare({ row, col });
        highlightPossibleMoves(row, col);
      } else {
        console.log('ChessGame: Cannot select this square - no piece or wrong color');
      }
    }
  };

  const highlightPossibleMoves = (row: number, col: number) => {
    const newBoard = board.map(boardRow => boardRow.map(square => ({ ...square, isSelected: false, isPossibleMove: false })));
    newBoard[row][col].isSelected = true;
    
    // Highlight possible moves (simplified)
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        if (isValidMove(row, col, r, c)) {
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
          from_row: -1, // Special value for forfeit
          from_col: -1,
          to_row: -1,
          to_col: -1,
          piece_type: 'forfeit',
          captured_piece: 'king', // Indicates game end
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
    <div className="flex flex-col items-center space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Sword className="w-6 h-6" />
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
          <p className="text-lg font-semibold">
            {winner && (
              <span className="flex items-center justify-center gap-2">
                <Crown className="w-5 h-5" />
                {winner.charAt(0).toUpperCase() + winner.slice(1)} Wins!
              </span>
            )}
          </p>
        )}
      </div>

      <div className="grid grid-cols-8 gap-0 border-2 border-border bg-card">
        {board.map((row, rowIndex) =>
          row.map((square, colIndex) => (
            <div
              key={`${rowIndex}-${colIndex}`}
              className={`
                w-12 h-12 flex items-center justify-center text-2xl cursor-pointer border border-border/20
                ${(rowIndex + colIndex) % 2 === 0 ? 'bg-amber-100 dark:bg-amber-900/30' : 'bg-amber-200 dark:bg-amber-800/30'}
                ${square.isSelected ? 'bg-blue-300 dark:bg-blue-600' : ''}
                ${square.isPossibleMove ? 'bg-green-300 dark:bg-green-600' : ''}
                ${!isMyTurn ? 'cursor-not-allowed opacity-75' : 'hover:bg-accent/50'}
                transition-colors
              `}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            >
              {getPieceSymbol(square.piece)}
            </div>
          ))
        )}
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