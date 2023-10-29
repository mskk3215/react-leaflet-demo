import "./App.css";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import { center, area } from "@turf/turf";
import { Box, Autocomplete, TextField } from "@mui/material";

const defaultCenter = [35.3628, 138.7307];
const DEFAULT_ZOOM = 3;

const calculateZoomSize = (prefectureName) =>
  ["北海道", "沖縄", "東京都"].includes(prefectureName) ? 5 : 7;

const useMapData = () => {
  const [prefectureData, setPrefectureData] = useState(null);
  const [cityData, setCityData] = useState(null);
  const [allPrefectures, setAllPrefectures] = useState([]);
  const [allCities, setAllCities] = useState([]);
  const [prefectureCoordinates, setPrefectureCoordinates] = useState({});

  useEffect(() => {
    const load = async () => {
      try {
        const [prefectureDataRes, prefectureCoordinateRes, cityDataRes] =
          await Promise.all([
            axios.get("./prefecture.geojson"),
            axios.get("./prefecture_coordinates.json"),
            axios.get("./city.geojson"),
          ]);

        const prefectureNames = prefectureDataRes.data.features.map(
          (feature) => feature.properties.name
        );
        setAllPrefectures(prefectureNames);
        setPrefectureData(prefectureDataRes.data);
        setPrefectureCoordinates(prefectureCoordinateRes.data);
        setCityData(cityDataRes.data);
      } catch (error) {
        console.error("Error loading map data:", error);
      }
    };
    load();
  }, []);

  return {
    prefectureData,
    cityData,
    allPrefectures,
    allCities,
    setAllCities,
    prefectureCoordinates,
  };
};

export const App = () => {
  const {
    prefectureData,
    cityData,
    allPrefectures,
    allCities,
    setAllCities,
    prefectureCoordinates,
  } = useMapData();
  const [selectedPref, setSelectedPref] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [inputValue, setInputValue] = useState("");

  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [zoomSize, setZoomSize] = useState(DEFAULT_ZOOM);

  // 都道府県入力欄の変更時の処理
  const handlePrefectureChange = (_, newValue) => {
    setSelectedPref(newValue);
    setInputValue("");
    setAllCities([]);
    setSelectedCity(null);

    if (newValue) {
      const newCenter = prefectureCoordinates[newValue] || defaultCenter;
      setMapCenter(newCenter);
      setZoomSize(calculateZoomSize(newValue));

      const cityNamesForSelectedPref = cityData.features
        .filter((feature) => feature.properties.N03_001 === newValue)
        .map((feature) => {
          const city = feature.properties.N03_003 || "";
          const district = feature.properties.N03_004 || "";
          return `${city}${district}`.trim();
        });
      setAllCities(cityNamesForSelectedPref);
    } else {
      setMapCenter(defaultCenter);
      setZoomSize(3);
    }
  };

  // 市町村入力欄の変更時の処理
  const handleCityChange = (e, newValue) => {
    setSelectedCity(newValue);
  };

  // 境界線データを取得
  const displayData = useMemo(() => {
    if (selectedCity) {
      return {
        features: cityData
          ? cityData.features.filter(
              (feature) =>
                `${feature.properties.N03_003 || ""}${
                  feature.properties.N03_004 || ""
                }`.trim() === selectedCity
            )
          : [],
      };
    } else if (selectedPref) {
      return {
        ...prefectureData,
        features: prefectureData
          ? prefectureData.features.filter(
              (feature) => feature.properties.name === selectedPref
            )
          : [],
      };
    } else {
      return prefectureData;
    }
  }, [selectedCity, selectedPref, prefectureData]);

  // 市町村の中心座標、ズームサイズを計算
  useEffect(() => {
    if (!selectedPref) return;
    const feature = displayData.features[0];
    // 中心座標を計算
    const centroid = center(feature);
    const [averageLng, averageLat] = centroid.geometry.coordinates;
    if (averageLng && averageLat) {
      setMapCenter([averageLat, averageLng]);
    }
    // zoomサイズを計算
    if (selectedCity === null) {
      setZoomSize(calculateZoomSize(selectedPref));
      setMapCenter(prefectureCoordinates[selectedPref]);
      return;
    }
    const squareMeters = area(feature);
    let zoomSize;
    if (squareMeters < 100000000) {
      zoomSize = 11;
    } else if (squareMeters < 300000000) {
      zoomSize = 10;
    } else {
      zoomSize = 7;
    }

    setZoomSize(zoomSize);
  }, [selectedCity]);

  return (
    <Box
      sx={{
        marginTop: "20px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box
        sx={{
          marginTop: "20px",
          display: "flex",
          flexDirection: "row",
        }}
      >
        <Autocomplete
          sx={{ width: 200, pl: 1 }}
          options={allPrefectures}
          onChange={handlePrefectureChange}
          renderInput={(params) => (
            <TextField {...params} label="都道府県を選択" variant="standard" />
          )}
        />
        <Autocomplete
          sx={{ width: 200, pl: 1 }}
          options={allCities}
          onChange={handleCityChange}
          value={inputValue}
          onInputChange={(e, newInputValue) => {
            setInputValue(newInputValue);
          }}
          renderInput={(params) => (
            <TextField {...params} label="市町村を選択" variant="standard" />
          )}
        />
      </Box>
      <Box
        sx={{
          width: "40vw",
          height: "20vw",
        }}
      >
        <MapContainer
          key={mapCenter}
          center={mapCenter}
          zoom={zoomSize}
          zoomControl={false}
          id="map"
        >
          <TileLayer
            attribution='© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {displayData && (
            <GeoJSON
              key={selectedCity || selectedPref || "alls"}
              data={displayData}
              style={() => ({
                color: "red",
                weight: 3,
                fillColor: "#ffcccc",
                fillOpacity: 0.5,
              })}
            />
          )}
        </MapContainer>
      </Box>
    </Box>
  );
};
