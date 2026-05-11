import { useEffect, useState } from "react";

const AFRICAN_COUNTRIES: string[] = [
  "NG",
  "GH",
  "KE",
  "ZA",
  "TZ",
  "UG",
  "RW",
  "ET",
  "SN",
  "CI",
  "CM",
  "MZ",
  "ZM",
  "ZW",
  "BW",
  "NA",
  "MG",
  "MU",
  "EG",
  "MA",
  "TN",
  "DZ",
  "LY",
  "SD",
  "AO",
  "CD",
  "CG",
];

export type Region = "africa" | "other";

export const useUserRegion = () => {
  const [region, setRegion] = useState<Region | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const detect = async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        const data = await res.json();
        const countryCode = data.country_code;
        setRegion(
          AFRICAN_COUNTRIES.indexOf(countryCode) !== -1 ? "africa" : "other",
        );
      } catch {
        setRegion("other"); // safe default
      } finally {
        setLoading(false);
      }
    };

    detect();
  }, []);

  return { region, loading };
};