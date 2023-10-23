import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { Box, Autocomplete, TextField } from "@mui/material";

const center = [35.3628, 138.7307];

export const App = () => {
  const [data, setData] = useState(null);
  const [allPrefectures, setAllPrefectures] = useState([]);
  const [selectedPref, setSelectedPref] = useState(null);

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
    };
    load();
  }, []);

  const handlePrefectureChange = (_, newValue) => {
    setSelectedPref(newValue);
  };

  const filteredData = {
    ...data,
    features: data
      ? data.features.filter(
          (feature) => feature.properties.name === selectedPref
        )
      : [],
  };

  return (
    <Box
      sx={{
        marginTop: "20px",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <Autocomplete
        options={allPrefectures}
        onChange={handlePrefectureChange}
        renderInput={(params) => (
        )}
      />
        <MapContainer center={center} zoom={5} zoomControl={false} id="map">
          sx={{ width: 200, pl: 1 }}
            <TextField {...params} label="都道府県を選択" variant="standard" />
      <Box
        sx={{
          width: "30vw",
          height: "20vw",
        }}
      >
          <TileLayer
            attribution='© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {selectedPref && <GeoJSON key={selectedPref} data={filteredData} />}
              style={() => ({
                color: "red",
                weight: 2,
              })}
        </MapContainer>
      </Box>
    </Box>
  );
};
