import { AxiosInstance } from 'axios';
import { BitcoinNFTInstance, BitcoinOrdinal, BitcoinOrdinalTx } from '../../interfaces/bitcoin/nft';

export const useBitcoinNft = (api: AxiosInstance): BitcoinNFTInstance => {
  const getOrdinal = async (params: { id: string }) => {
    const { data } = await api.get<BitcoinOrdinal>(`/ordinal/${params.id}`);
    return data;
  };

  const getOrdinalTxs = async (params: { id: string; is_mempool: boolean }) => {
    const paramsMempools = params.is_mempool === true ? '/mempool' : '/chain';
    const { data } = await api.get<BitcoinOrdinalTx[]>(`/ordinal/${params.id}/txs${paramsMempools}`);
    return data;
  };

  return {
    getOrdinal,
    getOrdinalTxs,
  };
};
