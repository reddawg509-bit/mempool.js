export interface BitcoinOrdinal {
  id: string;
  inscription_number?: number;
  address?: string;
  content_type?: string;
  content?: string; // could be ipfs://, data: or an http url
  metadata?: any;
}

export interface BitcoinOrdinalTx {
  txid: string;
  is_mempool?: boolean;
}

export interface BitcoinNFTInstance {
  getOrdinal: (params: { id: string }) => Promise<BitcoinOrdinal>;
  getOrdinalTxs: (params: { id: string; is_mempool: boolean }) => Promise<BitcoinOrdinalTx[]>;
}
