export interface LiquidNFT {
  nft_id: string;
  asset_id?: string;
  name?: string;
  description?: string;
  metadata?: any;
  issuer?: string;
  created_at?: string;
}

export interface LiquidNFTTx {
  txid: string;
  is_mempool?: boolean;
}

export interface LiquidNFTOwner {
  address: string;
  sats: number;
}

export interface NFTInstance {
  getNFT: (params: { nft_id: string }) => Promise<LiquidNFT>;
  getNFTTxs: (params: { nft_id: string; is_mempool: boolean }) => Promise<LiquidNFTTx[]>;
  getNFTOwners: (params: { nft_id: string }) => Promise<LiquidNFTOwner[]>;
}
