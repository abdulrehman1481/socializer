import React, { useEffect, useState } from "react";
import { StyleSheet, View, Modal, TouchableOpacity, ScrollView, Text, Image } from "react-native";
import MapView, { Marker, PROVIDER_GOOGLE } from "react-native-maps";
import { db } from '../firebase';

export default function MapScreen() {
  const [locations, setLocations] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);

  useEffect(() => {
    const fetchEvents = (societyData) => {
      if (societyData.events) {
        return societyData.events; // Directly return the events array from society data
      }
      return []; // Return an empty array if no events found
    };
    
    

    const fetchLocations = async () => {
      try {
        const snapshot = await db.collection('societies').get();
        const allLocations = [];
    
        for (const doc of snapshot.docs) {
          const societyData = doc.data();
          console.log(`Society Data:`, societyData);
          
          if (societyData.locations) {
            for (const location of societyData.locations) {
              if (location.coordinates && location.coordinates.length === 2) {
                // Fetch events directly from the society data
                const events = fetchEvents(societyData);
                console.log(`Events for Society ${doc.id}:`, events);
                
                allLocations.push({
                  ...location,
                  societyName: societyData.name,
                  logo: societyData.logo,
                  mainWork: societyData.mainWork,
                  isOpenForInterviews: societyData.isOpenForInterviews || false,
                  events,
                  description: societyData.description,
                  slogan: societyData.slogan,
                });
              }
            }
          }
        }
        setLocations(allLocations);
      } catch (error) {
        console.error("Error fetching locations: ", error);
      }
    };
    
    
    
    fetchLocations();
  }, []);

  const handleMarkerPress = (location) => {
    setSelectedLocation(location);
    setModalVisible(true);
  };

  const renderModalContent = () => {
    if (!selectedLocation) return null;
  
    const { societyName, logo, slogan, events, isOpenForInterviews } = selectedLocation;
    console.log("Selected Location Events:", events);
  
    return (
      <>
        <Image source={{ uri: logo }} style={styles.logo} />
        <Text style={styles.name}>{societyName}</Text>
        <Text style={styles.slogan}>{slogan}</Text>
  
        {isOpenForInterviews && (
          <Text style={styles.infoText}>This society is taking interviews here.</Text>
        )}
  
        {events && events.length > 0 ? (
          <>
            <Text style={styles.infoText}>Upcoming Events:</Text>
            {events.map((event, index) => (
              <View key={event.id || index} style={styles.eventCard}>
                <Text style={styles.eventText}>{event.name}</Text>
                <Text style={styles.eventDate}>Date: {new Date(event.date).toLocaleDateString()}</Text>
                <Text style={styles.eventDescription}>{event.description}</Text>
              </View>
            ))}
          </>
        ) : (
          <Text style={styles.infoText}>No upcoming events at this location.</Text>
        )}
      </>
    );
  };

  return (
    <View style={styles.container}>
      <MapView
        style={styles.map}
        initialRegion={{
          latitude: 33.6844,
          longitude: 73.0479,
          latitudeDelta: 0.0922,
          longitudeDelta: 0.0421,
        }}
        provider={PROVIDER_GOOGLE}
      >
        {locations.map((location, index) => {
          let markerColor = "green"; // Default color
          let title = location.societyName;

          if (location.isOpenForInterviews && location.events && location.events.length > 0) {
            markerColor = "purple"; // Color for open for interviews with events
          } else if (location.isOpenForInterviews) {
            markerColor = "blue"; // Color for open for interviews only
          } else if (location.events && location.events.length > 0) {
            markerColor = "orange"; // Color for societies with events only
          }

          return (
            <Marker
              key={index}
              coordinate={{
                latitude: location.coordinates[0],
                longitude: location.coordinates[1],
              }}
              title={title}
              pinColor={markerColor}
              onPress={() => handleMarkerPress(location)}
            />
          );
        })}
      </MapView>

      {selectedLocation && (
        <Modal
          animationType="slide"
          transparent={true}
          visible={modalVisible}
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <ScrollView>
                {renderModalContent()}
              </ScrollView>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setModalVisible(false)}
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
  slogan: {
    fontSize: 16,
    color: '#666',
    marginBottom: 5,
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
});
