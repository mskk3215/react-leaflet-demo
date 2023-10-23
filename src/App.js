import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Autocomplete, TextField } from "@mui/material";

const defaultCenter = [35.3628, 138.7307];

export const App = () => {
  const [data, setData] = useState(null);
  const [allPrefectures, setAllPrefectures] = useState([]);
  const [selectedPref, setSelectedPref] = useState(null);
  const [mapCenter, setMapCenter] = useState(defaultCenter);
  const [prefectureCoordinates, setPrefectureCoordinates] = useState({});
  const [zoomSize, setZoomSize] = useState(3);

  // 都道府県の境界、都道府県の中心座標を読み込み
  useEffect(() => {
    const load = async () => {
      let japanData = await axios.get("./japan.geojson");
      if (japanData) {
        const prefectureNames = japanData.data.features.map(
          (feature) => feature.properties.name
        );
        setAllPrefectures(prefectureNames);
        setData(japanData.data);
      }

      let prefectureData = await axios.get("./prefecture_coordinates.json");
      if (prefectureData) {
        setPrefectureCoordinates(prefectureData.data);
      }
    };
    load();
  }, []);

  // 都道府県が選択されたら、その都道府県の境界を表示
  const handlePrefectureChange = (_, newValue) => {
    setSelectedPref(newValue);
    if (newValue) {
      if (prefectureCoordinates[newValue]) {
        setMapCenter(prefectureCoordinates[newValue]);
      }
      if (newValue === "北海道") {
        setZoomSize(5);
      } else {
        setZoomSize(7);
      }
    } else {
      setMapCenter(defaultCenter);
      setZoomSize(3);
    }
  };

  // 選択された都道府県の境界をフィルタリング
  const displayData = selectedPref
    ? {
        ...data,
        features: data
          ? data.features.filter(
              (feature) => feature.properties.name === selectedPref
            )
          : [],
      }
    : data;

  return (
    <Box
      sx={{
        marginTop: "20px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Box>
        <Autocomplete
          sx={{ width: 200, pl: 1 }}
          options={allPrefectures}
          onChange={handlePrefectureChange}
          renderInput={(params) => (
            <TextField {...params} label="都道府県を選択" variant="standard" />
          )}
        />
      </Box>
      <Box
        sx={{
          width: "30vw",
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
              key={selectedPref || "alls"}
              data={displayData}
              style={() => ({
                color: "red",
                weight: 2,
              })}
            />
          )}
        </MapContainer>
      </Box>
    </Box>
  );
};
