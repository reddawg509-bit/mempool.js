export interface LiquidContract {
  contract_id: string;
  script_hex?: string;
  asset_id?: string;
  issuer?: string;
  metadata?: any;
}

export interface LiquidContractTx {
  txid: string;
  is_mempool?: boolean;
}

export interface ContractsInstance {
  getContract: (params: { contract_id: string }) => Promise<LiquidContract>;
  getContractTxs: (params: { contract_id: string; is_mempool: boolean }) => Promise<LiquidContractTx[]>;
}
