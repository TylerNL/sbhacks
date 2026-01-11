import {
  Connection,
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from '@solana/web3.js';

// Devnet RPC endpoint
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC || 'https://api.devnet.solana.com';

/**
 * Create a SOL transfer transaction
 * @param fromPubkey - Sender's public key
 * @param toPubkey - Recipient's public key (seller's wallet)
 * @param amountSol - Amount in SOL (will be converted to lamports)
 * @returns Transaction object ready to be signed
 */
export async function createTransferTransaction(
  fromPubkey: PublicKey,
  toPubkey: PublicKey,
  amountSol: number
): Promise<Transaction> {
  const connection = new Connection(SOLANA_RPC, 'confirmed');
  
  // Convert SOL to lamports
  const lamports = Math.floor(amountSol * LAMPORTS_PER_SOL);
  
  // Create the transfer instruction
  const transferInstruction = SystemProgram.transfer({
    fromPubkey,
    toPubkey,
    lamports,
  });
  
  // Create transaction and add the instruction
  const transaction = new Transaction().add(transferInstruction);
  
  // Get the latest blockhash
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  transaction.recentBlockhash = blockhash;
  transaction.feePayer = fromPubkey;
  
  return transaction;
}

/**
 * Send and confirm a signed transaction
 * @param signedTransaction - Transaction that has been signed by the wallet
 * @returns Transaction signature
 */
export async function sendAndConfirmTransaction(
  signedTransaction: Transaction
): Promise<string> {
  const connection = new Connection(SOLANA_RPC, 'confirmed');
  
  // Send the transaction
  const signature = await connection.sendRawTransaction(signedTransaction.serialize());
  
  // Wait for confirmation
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });
  
  return signature;
}

/**
 * Get wallet balance in SOL
 * @param pubkey - Wallet public key
 * @returns Balance in SOL
 */
export async function getBalance(pubkey: PublicKey): Promise<number> {
  const connection = new Connection(SOLANA_RPC, 'confirmed');
  const balance = await connection.getBalance(pubkey);
  return balance / LAMPORTS_PER_SOL;
}

/**
 * Helper to get explorer URL for a transaction
 * @param signature - Transaction signature
 * @returns Solana Explorer URL
 */
export function getExplorerUrl(signature: string): string {
  // Use devnet explorer
  return `https://explorer.solana.com/tx/${signature}?cluster=devnet`;
}
