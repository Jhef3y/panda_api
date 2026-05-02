import {
  Connection,
  PublicKey,
  Keypair,
  Transaction,
  TransactionInstruction,
  sendAndConfirmTransaction,
  LAMPORTS_PER_SOL,
  clusterApiUrl,
  Cluster,
  SystemProgram,
} from '@solana/web3.js';
import { UserRepository } from '../repositories/user.repository';
import { TransactionRepository } from '../repositories/transaction.repository';
import { decrypt } from '../utils/crypto.util';
import { TransactionType, TransactionStatus } from '../lib/prisma';

const userRepository = new UserRepository();
const transactionRepository = new TransactionRepository();

function getConnection(): Connection {
  const network = (process.env.SOLANA_NETWORK ?? 'devnet') as Cluster;
  return new Connection(clusterApiUrl(network), 'confirmed');
}

function getKeypairFromUser(encryptedPrivateKey: string): Keypair {
  const privateKeyBase64 = decrypt(encryptedPrivateKey);
  const secretKey = Buffer.from(privateKeyBase64, 'base64');
  return Keypair.fromSecretKey(secretKey);
}

export interface InitiateContractDTO {
  program_id: string;
  destination_address: string;
  amount: number;
  execution_key: string; // chave adicional de execução (ex: PDA ou conta auxiliar)
}

export interface ExecuteContractDTO {
  program_id: string;
  transaction_id: string; // ID da transação salva no banco (do initiate)
  instruction_data: number[]; // dados serializados para o contrato
}

/**
 * Service de Smart Contract Solana.
 * Inicia e executa instruções em programas (smart contracts) na rede Solana.
 */
export class ContractService {
  /**
   * Inicia uma interação com um Smart Contract (Program).
   * Envia uma instrução ao program_id com os accounts necessários.
   */
  async initiateContract(userId: string, dto: InitiateContractDTO): Promise<object> {
    const user = await userRepository.findById(userId);
    if (!user?.wallet_address || !user?.encrypted_private_key) {
      throw new Error('Carteira não configurada para este usuário.');
    }

    // Registrar intenção da transação como PENDING
    const txRecord = await transactionRepository.create({
      user_id: userId,
      type: TransactionType.CONTRACT,
      status: TransactionStatus.PENDING,
      amount: dto.amount,
      destination_address: dto.destination_address,
    });

    const connection = getConnection();
    const callerKeypair = getKeypairFromUser(user.encrypted_private_key);
    const programId = new PublicKey(dto.program_id);
    const destinationPubkey = new PublicKey(dto.destination_address);
    const executionPubkey = new PublicKey(dto.execution_key);

    // Montar instrução para o smart contract
    // Os dados da instrução indicam o valor em lamports (encoded em 8 bytes little-endian)
    const amountLamports = BigInt(Math.round(dto.amount * LAMPORTS_PER_SOL));
    const dataBuffer = Buffer.alloc(8);
    dataBuffer.writeBigUInt64LE(amountLamports);

    const instruction = new TransactionInstruction({
      programId,
      keys: [
        { pubkey: callerKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: destinationPubkey, isSigner: false, isWritable: true },
        { pubkey: executionPubkey, isSigner: false, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: dataBuffer,
    });

    const transaction = new Transaction().add(instruction);

    try {
      const signature = await sendAndConfirmTransaction(connection, transaction, [callerKeypair]);

      await transactionRepository.updateStatus(txRecord.id, TransactionStatus.CONFIRMED, signature);

      return {
        message: 'Contrato iniciado com sucesso.',
        transaction_id: txRecord.id,
        tx_signature: signature,
        program_id: dto.program_id,
        amount: dto.amount,
        destination: dto.destination_address,
      };
    } catch (error) {
      await transactionRepository.updateStatus(txRecord.id, TransactionStatus.FAILED);
      throw error;
    }
  }

  /**
   * Executa lógica adicional de um contrato já iniciado.
   * Envia uma nova instrução referenciando a transação original.
   */
  async executeContract(userId: string, dto: ExecuteContractDTO): Promise<object> {
    const user = await userRepository.findById(userId);
    if (!user?.wallet_address || !user?.encrypted_private_key) {
      throw new Error('Carteira não configurada para este usuário.');
    }

    // Buscar transação original para validar pertencimento
    const originalTx = await transactionRepository.findById(dto.transaction_id);
    if (!originalTx || originalTx.user_id !== userId) {
      throw new Error('Transação não encontrada ou não pertence a este usuário.');
    }
    if (originalTx.status !== TransactionStatus.CONFIRMED) {
      throw new Error('A transação base ainda não foi confirmada.');
    }

    // Registrar nova transação de execução como PENDING
    const txRecord = await transactionRepository.create({
      user_id: userId,
      type: TransactionType.CONTRACT,
      status: TransactionStatus.PENDING,
      amount: originalTx.amount,
      destination_address: originalTx.destination_address,
    });

    const connection = getConnection();
    const callerKeypair = getKeypairFromUser(user.encrypted_private_key);
    const programId = new PublicKey(dto.program_id);
    const destinationPubkey = new PublicKey(originalTx.destination_address);

    // Usar os dados de instrução customizados (serializado pelo chamador)
    const dataBuffer = Buffer.from(dto.instruction_data);

    const instruction = new TransactionInstruction({
      programId,
      keys: [
        { pubkey: callerKeypair.publicKey, isSigner: true, isWritable: true },
        { pubkey: destinationPubkey, isSigner: false, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      data: dataBuffer,
    });

    const transaction = new Transaction().add(instruction);

    try {
      const signature = await sendAndConfirmTransaction(connection, transaction, [callerKeypair]);

      await transactionRepository.updateStatus(txRecord.id, TransactionStatus.CONFIRMED, signature);

      return {
        message: 'Contrato executado com sucesso.',
        transaction_id: txRecord.id,
        tx_signature: signature,
        program_id: dto.program_id,
        original_transaction_id: dto.transaction_id,
      };
    } catch (error) {
      await transactionRepository.updateStatus(txRecord.id, TransactionStatus.FAILED);
      throw error;
    }
  }
}
