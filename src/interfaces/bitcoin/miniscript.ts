import { AxiosRequestConfig } from 'axios';

export interface MiniscriptInfo {
  script_hex: string;
  script_type: string;
  address?: string;
  miniscript?: string;
  asm?: string;
  sats?: number;
}

export interface MiniscriptTx {
  txid: string;
  vsize?: number;
  fee?: number;
  is_mempool?: boolean;
}

export interface MiniscriptInstance {
  getScriptInfo: (params: { script: string }) => Promise<MiniscriptInfo>;
  getScriptTxs: (params: { script: string; is_mempool: boolean }) => Promise<MiniscriptTx[]>;
}
