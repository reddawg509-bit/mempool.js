import { AxiosInstance } from 'axios';
import { NFTInstance, LiquidNFT, LiquidNFTTx, LiquidNFTOwner } from '../../interfaces/liquid/nft';

export const useNft = (api: AxiosInstance): NFTInstance => {
  const getNFT = async (params: { nft_id: string }) => {
    const { data } = await api.get<LiquidNFT>(`/nft/${params.nft_id}`);
    return data;
  };

  const getNFTTxs = async (params: { nft_id: string; is_mempool: boolean }) => {
    const paramsMempools = params.is_mempool === true ? '/mempool' : '/chain';
    const { data } = await api.get<LiquidNFTTx[]>(`/nft/${params.nft_id}/txs${paramsMempools}`);
    return data;
  };

  const getNFTOwners = async (params: { nft_id: string }) => {
    const { data } = await api.get<LiquidNFTOwner[]>(`/nft/${params.nft_id}/owners`);
    return data;
  };

  return {
    getNFT,
    getNFTTxs,
    getNFTOwners,
  };
};
