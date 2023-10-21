import { MapContainer, TileLayer, GeoJSON } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import "./App.css";
import { useEffect, useState } from "react";
import axios from "axios";
const center = [35.3628, 138.7307];

function App() {
  const [data, setData] = useState("");
  useEffect(() => {
    const load = async () => {
      let shizuoka = await axios.get("./shizuoka.geojson");
      console.log(shizuoka);
      if (shizuoka) setData(shizuoka.data);
    };
    load();
  }, []);

  return (
    <MapContainer center={center} zoom={5} zoomControl={false} id="map">
      <TileLayer
        attribution='© <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      {data && <GeoJSON data={data} />}
    </MapContainer>
  );
}

export default App;
