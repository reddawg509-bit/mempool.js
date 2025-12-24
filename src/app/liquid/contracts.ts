import { AxiosInstance } from 'axios';
import { ContractsInstance, LiquidContract, LiquidContractTx } from '../../interfaces/liquid/contracts';

export const useContracts = (api: AxiosInstance): ContractsInstance => {
  const getContract = async (params: { contract_id: string }) => {
    const { data } = await api.get<LiquidContract>(`/contract/${params.contract_id}`);
    return data;
  };

  const getContractTxs = async (params: { contract_id: string; is_mempool: boolean }) => {
    const paramsMempools = params.is_mempool === true ? '/mempool' : '/chain';
    const { data } = await api.get<LiquidContractTx[]>(`/contract/${params.contract_id}/txs${paramsMempools}`);
    return data;
  };

  return {
    getContract,
    getContractTxs,
  };
};
