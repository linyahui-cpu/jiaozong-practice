import {addBank} from './storage.mjs';

export const BUNDLED_BANK_ID='shenzhen-teacher-2012-2025';
export const BUNDLED_BANK_VERSION='2026-10-27-v1';

export function installBundledBank(state,bank,version=BUNDLED_BANK_VERSION){
  if(state.bundledBankVersions?.[bank.id]===version)return state;
  const next=addBank(state,bank);
  next.bundledBankVersions={...next.bundledBankVersions,[bank.id]:version};
  next.banks.sort((a,b)=>Number(b.id===bank.id)-Number(a.id===bank.id));
  return next;
}
