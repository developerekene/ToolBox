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

// import { useEffect, useState } from "react";
// import * as Location from "expo-location";

// const AFRICAN_COUNTRIES: string[] = [
//   "NG",
//   "GH",
//   "KE",
//   "ZA",
//   "TZ",
//   "UG",
//   "RW",
//   "ET",
//   "SN",
//   "CI",
//   "CM",
//   "MZ",
//   "ZM",
//   "ZW",
//   "BW",
//   "NA",
//   "MG",
//   "MU",
//   "EG",
//   "MA",
//   "TN",
//   "DZ",
//   "LY",
//   "SD",
//   "AO",
//   "CD",
//   "CG",
// ];

// export type Region = "africa" | "other";

// export const useUserRegion = () => {
//   const [region, setRegion] = useState<Region | null>(null);
//   const [loading, setLoading] = useState(true);

//   useEffect(() => {
//     const detect = async () => {
//       try {
//         // 1. Ask for location permission
//         const { status } = await Location.requestForegroundPermissionsAsync();

//         if (status !== "granted") {
//           // Fallback: use IP-based detection
//           const res = await fetch("https://ipapi.co/json/");
//           const data = await res.json();
//           const countryCode = data.country_code;
//           setRegion(
//             AFRICAN_COUNTRIES.indexOf(countryCode) !== -1 ? "africa" : "other",
//           );
//           return;
//         }

//         // 2. Get coordinates
//         const loc = await Location.getCurrentPositionAsync({});
//         const { latitude, longitude } = loc.coords;

//         // 3. Reverse geocode to get country
//         const [place] = await Location.reverseGeocodeAsync({
//           latitude,
//           longitude,
//         });
//         const countryCode = place.isoCountryCode ?? "";
//         setRegion(
//           //   AFRICAN_COUNTRIES.indexOf(countryCode) !== -1 ? "africa" : "other",
//           AFRICAN_COUNTRIES.indexOf(countryCode) !== -1 ? "africa" : "other",
//         );
//       } catch {
//         // Final fallback: IP detection
//         try {
//           const res = await fetch("https://ipapi.co/json/");
//           const data = await res.json();
//           setRegion(
//             AFRICAN_COUNTRIES.indexOf(data.country_code) !== -1
//               ? "africa"
//               : "other",
//           );
//         } catch {
//           setRegion("other"); // safe default
//         }
//       } finally {
//         setLoading(false);
//       }
//     };

//     detect();
//   }, []);

//   return { region, loading };
// };
