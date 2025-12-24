import { AxiosInstance } from 'axios';
import { MiniscriptInstance, MiniscriptInfo, MiniscriptTx } from '../../interfaces/bitcoin/miniscript';

export const useMiniscript = (api: AxiosInstance): MiniscriptInstance => {
  const getScriptInfo = async (params: { script: string }) => {
    const { data } = await api.get<MiniscriptInfo>(`/script/${params.script}`);
    return data;
  };

  const getScriptTxs = async (params: { script: string; is_mempool: boolean }) => {
    const paramsMempools = params.is_mempool === true ? '/mempool' : '/chain';
    const { data } = await api.get<MiniscriptTx[]>(`/script/${params.script}/txs${paramsMempools}`);
    return data;
  };

  return {
    getScriptInfo,
    getScriptTxs,
  };
};
