
import { createClient } from '@supabase/supabase-js';

// Função auxiliar para obter variáveis de ambiente de forma segura (Vite ou Process)
const getEnv = (key: string) => {
  // @ts-ignore
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    // @ts-ignore
    return import.meta.env[key];
  }
  try {
    // @ts-ignore
    return process.env[key];
  } catch (e) {
    return undefined;
  }
};

const envUrl = getEnv('VITE_SUPABASE_URL');
const envKey = getEnv('VITE_SUPABASE_ANON_KEY');

// Credenciais fornecidas
const PROVIDED_URL = 'https://velugtxxobxudowjuywv.supabase.co';
const PROVIDED_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZlbHVndHh4b2J4dWRvd2p1eXd2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg2NTc3NzMsImV4cCI6MjA4NDIzMzc3M30.nYp5zD7usmXObAOTB_4dzWwIzOgiv7w86TkhT9U79EI';

// Valida se a string é um URL válido para evitar erro crítico: "Failed to construct 'URL'"
const isValidUrl = (url: string) => {
  try {
    if (!url) return false;
    new URL(url);
    return true;
  } catch (e) {
    return false;
  }
};

// Se a variável de ambiente não existir, usa a credencial hardcoded fornecida.
// Se mesmo assim não for válido (ex: string vazia), usa o placeholder.
const urlToCheck = (envUrl && isValidUrl(envUrl)) ? envUrl : PROVIDED_URL;
const finalUrl = isValidUrl(urlToCheck) ? urlToCheck : 'https://placeholder.supabase.co';
const finalKey = envKey || PROVIDED_KEY;

export const supabase = createClient(finalUrl, finalKey);
