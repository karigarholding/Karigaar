import { GoldPurity, GoldAPIResponse } from "../types";

const API_KEY = "goldapi-j8rsmjmxighb-io";

export const fetchGoldPrices = async (): Promise<Record<GoldPurity, number>> => {
  const myHeaders = new Headers();
  myHeaders.append("x-access-token", API_KEY);
  myHeaders.append("Content-Type", "application/json");

  const requestOptions = {
    method: 'GET',
    headers: myHeaders,
    redirect: 'follow' as RequestRedirect
  };

  try {
    const response = await fetch("https://www.goldapi.io/api/XAU/AED", requestOptions);
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    const result: GoldAPIResponse = await response.json();
    
    // Map response to our Enum
    return {
      [GoldPurity.K24]: result.price_gram_24k,
      [GoldPurity.K22]: result.price_gram_22k,
      [GoldPurity.K21]: result.price_gram_21k,
      [GoldPurity.K18]: result.price_gram_18k,
      [GoldPurity.K14]: result.price_gram_14k,
    };
  } catch (error) {
    console.error("Error fetching gold prices:", error);
    throw error;
  }
};
