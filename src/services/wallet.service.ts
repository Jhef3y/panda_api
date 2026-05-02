import {
  Connection,
  PublicKey,
  Keypair,
  SystemProgram,
  Transaction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  Cluster,
} from '@solana/web3.js';
import { getAccount, getMint, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { UserRepository } from '../repositories/user.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { decrypt } from '../utils/crypto.util';
import { TransactionType, TransactionStatus } from '../lib/prisma';
import { PriceService } from './price.service';

const userRepository = new UserRepository();
const transactionRepository = new TransactionRepository();
const priceService = new PriceService();

function getConnection(): Connection {
  const network = (process.env.SOLANA_NETWORK ?? 'devnet') as Cluster;
  return new Connection(clusterApiUrl(network), 'confirmed');
}

function getKeypairFromUser(encryptedPrivateKey: string): Keypair {
  const privateKeyBase64 = decrypt(encryptedPrivateKey);
  const secretKey = Buffer.from(privateKeyBase64, 'base64');
  return Keypair.fromSecretKey(secretKey);
}

/**
 * Service de carteira Solana.
 * Gerencia saldo, tokens SPL e transferências de SOL.
 */
export class WalletService {
  /**
   * Retorna o saldo em SOL da carteira do usuário.
   */
  async getBalance(userId: string): Promise<{ address: string; balance_sol: number; balance_usdt: number; sol_price_usdt: number }> {
    const user = await userRepository.findById(userId);
    if (!user?.wallet_address) throw new Error('Carteira não encontrada para este usuário.');

    const connection = getConnection();
    const publicKey = new PublicKey(user.wallet_address);

    const [lamports, solPrice] = await Promise.all([
      connection.getBalance(publicKey),
      priceService.getSOLPriceInUSDT(),
    ]);

    const balanceSOL = lamports / LAMPORTS_PER_SOL;

    return {
      address: user.wallet_address,
      balance_sol: balanceSOL,
      sol_price_usdt: solPrice,
      balance_usdt: parseFloat((balanceSOL * solPrice).toFixed(2)),
    };
  }

  /**
   * Lista todos os tokens SPL na carteira do usuário.
   */
  async getTokens(userId: string): Promise<object[]> {
    const user = await userRepository.findById(userId);
    if (!user?.wallet_address) throw new Error('Carteira não encontrada para este usuário.');

    const connection = getConnection();
    const publicKey = new PublicKey(user.wallet_address);

    // Busca todas as token accounts associadas à carteira
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
      programId: TOKEN_PROGRAM_ID,
    });

    const tokens = await Promise.all(
      tokenAccounts.value.map(async (accountInfo) => {
        const parsedInfo = accountInfo.account.data.parsed.info;
        const mintAddress = parsedInfo.mint;
        const amount = parsedInfo.tokenAmount;

        let decimals = amount.decimals;
        try {
          const mintInfo = await getMint(connection, new PublicKey(mintAddress));
          decimals = mintInfo.decimals;
        } catch {
          // ignora erro ao buscar mint info
        }

        return {
          mint: mintAddress,
          account: accountInfo.pubkey.toBase58(),
          amount: amount.uiAmountString,
          decimals,
        };
      })
    );

    return tokens;
  }

  /**
   * Transfere SOL de um usuário para um endereço destino.
   * Assina a transação com a private key descriptografada do banco.
   */
  async transferSOL(
    userId: string,
    destinationAddress: string,
    amountSOL: number
  ): Promise<object> {
    const user = await userRepository.findById(userId);
    if (!user?.wallet_address || !user?.encrypted_private_key) {
      throw new Error('Carteira não configurada para este usuário.');
    }

    // Salvar transação com status PENDING antes de enviar
    const txRecord = await transactionRepository.create({
      user_id: userId,
      type: TransactionType.TRANSFER,
      status: TransactionStatus.PENDING,
      amount: amountSOL,
      destination_address: destinationAddress,
    });

    const connection = getConnection();
    const senderKeypair = getKeypairFromUser(user.encrypted_private_key);
    const destinationPublicKey = new PublicKey(destinationAddress);

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: senderKeypair.publicKey,
        toPubkey: destinationPublicKey,
        lamports: amountSOL * LAMPORTS_PER_SOL,
      })
    );

    try {
      const signature = await sendAndConfirmTransaction(connection, transaction, [senderKeypair]);

      // Atualizar transação com assinatura e status CONFIRMED
      await transactionRepository.updateStatus(txRecord.id, TransactionStatus.CONFIRMED, signature);

      return {
        message: 'Transferência realizada com sucesso.',
        tx_signature: signature,
        amount_sol: amountSOL,
        destination: destinationAddress,
      };
    } catch (error) {
      await transactionRepository.updateStatus(txRecord.id, TransactionStatus.FAILED);
      throw error;
    }
  }

  /**
   * Retorna a taxa estimada de transferência da rede Solana em SOL e lamports.
   * Não requer autenticação — a taxa é a mesma para qualquer transferência simples de SOL.
   */
  async getTransferFee(): Promise<object> {
    const connection = getConnection();

    // Keypair gerado apenas para montar a simulação — nunca é salvo ou usado para assinar
    const dummyKeypair = Keypair.generate();
    const dummyPubkey = dummyKeypair.publicKey;

    const { blockhash } = await connection.getLatestBlockhash();

    const transaction = new Transaction({
      recentBlockhash: blockhash,
      feePayer: dummyPubkey,
    }).add(
      SystemProgram.transfer({
        fromPubkey: dummyPubkey,
        toPubkey: dummyPubkey,
        lamports: 1,
      })
    );

    const feeResponse = await connection.getFeeForMessage(
      transaction.compileMessage(),
      'confirmed'
    );

    const feeLamports = feeResponse.value ?? 5000; // fallback padrão da rede Solana
    const feeSOL = feeLamports / LAMPORTS_PER_SOL;

    return {
      network: process.env.SOLANA_NETWORK ?? 'devnet',
      fee_lamports: feeLamports,
      fee_sol: feeSOL,
      description: 'Taxa estimada para uma transferência simples de SOL na rede Solana.',
    };
  }
}
