import React, { useEffect, useRef, useState } from "react";
import {
  StyleSheet,
  View,
  Modal,
  TouchableOpacity,
  ScrollView,
  Text,
  Image,
  ActivityIndicator,
  Alert,
} from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { db } from '../firebase';
import { useNavigation } from '@react-navigation/native';

export default function MapScreen() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);

  const mapRef = useRef(null);
  const navigation = useNavigation();

  useEffect(() => {
    const fetchLocations = async () => {
      try {
        const snapshot = await db.collection('societies').get();
        const allLocations = [];

        for (const doc of snapshot.docs) {
          const societyData = doc.data();

          if (societyData.locations) {
            for (const location of societyData.locations) {
              if (location.coordinates && location.coordinates.length === 2) {
                allLocations.push({
                  ...location,
                  societyName: societyData.name,
                  logo: societyData.logo,
                  events: societyData.events || [],
                  isOpenForInterviews: societyData.isOpenForInterviews || false,
                  description: societyData.description,
                });
              }
            }
          }
        }
        setLocations(allLocations);
      } catch (error) {
        console.error("Error fetching locations: ", error);
        Alert.alert("Error", "There was an issue fetching the locations. Please try again.");
      } finally {
        setLoading(false);
      }
    };

    fetchLocations();
  }, []);

  const handleMarkerPress = (location) => {
    mapRef.current.animateToRegion(
      {
        latitude: location.coordinates[0],
        longitude: location.coordinates[1],
        latitudeDelta: 0.005,
        longitudeDelta: 0.005,
      },
      1000
    );

    setSelectedLocation(location);
    setModalVisible(true);
  };

  const navigateToSocietyDetail = () => {
    if (selectedLocation) {
      navigation.navigate("SocietyDetail", { societyId: selectedLocation.id });
      setModalVisible(false);
    }
  };

  const renderModalContent = () => {
    if (!selectedLocation) return null;

    const { societyName, logo, isOpenForInterviews, events } = selectedLocation;

    return (
      <>
        <Image source={{ uri: logo }} style={styles.logo} />
        <Text style={styles.name}>{societyName}</Text>
        
        {isOpenForInterviews && (
          <Text style={styles.infoText}>This society is taking interviews here.</Text>
        )}

        {events.length > 0 ? (
          <>
            <Text style={styles.infoText}>Upcoming Events:</Text>
            {events.map((event, index) => (
              <View key={event.id || index} style={styles.eventCard}>
                <TouchableOpacity onPress={() => handleEventPress(event)}>
                  <Text style={styles.eventText}>{event.name}</Text>
                  <Text style={styles.eventDate}>Date: {new Date(event.date).toLocaleDateString()}</Text>
                  <Text style={styles.eventDescription}>{event.description}</Text>
                </TouchableOpacity>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.infoText}>No upcoming events at this location.</Text>
        )}

        <TouchableOpacity style={styles.navigateButton} onPress={navigateToSocietyDetail}>
          <Text style={styles.navigateButtonText}>View Society Details</Text>
        </TouchableOpacity>
      </>
    );
  };

  return (
    <View style={styles.container}>
      {loading ? (
        <ActivityIndicator size="large" color="#2196F3" style={styles.loader} />
      ) : (
        <MapView
          ref={mapRef}
          style={styles.map}
          initialRegion={{
            latitude: 33.6426,
            longitude: 72.9906,
            latitudeDelta: 0.0922,
            longitudeDelta: 0.0421,
          }}
          provider={PROVIDER_GOOGLE}
        >
          {locations.map((location, index) => {
            const markerColor = location.isOpenForInterviews ? "green" : "orange";

            return (
              <Marker
                key={index}
                coordinate={{
                  latitude: location.coordinates[0],
                  longitude: location.coordinates[1],
                }}
                title={location.societyName}
                pinColor={markerColor}
                onPress={() => handleMarkerPress(location)}
              />
            );
          })}
        </MapView>
      )}

      {selectedLocation && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => {
            setModalVisible(false);
            setSelectedLocation(null);
          }}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView>
                {renderModalContent()}
              </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => {
                  setModalVisible(false);
                  setSelectedLocation(null);
                }}
              >
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  map: {
    width: "100%",
    height: "100%",
  },
  loader: {
    flex: 1,
    justifyContent: "center",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0, 0, 0, 0.5)",
  },
  modalContent: {
    width: '90%',
    maxHeight: '80%',
    backgroundColor: "white",
    borderRadius: 10,
    padding: 20,
    alignItems: "center",
  },
  logo: {
    width: 100,
    height: 100,
    borderRadius: 10,
    marginBottom: 10,
  },
  name: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
  },
  infoText: {
    fontSize: 16,
    color: '#555',
    marginVertical: 2,
  },
  eventCard: {
    marginTop: 10,
    padding: 10,
    backgroundColor: '#f9f9f9',
    borderRadius: 5,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 1 },
    shadowRadius: 1,
    elevation: 1,
  },
  eventText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  eventDate: {
    fontSize: 14,
    color: '#777',
  },
  eventDescription: {
    fontSize: 14,
    color: '#555',
  },
  closeButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#2196F3",
    borderRadius: 5,
  },
  closeButtonText: {
    color: "white",
    fontWeight: "bold",
  },
  navigateButton: {
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 20,
    backgroundColor: "#4CAF50",
    borderRadius: 5,
  },
  navigateButtonText: {
    color: "white",
    fontWeight: "bold",
  },
});
