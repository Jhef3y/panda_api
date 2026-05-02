import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Keypair } from '@solana/web3.js';
import { UserRepository } from '../repositories/user.repository';
import { encrypt } from '../utils/crypto.util';

const userRepository = new UserRepository();

export interface RegisterDTO {
  name: string;
  email: string;
  password: string;
}

export interface LoginDTO {
  email: string;
  password: string;
}

/**
 * Service de autenticação.
 * Gerencia registro, geração de carteira Solana e login de usuários.
 */
export class AuthService {
  /**
   * Registra um novo usuário, gera um Keypair Solana para ele e
   * salva a private key criptografada com AES-256 no banco.
   */
  async register(data: RegisterDTO) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new Error('E-mail já cadastrado.');
    }

    // Hash da senha com bcrypt (salt rounds = 12)
    const hashedPassword = await bcrypt.hash(data.password, 12);

    // Gerar novo Keypair Solana para o usuário
    const keypair = Keypair.generate();
    const walletAddress = keypair.publicKey.toBase58();
    const privateKeyBase64 = Buffer.from(keypair.secretKey).toString('base64');

    // Criptografar a private key com AES-256 antes de salvar
    const encryptedPrivateKey = encrypt(privateKeyBase64);

    const user = await userRepository.create({
      name: data.name,
      email: data.email,
      password: hashedPassword,
      wallet_address: walletAddress,
      encrypted_private_key: encryptedPrivateKey,
    });

    const token = this.generateToken(user.id, user.email);

    return {
      message: 'Usuário criado com sucesso.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        wallet_address: user.wallet_address,
      },
    };
  }

  /**
   * Autentica o usuário e retorna um JWT.
   */
  async login(data: LoginDTO) {
    const user = await userRepository.findByEmail(data.email);
    if (!user) {
      throw new Error('Credenciais inválidas.');
    }

    const passwordMatch = await bcrypt.compare(data.password, user.password);
    if (!passwordMatch) {
      throw new Error('Credenciais inválidas.');
    }

    const token = this.generateToken(user.id, user.email);

    return {
      message: 'Login realizado com sucesso.',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        wallet_address: user.wallet_address,
      },
    };
  }

  private generateToken(userId: string, email: string): string {
    const secret = process.env.JWT_SECRET!;
    const expiresIn = process.env.JWT_EXPIRES_IN ?? '7d';
    return jwt.sign({ userId, email }, secret, { expiresIn } as jwt.SignOptions);
  }
}

