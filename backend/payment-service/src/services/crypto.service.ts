import { ethers } from 'ethers';
import Web3 from 'web3';
import { logger } from '../utils/logger';
import { AppError } from '../utils/appError';

export class CryptoService {
  private provider: ethers.JsonRpcProvider;
  private web3: Web3;
  private escrowContract: ethers.Contract;

  constructor() {
    const rpcUrl = process.env.ETHEREUM_RPC_URL || 'https://mainnet.infura.io/v3/YOUR-PROJECT-ID';
    this.provider = new ethers.JsonRpcProvider(rpcUrl);
    this.web3 = new Web3(rpcUrl);

    // Escrow contract ABI and address
    const escrowABI = [
      'function createEscrow(address seller, uint256 amount) external payable returns (uint256)',
      'function releaseEscrow(uint256 escrowId) external',
      'function refundEscrow(uint256 escrowId) external',
      'function getEscrowStatus(uint256 escrowId) external view returns (uint8)',
      'event EscrowCreated(uint256 indexed escrowId, address indexed buyer, address indexed seller, uint256 amount)',
      'event EscrowReleased(uint256 indexed escrowId)',
      'event EscrowRefunded(uint256 indexed escrowId)'
    ];

    const escrowAddress = process.env.ESCROW_CONTRACT_ADDRESS || '';
    this.escrowContract = new ethers.Contract(escrowAddress, escrowABI, this.provider);
  }

  async createPayment(amount: number, currency: string) {
    try {
      // Generate a unique payment address or use existing wallet
      const wallet = ethers.Wallet.createRandom();
      const address = wallet.address;

      // Convert amount to Wei (for ETH) or appropriate denomination
      const amountInWei = ethers.parseEther(amount.toString());

      return {
        id: `crypto_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        clientSecret: address,
        status: 'pending',
        paymentAddress: address,
        amount: amountInWei.toString(),
        currency: currency.toUpperCase()
      };
    } catch (error: any) {
      logger.error('Crypto payment creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async confirmPayment(paymentId: string) {
    try {
      // In a real implementation, verify the transaction on the blockchain
      // This is a simplified version
      
      return {
        transactionId: `0x${Math.random().toString(16).substr(2, 64)}`,
        status: 'completed',
        blockNumber: Math.floor(Math.random() * 1000000)
      };
    } catch (error: any) {
      logger.error('Crypto payment confirmation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async cancelPayment(paymentId: string) {
    try {
      // Crypto payments can't be cancelled once sent
      // This marks the payment as cancelled in our system
      logger.info(`Crypto payment ${paymentId} marked as cancelled`);
      return { success: true };
    } catch (error: any) {
      logger.error('Crypto payment cancellation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async createEscrow(sellerAddress: string, amount: number, buyerPrivateKey: string) {
    try {
      const wallet = new ethers.Wallet(buyerPrivateKey, this.provider);
      const contractWithSigner = this.escrowContract.connect(wallet);

      const amountInWei = ethers.parseEther(amount.toString());

      const tx = await contractWithSigner.createEscrow(sellerAddress, amountInWei, {
        value: amountInWei
      });

      const receipt = await tx.wait();

      // Extract escrow ID from event logs
      const event = receipt.logs.find((log: any) => 
        log.topics[0] === ethers.id('EscrowCreated(uint256,address,address,uint256)')
      );

      const escrowId = event ? ethers.toNumber(event.topics[1]) : 0;

      return {
        escrowId,
        transactionHash: receipt.hash,
        status: 'created'
      };
    } catch (error: any) {
      logger.error('Crypto escrow creation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async releaseEscrow(escrowId: number, buyerPrivateKey: string) {
    try {
      const wallet = new ethers.Wallet(buyerPrivateKey, this.provider);
      const contractWithSigner = this.escrowContract.connect(wallet);

      const tx = await contractWithSigner.releaseEscrow(escrowId);
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        status: 'released'
      };
    } catch (error: any) {
      logger.error('Crypto escrow release failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async refundEscrow(escrowId: number, sellerPrivateKey: string) {
    try {
      const wallet = new ethers.Wallet(sellerPrivateKey, this.provider);
      const contractWithSigner = this.escrowContract.connect(wallet);

      const tx = await contractWithSigner.refundEscrow(escrowId);
      const receipt = await tx.wait();

      return {
        transactionHash: receipt.hash,
        status: 'refunded'
      };
    } catch (error: any) {
      logger.error('Crypto escrow refund failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getEscrowStatus(escrowId: number) {
    try {
      const status = await this.escrowContract.getEscrowStatus(escrowId);
      
      const statusMap: { [key: number]: string } = {
        0: 'pending',
        1: 'active',
        2: 'released',
        3: 'refunded',
        4: 'disputed'
      };

      return {
        escrowId,
        status: statusMap[Number(status)] || 'unknown'
      };
    } catch (error: any) {
      logger.error('Crypto escrow status retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getTransactionStatus(txHash: string) {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!receipt) {
        return {
          status: 'pending',
          confirmations: 0
        };
      }

      const currentBlock = await this.provider.getBlockNumber();
      const confirmations = currentBlock - receipt.blockNumber;

      return {
        status: receipt.status === 1 ? 'confirmed' : 'failed',
        confirmations,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString()
      };
    } catch (error: any) {
      logger.error('Transaction status retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getBalance(address: string) {
    try {
      const balance = await this.provider.getBalance(address);
      const balanceInEth = ethers.formatEther(balance);

      return {
        address,
        balance: balanceInEth,
        balanceWei: balance.toString()
      };
    } catch (error: any) {
      logger.error('Balance retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async estimateGas(to: string, value: string) {
    try {
      const gasEstimate = await this.provider.estimateGas({
        to,
        value: ethers.parseEther(value)
      });

      const gasPrice = await this.provider.getFeeData();

      return {
        gasLimit: gasEstimate.toString(),
        gasPrice: gasPrice.gasPrice?.toString() || '0',
        estimatedCost: ethers.formatEther(
          gasEstimate * (gasPrice.gasPrice || BigInt(0))
        )
      };
    } catch (error: any) {
      logger.error('Gas estimation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async sendTransaction(fromPrivateKey: string, to: string, amount: string) {
    try {
      const wallet = new ethers.Wallet(fromPrivateKey, this.provider);

      const tx = await wallet.sendTransaction({
        to,
        value: ethers.parseEther(amount)
      });

      const receipt = await tx.wait();

      return {
        transactionHash: receipt?.hash || '',
        status: receipt?.status === 1 ? 'success' : 'failed',
        blockNumber: receipt?.blockNumber || 0,
        gasUsed: receipt?.gasUsed.toString() || '0'
      };
    } catch (error: any) {
      logger.error('Transaction sending failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async verifyPayment(txHash: string, expectedAmount: string, expectedRecipient: string) {
    try {
      const tx = await this.provider.getTransaction(txHash);
      const receipt = await this.provider.getTransactionReceipt(txHash);

      if (!tx || !receipt) {
        return {
          verified: false,
          reason: 'Transaction not found'
        };
      }

      const amountMatch = tx.value === ethers.parseEther(expectedAmount);
      const recipientMatch = tx.to?.toLowerCase() === expectedRecipient.toLowerCase();
      const confirmed = receipt.status === 1;

      return {
        verified: amountMatch && recipientMatch && confirmed,
        amountMatch,
        recipientMatch,
        confirmed,
        confirmations: await this.provider.getBlockNumber() - receipt.blockNumber
      };
    } catch (error: any) {
      logger.error('Payment verification failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  generateWallet() {
    try {
      const wallet = ethers.Wallet.createRandom();

      return {
        address: wallet.address,
        privateKey: wallet.privateKey,
        mnemonic: wallet.mnemonic?.phrase || ''
      };
    } catch (error: any) {
      logger.error('Wallet generation failed:', error);
      throw new AppError(error.message, 500);
    }
  }

  async getGasPrice() {
    try {
      const feeData = await this.provider.getFeeData();

      return {
        gasPrice: ethers.formatUnits(feeData.gasPrice || BigInt(0), 'gwei'),
        maxFeePerGas: ethers.formatUnits(feeData.maxFeePerGas || BigInt(0), 'gwei'),
        maxPriorityFeePerGas: ethers.formatUnits(feeData.maxPriorityFeePerGas || BigInt(0), 'gwei')
      };
    } catch (error: any) {
      logger.error('Gas price retrieval failed:', error);
      throw new AppError(error.message, 500);
    }
  }
}
