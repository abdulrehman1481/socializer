import React, { useEffect, useState } from "react";
import { View, StyleSheet } from "react-native";
import { WebView } from "react-native-webview";
import { db } from '../../firebase';

const Map = () => {
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const snapshot = await db.collection('societies').get();
        const allLocations = [];
        snapshot.forEach(doc => {
          const societyData = doc.data();
          if (societyData.locations) {
            societyData.locations.forEach(location => {
              if (location.coordinates && location.coordinates.length === 2) {
                allLocations.push(location);
              } else {
                console.warn(`Invalid location data for ${location.name}`, location);
              }
            });
          }
        });
        setLocations(allLocations);
      } catch (error) {
        console.error("Error fetching locations: ", error);
      }
    };
    
    fetchLocations();
  }, []);

  const mapHTML = `
  <!DOCTYPE html>
  <html>
    <head>
      <meta name="viewport" content="initial-scale=1.0, user-scalable=no" />
      <style>
        html, body, #map {
          height: 100%;
          margin: 0;
          padding: 0;
        }
        .popup-content {
          width: 200px;
          font-family: Arial, sans-serif;
        }
      </style>
      <link
        rel="stylesheet"
        href="https://unpkg.com/leaflet@1.7.1/dist/leaflet.css"
      />
      <script src="https://unpkg.com/leaflet@1.7.1/dist/leaflet.js"></script>
    </head>
    <body>
      <div id="map"></div>
      <script>
        var map = L.map('map').setView([33.6844, 73.0479], 13); // Default view (NUST coordinates)
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: 'Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
        }).addTo(map);

        ${locations
          .filter(loc => loc.coordinates && loc.coordinates.length === 2)
          .map(loc => `
            L.marker([${loc.coordinates[0]}, ${loc.coordinates[1]}])
              .addTo(map)
              .bindPopup('<div class="popup-content"><strong>${loc.name}</strong><br>${loc.info}</div>');
          `)
          .join('')}
      </script>
    </body>
  </html>
  `;

  return (
    <View style={styles.container}>
      <WebView
        originWhitelist={['*']}
        source={{ html: mapHTML }}
        style={styles.webview}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  webview: {
    flex: 1,
  },
});

export default Map;
