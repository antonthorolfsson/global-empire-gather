import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/components/AuthWrapper';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { ArrowLeft, Crown, Sword } from 'lucide-react';

interface ChessGameProps {
  warId: string;
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

const ChessGame: React.FC<ChessGameProps> = ({ warId, onGameEnd }) => {
  const { toast } = useToast();
  const [board, setBoard] = useState<ChessSquare[][]>([]);
  const [currentPlayer, setCurrentPlayer] = useState<'white' | 'black'>('white');
  const [selectedSquare, setSelectedSquare] = useState<{row: number, col: number} | null>(null);
  const [gameStatus, setGameStatus] = useState<'playing' | 'checkmate' | 'draw'>('playing');
  const [winner, setWinner] = useState<'white' | 'black' | null>(null);

  useEffect(() => {
    initializeBoard();
  }, []);

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

  const makeMove = (fromRow: number, fromCol: number, toRow: number, toCol: number) => {
    if (!isValidMove(fromRow, fromCol, toRow, toCol)) return false;

    const newBoard = board.map(row => row.map(square => ({ ...square, isSelected: false, isPossibleMove: false })));
    const movingPiece = newBoard[fromRow][fromCol].piece;
    const capturedPiece = newBoard[toRow][toCol].piece;
    
    newBoard[toRow][toCol].piece = movingPiece;
    newBoard[fromRow][fromCol].piece = null;
    
    setBoard(newBoard);
    setSelectedSquare(null);
    setCurrentPlayer(currentPlayer === 'white' ? 'black' : 'white');
    
    // Check for king capture (simplified win condition)
    if (capturedPiece && capturedPiece.type === 'king') {
      setGameStatus('checkmate');
      setWinner(currentPlayer);
      onGameEnd(currentPlayer === 'white' ? 'white' : 'black');
    }
    
    return true;
  };

  const handleSquareClick = (row: number, col: number) => {
    if (gameStatus !== 'playing') return;

    const clickedSquare = board[row][col];
    
    if (selectedSquare) {
      // Try to make a move
      if (makeMove(selectedSquare.row, selectedSquare.col, row, col)) {
        return;
      }
      // If move failed, check if clicking on own piece
      if (clickedSquare.piece && clickedSquare.piece.color === currentPlayer) {
        setSelectedSquare({ row, col });
        highlightPossibleMoves(row, col);
      } else {
        setSelectedSquare(null);
        clearHighlights();
      }
    } else {
      // Select a piece
      if (clickedSquare.piece && clickedSquare.piece.color === currentPlayer) {
        setSelectedSquare({ row, col });
        highlightPossibleMoves(row, col);
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

  const forfeitGame = () => {
    const loser = currentPlayer;
    const winner = currentPlayer === 'white' ? 'black' : 'white';
    setGameStatus('checkmate');
    setWinner(winner);
    onGameEnd(winner);
    
    toast({
      title: "Game Forfeited",
      description: `${loser} player forfeited the game.`,
    });
  };

  return (
    <div className="flex flex-col items-center space-y-6 p-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold mb-2 flex items-center justify-center gap-2">
          <Sword className="w-6 h-6" />
          Chess Battle
        </h2>
        {gameStatus === 'playing' ? (
          <p className="text-lg">
            Current Turn: <span className="font-semibold capitalize">{currentPlayer}</span>
          </p>
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
                hover:bg-accent/50 transition-colors
              `}
              onClick={() => handleSquareClick(rowIndex, colIndex)}
            >
              {getPieceSymbol(square.piece)}
            </div>
          ))
        )}
      </div>

      <div className="flex gap-4">
        {gameStatus === 'playing' && (
          <Button onClick={forfeitGame} variant="destructive">
            Forfeit Game
          </Button>
        )}
      </div>
    </div>
  );
};

export default ChessGame;